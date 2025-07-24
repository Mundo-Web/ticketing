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
    protected $clientId;
    protected $clientSecret;
    protected $apiKey;
    protected $organizationId;
    protected $accessToken;

    public function __construct()
    {
        $this->apiUrl = config('services.ninjaone.api_url');
        $this->clientId = config('services.ninjaone.client_id');
        $this->clientSecret = config('services.ninjaone.client_secret');
        $this->apiKey = config('services.ninjaone.api_key');
        $this->organizationId = config('services.ninjaone.organization_id');
    }

    /**
     * Get OAuth access token from NinjaOne
     */
    protected function getAccessToken(): ?string
    {
        if ($this->accessToken) {
            return $this->accessToken;
        }

        try {
            $response = Http::asForm()->post("{$this->apiUrl}/ws/oauth/token", [
                'grant_type' => 'client_credentials',
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'scope' => 'monitoring'
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $this->accessToken = $data['access_token'];
                return $this->accessToken;
            }

            Log::error('Failed to get NinjaOne OAuth token', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return null;

        } catch (Exception $e) {
            Log::error('Error getting NinjaOne OAuth token', [
                'error' => $e->getMessage()
            ]);

            return null;
        }
    }

    /**
     * Get authorization headers for API requests
     */
    protected function getAuthHeaders(): array
    {
        if ($this->apiKey) {
            return [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept' => 'application/json',
            ];
        }

        $token = $this->getAccessToken();
        if (!$token) {
            return [];
        }

        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ];
    }

    /**
     * Get device information from NinjaOne API
     */
    public function getDevice(string $deviceId): ?array
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return null;
            }

            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/device/{$deviceId}");

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
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return [];
            }

            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/devices");

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
     * Get alerts for a specific device from NinjaOne using device ID
     */
    public function getDeviceAlerts(string $deviceId): array
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return [];
            }

            // Use the correct endpoint from documentation: /v2/device/{id}/alerts
            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/device/{$deviceId}/alerts");

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
     * Get alerts from NinjaOne with advanced filtering options
     */
    public function getAlerts(array $filters = []): array
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return [];
            }
            
            $defaultFilters = [
                'pageSize' => 100,
                'statuses' => 'active,acknowledged'  // Sólo alertas activas y reconocidas por defecto
            ];
            
            $params = array_merge($defaultFilters, $filters);
            
            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/alerts", $params);
                
            if ($response->successful()) {
                return $response->json();
            }
            
            Log::error('Failed to fetch alerts from NinjaOne', [
                'filters' => $params,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            
            return [];
            
        } catch (Exception $e) {
            Log::error('Error fetching alerts from NinjaOne API', [
                'filters' => $filters,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }
    
    /**
     * Find a device in NinjaOne by name and return its ID
     */
    public function findDeviceIdByName(string $deviceName): ?string
    {
        try {
            $devices = $this->getAllDevices();
            
            if (empty($devices)) {
                Log::error('No devices found in NinjaOne');
                return null;
            }
            
            // Primero buscar por 'name' si existe
            foreach ($devices as $device) {
                if (isset($device['name']) && !empty($device['name'])) {
                    // Coincidencia exacta
                    if ($device['name'] === $deviceName) {
                        return (string) $device['id'];
                    }
                    // Coincidencia parcial (ignorando mayúsculas/minúsculas)
                    if (stripos($device['name'], $deviceName) !== false) {
                        return (string) $device['id'];
                    }
                }
            }
            
            // Si no se encuentra por 'name', buscar por 'systemName'
            foreach ($devices as $device) {
                if (isset($device['systemName']) && !empty($device['systemName'])) {
                    // Coincidencia exacta
                    if ($device['systemName'] === $deviceName) {
                        return (string) $device['id'];
                    }
                    // Coincidencia parcial (ignorando mayúsculas/minúsculas)
                    if (stripos($device['systemName'], $deviceName) !== false) {
                        return (string) $device['id'];
                    }
                }
            }
            
            Log::warning('No device found in NinjaOne with name or systemName', [
                'search_name' => $deviceName
            ]);
            
            return null;
            
        } catch (Exception $e) {
            Log::error('Error finding device by name in NinjaOne', [
                'device_name' => $deviceName,
                'error' => $e->getMessage()
            ]);
            
            return null;
        }
    }
    
    /**
     * Get alerts for a device by name instead of ID
     */
    public function getDeviceAlertsByName(string $deviceName): array
    {
        // Primero intentar por ID si podemos encontrarlo
        $deviceId = $this->findDeviceIdByName($deviceName);
        
        if ($deviceId) {
            $alerts = $this->getDeviceAlerts($deviceId);
            if (!empty($alerts)) {
                return $alerts;
            }
        }
        
        // Si no encontramos alertas por ID o no encontramos el dispositivo,
        // intentar buscar alertas generales que coincidan con el nombre del dispositivo
        Log::info('Trying to find alerts by device name pattern', [
            'device_name' => $deviceName
        ]);
        
        // Obtener todos los tipos de alertas y filtrar por nombre de dispositivo
        $allAlerts = $this->getAlerts([
            'statuses' => 'active,acknowledged,resolved,dismissed',
            'pageSize' => 200
        ]);
        
        if (empty($allAlerts)) {
            Log::error('No alerts found in NinjaOne system', [
                'device_name' => $deviceName
            ]);
            return [];
        }
        
        // Filtrar alertas que coincidan con el nombre del dispositivo
        $matchedAlerts = array_filter($allAlerts, function($alert) use ($deviceName) {
            if (isset($alert['deviceName']) && stripos($alert['deviceName'], $deviceName) !== false) {
                return true;
            }
            
            if (isset($alert['systemName']) && stripos($alert['systemName'], $deviceName) !== false) {
                return true;
            }
            
            if (isset($alert['deviceHostname']) && stripos($alert['deviceHostname'], $deviceName) !== false) {
                return true;
            }
            
            return false;
        });
        
        return array_values($matchedAlerts); // Resetear índices
    }

    /**
     * Test API connection
     */
    public function testConnection(): bool
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return false;
            }

            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/organizations");

            return $response->successful();

        } catch (Exception $e) {
            Log::error('NinjaOne API connection test failed', [
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Get all organizations from NinjaOne API
     */
    public function getOrganizations(): array
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return [];
            }

            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/organizations");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Failed to fetch organizations from NinjaOne', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return [];

        } catch (Exception $e) {
            Log::error('Error fetching organizations from NinjaOne API', [
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }

    /**
     * Get all locations from NinjaOne API
     */
    public function getLocations(): array
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return [];
            }

            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/locations");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Failed to fetch locations from NinjaOne', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return [];

        } catch (Exception $e) {
            Log::error('Error fetching locations from NinjaOne API', [
                'error' => $e->getMessage()
            ]);

            return [];
        }
    }

    /**
     * Get organization by ID
     */
    public function getOrganization(int $organizationId): ?array
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return null;
            }

            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/organization/{$organizationId}");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Failed to fetch organization from NinjaOne', [
                'organization_id' => $organizationId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return null;

        } catch (Exception $e) {
            Log::error('Error fetching organization from NinjaOne API', [
                'organization_id' => $organizationId,
                'error' => $e->getMessage()
            ]);

            return null;
        }
    }

    /**
     * Get location by ID
     */
    public function getLocation(int $locationId): ?array
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return null;
            }

            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/location/{$locationId}");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Failed to fetch location from NinjaOne', [
                'location_id' => $locationId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return null;

        } catch (Exception $e) {
            Log::error('Error fetching location from NinjaOne API', [
                'location_id' => $locationId,
                'error' => $e->getMessage()
            ]);

            return null;
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
    
    /**
     * Get device health status from NinjaOne
     * 
     * @param string|int $deviceId The NinjaOne device ID
     * @return array|null Health status information or null if not available
     */
    public function getDeviceHealthStatus($deviceId): ?array
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return null;
            }
            
            // Get device details first - this includes offline status and last contact
            $device = $this->getDevice($deviceId);
            if (!$device) {
                Log::error('Device not found in NinjaOne', ['device_id' => $deviceId]);
                return null;
            }
            
            // Get active alerts for this device
            $alerts = $this->getDeviceAlerts($deviceId);
            
            // Determine device health status based on device info and alerts
            $isOffline = $device['offline'] ?? false;
            $lastContact = $device['lastContact'] ?? null;
            $maintenance = $device['maintenance'] ?? null;
            
            // Count active alerts by severity
            $criticalAlerts = 0;
            $warningAlerts = 0;
            $totalAlerts = count($alerts);
            
            foreach ($alerts as $alert) {
                $severity = $alert['severity'] ?? 'NONE';
                if (in_array($severity, ['CRITICAL', 'HIGH'])) {
                    $criticalAlerts++;
                } elseif (in_array($severity, ['MEDIUM', 'LOW'])) {
                    $warningAlerts++;
                }
            }
            
            // Determine overall health status
            $status = 'healthy';
            if ($isOffline) {
                $status = 'offline';
            } elseif ($maintenance && $maintenance['status'] === 'ACTIVE') {
                $status = 'maintenance';
            } elseif ($criticalAlerts > 0) {
                $status = 'critical';
            } elseif ($warningAlerts > 0 || $totalAlerts > 0) {
                $status = 'warning';
            }
            
            return [
                'status' => $status,
                'issuesCount' => $totalAlerts,
                'criticalCount' => $criticalAlerts,
                'warningCount' => $warningAlerts,
                'isOffline' => $isOffline,
                'lastContact' => $lastContact,
                'maintenance' => $maintenance,
                'lastChecked' => now()->toIso8601String(),
                'alerts' => $alerts,
            ];
            
        } catch (Exception $e) {
            Log::error('Error getting device health status', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);
            
            return null;
        }
    }
    
    /**
     * Get device activities from NinjaOne
     * 
     * @param string $deviceId The NinjaOne device ID
     * @param array $params Optional parameters (olderThan, newerThan, activityType, status, etc.)
     * @return array Activities data
     */
    public function getDeviceActivities(string $deviceId, array $params = []): array
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return [];
            }
            
            $defaultParams = [
                'pageSize' => 50,
                'lang' => 'en',
            ];
            
            $queryParams = array_merge($defaultParams, $params);
            
            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/device/{$deviceId}/activities", $queryParams);
                
            if ($response->successful()) {
                return $response->json();
            }
            
            Log::error('Failed to fetch device activities from NinjaOne', [
                'device_id' => $deviceId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            
            return [];
            
        } catch (Exception $e) {
            Log::error('Error fetching device activities from NinjaOne API', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }
    
    /**
     * Get device running jobs from NinjaOne
     * 
     * @param string $deviceId The NinjaOne device ID
     * @return array Running jobs data
     */
    public function getDeviceJobs(string $deviceId): array
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return [];
            }
            
            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/device/{$deviceId}/jobs");
                
            if ($response->successful()) {
                return $response->json();
            }
            
            Log::error('Failed to fetch device jobs from NinjaOne', [
                'device_id' => $deviceId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            
            return [];
            
        } catch (Exception $e) {
            Log::error('Error fetching device jobs from NinjaOne API', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }
    
    /**
     * Get device software inventory from NinjaOne
     * 
     * @param string $deviceId The NinjaOne device ID
     * @return array Software inventory data
     */
    public function getDeviceSoftware(string $deviceId): array
    {
        try {
            $headers = $this->getAuthHeaders();
            if (empty($headers)) {
                Log::error('No valid authentication headers available');
                return [];
            }
            
            $response = Http::withHeaders($headers)
                ->get("{$this->apiUrl}/v2/device/{$deviceId}/software");
                
            if ($response->successful()) {
                return $response->json();
            }
            
            Log::error('Failed to fetch device software from NinjaOne', [
                'device_id' => $deviceId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            
            return [];
            
        } catch (Exception $e) {
            Log::error('Error fetching device software from NinjaOne API', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }
    
    /**
     * Get comprehensive device information including health, activities, and jobs
     * 
     * @param string $deviceId The NinjaOne device ID
     * @return array|null Comprehensive device information
     */
    public function getDeviceComprehensive(string $deviceId): ?array
    {
        try {
            $device = $this->getDevice($deviceId);
            if (!$device) {
                return null;
            }
            
            // Get additional information
            $healthStatus = $this->getDeviceHealthStatus($deviceId);
            $recentActivities = $this->getDeviceActivities($deviceId, ['pageSize' => 10]);
            $runningJobs = $this->getDeviceJobs($deviceId);
            
            return [
                'device' => $device,
                'health' => $healthStatus,
                'recentActivities' => $recentActivities,
                'runningJobs' => $runningJobs,
            ];
            
        } catch (Exception $e) {
            Log::error('Error getting comprehensive device information', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);
            
            return null;
        }
    }
    
    /**
     * Get all devices with health status
     * 
     * @return array Array of devices with their health status
     */
    public function getDevicesWithHealth(): array
    {
        try {
            $devices = $this->getAllDevices();
            if (empty($devices)) {
                return [];
            }
            
            // Enriquecer los dispositivos con su estado de salud
            foreach ($devices as &$device) {
                if (isset($device['id'])) {
                    $healthStatus = $this->getDeviceHealthStatus($device['id']);
                    $device['health'] = $healthStatus ?? [
                        'status' => 'unknown',
                        'issuesCount' => 0
                    ];
                }
            }
            
            return $devices;
            
        } catch (Exception $e) {
            Log::error('Error getting devices with health', [
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }
}
