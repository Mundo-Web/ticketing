<?php

namespace App\Services;

use App\Models\Device;
use App\Models\NinjaOneAlert;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class NinjaOneService
{
    protected $apiUrl;
    protected $apiKey;
    protected $organizationId;

    public function __construct()
    {
        $this->apiUrl = config('services.ninjaone.api_url');
        $this->apiKey = config('services.ninjaone.api_key');
        $this->organizationId = config('services.ninjaone.organization_id');
    }

    /**
     * Get device information from NinjaOne API
     */
    public function getDevice(string $deviceId): ?array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept' => 'application/json',
            ])->get("{$this->apiUrl}/v2/organization/{$this->organizationId}/devices/{$deviceId}");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Failed to fetch device from NinjaOne', [
                'device_id' => $deviceId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return null;

        } catch (Exception $e) {
            Log::error('Error fetching device from NinjaOne API', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);

            return null;
        }
    }

    /**
     * Get all devices from NinjaOne API
     */
    public function getAllDevices(): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept' => 'application/json',
            ])->get("{$this->apiUrl}/v2/organization/{$this->organizationId}/devices");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Failed to fetch devices from NinjaOne', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return [];

        } catch (Exception $e) {
            Log::error('Error fetching devices from NinjaOne API', [
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }

    /**
     * Sync device information from NinjaOne
     */
    public function syncDevice(Device $device): bool
    {
        if (!$device->ninjaone_device_id) {
            return false;
        }

        try {
            $ninjaOneDevice = $this->getDevice($device->ninjaone_device_id);

            if (!$ninjaOneDevice) {
                return false;
            }

            $device->update([
                'ninjaone_node_id' => $ninjaOneDevice['nodeId'] ?? null,
                'ninjaone_serial_number' => $ninjaOneDevice['serialNumber'] ?? null,
                'ninjaone_asset_tag' => $ninjaOneDevice['assetTag'] ?? null,
                'ninjaone_metadata' => $ninjaOneDevice,
                'ninjaone_last_seen' => now(),
            ]);

            Log::info('Device synced with NinjaOne', [
                'device_id' => $device->id,
                'ninjaone_device_id' => $device->ninjaone_device_id
            ]);

            return true;

        } catch (Exception $e) {
            Log::error('Error syncing device with NinjaOne', [
                'device_id' => $device->id,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Get alerts for a specific device from NinjaOne
     */
    public function getDeviceAlerts(string $deviceId): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept' => 'application/json',
            ])->get("{$this->apiUrl}/v2/organization/{$this->organizationId}/devices/{$deviceId}/alerts");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Failed to fetch device alerts from NinjaOne', [
                'device_id' => $deviceId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return [];

        } catch (Exception $e) {
            Log::error('Error fetching device alerts from NinjaOne API', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }

    /**
     * Test API connection
     */
    public function testConnection(): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept' => 'application/json',
            ])->get("{$this->apiUrl}/v2/organization/{$this->organizationId}");

            return $response->successful();

        } catch (Exception $e) {
            Log::error('NinjaOne API connection test failed', [
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Map NinjaOne alert severity to local severity
     */
    public function mapSeverity(string $ninjaOneSeverity): string
    {
        $severityMap = [
            1 => 'low',
            2 => 'medium', 
            3 => 'high',
            4 => 'critical',
            'info' => 'low',
            'warning' => 'medium',
            'error' => 'high',
            'critical' => 'critical',
        ];

        return $severityMap[$ninjaOneSeverity] ?? 'medium';
    }

    /**
     * Map NinjaOne alert type to ticket category
     */
    public function mapAlertTypeToCategory(string $alertType): string
    {
        $categoryMap = [
            'hardware' => 'Hardware',
            'software' => 'Software',
            'network' => 'Network',
            'security' => 'Security',
            'performance' => 'Performance',
            'disk' => 'Hardware',
            'memory' => 'Hardware',
            'cpu' => 'Hardware',
            'service' => 'Software',
            'backup' => 'Software',
        ];

        foreach ($categoryMap as $key => $category) {
            if (stripos($alertType, $key) !== false) {
                return $category;
            }
        }

        return 'General';
    }
}
