<?php

namespace App\Console\Commands;

use App\Services\NinjaOneService;
use App\Models\Device;
use App\Models\NinjaOneAlert;
use Illuminate\Console\Command;
use Exception;

class TestNinjaOneAlertsSync extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'ninjaone:test-alerts-sync
                          {--device= : Test with a specific device ID}
                          {--limit=5 : Limit number of devices to test}';

    /**
     * The console command description.
     */
    protected $description = 'Test NinjaOne alerts synchronization functionality';

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
        $this->info('🧪 Testing NinjaOne alerts synchronization...');

        try {
            // Test API connectivity
            $this->testApiConnectivity();

            // Test device alerts fetching
            $this->testDeviceAlertsFetching();

            // Test database operations
            $this->testDatabaseOperations();

            $this->info('✅ All tests completed successfully!');
            
        } catch (Exception $e) {
            $this->error('❌ Test failed: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Test API connectivity
     */
    protected function testApiConnectivity()
    {
        $this->info('🔗 Testing NinjaOne API connectivity...');

        try {
            // Test general alerts endpoint
            $alerts = $this->ninjaOneService->getAlerts();
            $this->info("   ✓ API is accessible - found " . count($alerts) . " total alerts");
        } catch (Exception $e) {
            $this->warn("   ⚠️  General alerts API test failed: " . $e->getMessage());
        }

        // Test with a specific device
        $device = Device::whereNotNull('ninjaone_device_id')->first();
        if ($device) {
            try {
                $deviceAlerts = $this->ninjaOneService->getDeviceAlerts($device->ninjaone_device_id);
                $this->info("   ✓ Device alerts API working - found " . count($deviceAlerts) . " alerts for device: " . $device->name);
            } catch (Exception $e) {
                $this->warn("   ⚠️  Device alerts API test failed for {$device->name}: " . $e->getMessage());
            }
        } else {
            $this->warn("   ⚠️  No devices with NinjaOne integration found for testing");
        }
    }

    /**
     * Test device alerts fetching
     */
    protected function testDeviceAlertsFetching()
    {
        $this->info('📋 Testing device alerts fetching...');

        $deviceId = $this->option('device');
        $limit = (int) $this->option('limit');

        if ($deviceId) {
            $devices = Device::where(function($query) use ($deviceId) {
                $query->where('id', $deviceId)
                      ->orWhere('ninjaone_device_id', $deviceId);
            })
            ->whereNotNull('ninjaone_device_id')
            ->limit(1)
            ->get();
        } else {
            $devices = Device::whereNotNull('ninjaone_device_id')
                           ->where('ninjaone_device_id', '!=', '')
                           ->limit($limit)
                           ->get();
        }

        if ($devices->isEmpty()) {
            $this->warn('   ⚠️  No devices found with NinjaOne integration');
            return;
        }

        $this->info("   Testing with {$devices->count()} device(s)");

        foreach ($devices as $device) {
            $this->info("   📱 Testing device: {$device->name} (NinjaOne ID: {$device->ninjaone_device_id})");
            
            try {
                $alerts = $this->ninjaOneService->getDeviceAlerts($device->ninjaone_device_id);
                $this->info("      ✓ Found " . count($alerts) . " alerts");

                if (!empty($alerts)) {
                    $firstAlert = $alerts[0];
                    $this->info("      📄 Sample alert:");
                    $this->info("         - Title: " . ($firstAlert['title'] ?? $firstAlert['subject'] ?? 'N/A'));
                    $this->info("         - Severity: " . ($firstAlert['severity'] ?? $firstAlert['priority'] ?? 'N/A'));
                    $this->info("         - Status: " . ($firstAlert['status'] ?? 'N/A'));
                    $this->info("         - Type: " . ($firstAlert['type'] ?? $firstAlert['category'] ?? 'N/A'));
                }
            } catch (Exception $e) {
                $this->error("      ❌ Failed to fetch alerts: " . $e->getMessage());
            }
        }
    }

    /**
     * Test database operations
     */
    protected function testDatabaseOperations()
    {
        $this->info('💾 Testing database operations...');

        // Test reading existing alerts
        $existingAlerts = NinjaOneAlert::count();
        $this->info("   📊 Current alerts in database: {$existingAlerts}");

        // Test creating a sample alert (if we have a device)
        $device = Device::whereNotNull('ninjaone_device_id')->first();
        if ($device) {
            $this->info("   🆕 Testing alert creation...");
            
            $testAlert = [
                'id' => 'test-' . uniqid(),
                'title' => 'Test Alert - ' . now()->format('Y-m-d H:i:s'),
                'description' => 'This is a test alert created by the sync test command',
                'severity' => 'warning',
                'status' => 'open',
                'type' => 'test',
                'created_at' => now()->toISOString(),
            ];

            try {
                $alert = NinjaOneAlert::create([
                    'ninjaone_alert_id' => $testAlert['id'],
                    'device_id' => $device->id,
                    'ninjaone_device_id' => $device->ninjaone_device_id,
                    'title' => $testAlert['title'],
                    'description' => $testAlert['description'],
                    'severity' => $testAlert['severity'],
                    'status' => $testAlert['status'],
                    'alert_type' => $testAlert['type'],
                    'raw_data' => $testAlert,
                ]);

                $this->info("      ✓ Test alert created successfully (ID: {$alert->id})");

                // Test updating the alert
                $alert->update(['status' => 'acknowledged', 'acknowledged_at' => now()]);
                $this->info("      ✓ Test alert updated successfully");

                // Clean up test alert
                $alert->delete();
                $this->info("      ✓ Test alert cleaned up");

            } catch (Exception $e) {
                $this->error("      ❌ Database operation failed: " . $e->getMessage());
            }
        }

        // Show some statistics
        $statusCounts = NinjaOneAlert::groupBy('status')
                                   ->selectRaw('status, count(*) as count')
                                   ->pluck('count', 'status')
                                   ->toArray();

        if (!empty($statusCounts)) {
            $this->info("   📈 Alert status distribution:");
            foreach ($statusCounts as $status => $count) {
                $this->info("      - {$status}: {$count}");
            }
        }

        $severityCounts = NinjaOneAlert::groupBy('severity')
                                     ->selectRaw('severity, count(*) as count')
                                     ->pluck('count', 'severity')
                                     ->toArray();

        if (!empty($severityCounts)) {
            $this->info("   🚨 Alert severity distribution:");
            foreach ($severityCounts as $severity => $count) {
                $this->info("      - {$severity}: {$count}");
            }
        }
    }
}