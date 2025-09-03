<?php

namespace App\Console\Commands;

use App\Models\NinjaOneAlert;
use App\Models\Device;
use App\Services\NinjaOneService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Exception;

class SyncNinjaOneAlerts extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'ninjaone:sync-alerts
                          {--force : Force sync even if last sync was recent}
                          {--device= : Sync alerts for a specific device ID}
                          {--cleanup : Remove resolved alerts older than 30 days}';

    /**
     * The console command description.
     */
    protected $description = 'Synchronize alerts from NinjaOne API to local database';

    protected NinjaOneService $ninjaOneService;

    /**
     * Create a new command instance.
     */
    public function __construct(NinjaOneService $ninjaOneService)
    {
        parent::__construct();
        $this->ninjaOneService = $ninjaOneService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting NinjaOne alerts synchronization...');

        try {
            // Check if cleanup is requested
            if ($this->option('cleanup')) {
                $this->cleanupOldAlerts();
            }

            // Get devices to sync
            $deviceId = $this->option('device');
            if ($deviceId) {
                $this->syncDeviceAlerts($deviceId);
            } else {
                $this->syncAllDeviceAlerts();
            }

            $this->info('✅ NinjaOne alerts synchronization completed successfully!');
            
        } catch (Exception $e) {
            $this->error('❌ Error during synchronization: ' . $e->getMessage());
            Log::error('NinjaOne alerts sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }

        return 0;
    }

    /**
     * Sync alerts for all devices
     */
    protected function syncAllDeviceAlerts()
    {
        $this->info('📋 Fetching all devices with NinjaOne integration...');

        // Get all devices that have ninjaone_device_id
        $devices = Device::whereNotNull('ninjaone_device_id')
                         ->where('ninjaone_device_id', '!=', '')
                         ->with(['tenants', 'brand', 'system'])
                         ->get();

        if ($devices->isEmpty()) {
            $this->warn('⚠️  No devices found with NinjaOne integration.');
            return;
        }

        $this->info("Found {$devices->count()} devices to sync");

        $progressBar = $this->output->createProgressBar($devices->count());
        $progressBar->start();

        $totalSynced = 0;
        $errors = 0;

        foreach ($devices as $device) {
            try {
                $synced = $this->syncDeviceAlertsById($device->ninjaone_device_id, $device);
                $totalSynced += $synced;
            } catch (Exception $e) {
                $errors++;
                Log::warning('Failed to sync alerts for device', [
                    'device_id' => $device->id,
                    'ninjaone_device_id' => $device->ninjaone_device_id,
                    'error' => $e->getMessage()
                ]);
            }
            
            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();

        $this->info("📊 Synchronization Summary:");
        $this->info("   • Total alerts synced: {$totalSynced}");
        $this->info("   • Devices processed: {$devices->count()}");
        if ($errors > 0) {
            $this->warn("   • Errors encountered: {$errors}");
        }
    }

    /**
     * Sync alerts for a specific device
     */
    protected function syncDeviceAlerts($deviceId)
    {
        $device = Device::where('ninjaone_device_id', $deviceId)
                       ->orWhere('id', $deviceId)
                       ->with(['apartment.building', 'tenants'])
                       ->first();

        if (!$device) {
            $this->error("❌ Device not found: {$deviceId}");
            return;
        }

        if (!$device->ninjaone_device_id) {
            $this->error("❌ Device does not have NinjaOne integration: {$device->name}");
            return;
        }

        $this->info("🔄 Syncing alerts for device: {$device->name} (NinjaOne ID: {$device->ninjaone_device_id})");
        
        $synced = $this->syncDeviceAlertsById($device->ninjaone_device_id, $device);
        $this->info("✅ Synced {$synced} alerts for device: {$device->name}");
    }

    /**
     * Sync alerts for a specific NinjaOne device ID
     */
    protected function syncDeviceAlertsById($ninjaOneDeviceId, $device = null)
    {
        // Get alerts from NinjaOne API
        $apiAlerts = $this->ninjaOneService->getDeviceAlerts($ninjaOneDeviceId);
        
        if (empty($apiAlerts)) {
            return 0;
        }

        $syncedCount = 0;

        foreach ($apiAlerts as $apiAlert) {
            try {
                // Check if alert already exists
                $existingAlert = NinjaOneAlert::where('ninjaone_alert_id', $apiAlert['id'])->first();

                if ($existingAlert) {
                    // Update existing alert if status changed
                    $updated = $this->updateExistingAlert($existingAlert, $apiAlert);
                    if ($updated) {
                        $syncedCount++;
                    }
                } else {
                    // Create new alert
                    $this->createNewAlert($apiAlert, $ninjaOneDeviceId, $device);
                    $syncedCount++;
                }
            } catch (Exception $e) {
                Log::warning('Failed to process individual alert', [
                    'ninjaone_alert_id' => $apiAlert['id'] ?? 'unknown',
                    'device_id' => $ninjaOneDeviceId,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return $syncedCount;
    }

    /**
     * Update existing alert
     */
    protected function updateExistingAlert(NinjaOneAlert $alert, array $apiAlert): bool
    {
        $needsUpdate = false;
        $originalStatus = $alert->status;

        // Update status if changed
        if (isset($apiAlert['status']) && $alert->status !== $apiAlert['status']) {
            $alert->status = $apiAlert['status'];
            $needsUpdate = true;
        }

        // Update severity if changed
        if (isset($apiAlert['severity']) && $alert->severity !== $apiAlert['severity']) {
            $alert->severity = $apiAlert['severity'];
            $needsUpdate = true;
        }

        // Update resolved timestamp if status changed to resolved
        if ($alert->status === 'resolved' && !$alert->resolved_at) {
            $alert->resolved_at = now();
            $needsUpdate = true;
        }

        // Update acknowledged timestamp if status changed to acknowledged
        if ($alert->status === 'acknowledged' && !$alert->acknowledged_at) {
            $alert->acknowledged_at = now();
            $needsUpdate = true;
        }

        // Update raw data
        if (isset($apiAlert['raw_data']) || count($apiAlert) > 3) {
            $alert->raw_data = $apiAlert;
            $needsUpdate = true;
        }

        if ($needsUpdate) {
            $alert->save();
            
            if ($originalStatus !== $alert->status) {
                Log::info('NinjaOne alert status updated', [
                    'alert_id' => $alert->id,
                    'ninjaone_alert_id' => $alert->ninjaone_alert_id,
                    'old_status' => $originalStatus,
                    'new_status' => $alert->status
                ]);
            }
        }

        return $needsUpdate;
    }

    /**
     * Create new alert
     */
    protected function createNewAlert(array $apiAlert, $ninjaOneDeviceId, $device = null)
    {
        // Find the local device if not provided
        if (!$device) {
            $device = Device::where('ninjaone_device_id', $ninjaOneDeviceId)->first();
        }

        $alertData = [
            'ninjaone_alert_id' => $apiAlert['id'],
            'device_id' => $device?->id,
            'ninjaone_device_id' => $ninjaOneDeviceId,
            'title' => $apiAlert['title'] ?? $apiAlert['subject'] ?? 'NinjaOne Alert',
            'description' => $apiAlert['description'] ?? $apiAlert['message'] ?? 'No description available',
            'severity' => $this->normalizeSeverity($apiAlert['severity'] ?? $apiAlert['priority'] ?? 'medium'),
            'status' => $this->normalizeStatus($apiAlert['status'] ?? 'open'),
            'alert_type' => $apiAlert['type'] ?? $apiAlert['category'] ?? 'system',
            'raw_data' => $apiAlert,
            'created_at' => isset($apiAlert['created_at']) ? 
                           $this->parseNinjaOneDate($apiAlert['created_at']) : now(),
        ];

        // Set timestamps based on status
        if ($alertData['status'] === 'acknowledged') {
            $alertData['acknowledged_at'] = isset($apiAlert['acknowledged_at']) ?
                                          $this->parseNinjaOneDate($apiAlert['acknowledged_at']) : now();
        }

        if ($alertData['status'] === 'resolved') {
            $alertData['resolved_at'] = isset($apiAlert['resolved_at']) ?
                                      $this->parseNinjaOneDate($apiAlert['resolved_at']) : now();
        }

        $alert = NinjaOneAlert::create($alertData);

        Log::info('New NinjaOne alert created', [
            'alert_id' => $alert->id,
            'ninjaone_alert_id' => $alert->ninjaone_alert_id,
            'device_id' => $device?->id,
            'severity' => $alert->severity,
            'status' => $alert->status
        ]);

        return $alert;
    }

    /**
     * Normalize severity levels
     */
    protected function normalizeSeverity($severity): string
    {
        $severity = strtolower($severity);
        
        switch ($severity) {
            case 'critical':
            case 'high':
            case 'error':
                return 'critical';
            case 'warning':
            case 'medium':
            case 'warn':
                return 'warning';
            case 'info':
            case 'information':
            case 'low':
                return 'info';
            default:
                return 'warning';
        }
    }

    /**
     * Normalize status values
     */
    protected function normalizeStatus($status): string
    {
        $status = strtolower($status);
        
        switch ($status) {
            case 'acknowledged':
            case 'ack':
                return 'acknowledged';
            case 'resolved':
            case 'closed':
            case 'fixed':
                return 'resolved';
            case 'open':
            case 'active':
            case 'new':
            default:
                return 'open';
        }
    }

    /**
     * Parse NinjaOne date format
     */
    protected function parseNinjaOneDate($date)
    {
        try {
            return \Carbon\Carbon::parse($date);
        } catch (Exception $e) {
            return now();
        }
    }

    /**
     * Clean up old resolved alerts
     */
    protected function cleanupOldAlerts()
    {
        $this->info('🧹 Cleaning up old resolved alerts...');
        
        $cutoffDate = now()->subDays(30);
        
        $deletedCount = NinjaOneAlert::where('status', 'resolved')
                                    ->where('resolved_at', '<', $cutoffDate)
                                    ->delete();

        if ($deletedCount > 0) {
            $this->info("🗑️  Removed {$deletedCount} old resolved alerts (older than 30 days)");
            Log::info('Cleaned up old NinjaOne alerts', ['deleted_count' => $deletedCount]);
        } else {
            $this->info('✨ No old alerts to clean up');
        }
    }
}