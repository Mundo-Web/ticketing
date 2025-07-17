<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Services\NinjaOneService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class NinjaOneDevicesController extends Controller
{
    protected $ninjaOneService;

    public function __construct(NinjaOneService $ninjaOneService)
    {
        $this->ninjaOneService = $ninjaOneService;
    }

    /**
     * Show the NinjaOne integration demo page
     */
    public function demo()
    {
        return Inertia::render('NinjaOne/Demo');
    }

    /**
     * Display a listing of all NinjaOne devices
     */
    public function index()
    {
        try {
            // Obtener todos los dispositivos de NinjaOne
            $ninjaOneDevices = $this->ninjaOneService->getAllDevices();
            
            // Obtener dispositivos locales que tienen integración con NinjaOne
            $localDevices = Device::where('ninjaone_enabled', true)
                ->with(['brand', 'model', 'system', 'name_device'])
                ->get();

            // Crear un mapa para vincular dispositivos locales con NinjaOne
            $deviceMap = [];
            foreach ($localDevices as $device) {
                if ($device->ninjaone_device_id) {
                    $deviceMap[$device->ninjaone_device_id] = $device;
                }
            }

            // Enriquecer datos de NinjaOne con información local
            $enrichedDevices = collect($ninjaOneDevices)->map(function ($ninjaDevice) use ($deviceMap) {
                $localDevice = $deviceMap[$ninjaDevice['id']] ?? null;
                
                // Obtener información adicional del dispositivo
                $healthStatus = $this->ninjaOneService->getDeviceHealthStatus($ninjaDevice['id']);
                $alerts = $this->ninjaOneService->getDeviceAlerts($ninjaDevice['id']);
                
                return [
                    'ninjaone_data' => $ninjaDevice,
                    'local_device' => $localDevice,
                    'health_status' => $healthStatus,
                    'alerts' => $alerts,
                    'alerts_count' => count($alerts),
                    'has_local_mapping' => $localDevice !== null,
                ];
            });

            // Estadísticas generales
            $stats = [
                'total_devices' => count($ninjaOneDevices),
                'online_devices' => collect($ninjaOneDevices)->where('online', true)->count(),
                'offline_devices' => collect($ninjaOneDevices)->where('online', false)->count(),
                'mapped_devices' => count($deviceMap),
                'unmapped_devices' => count($ninjaOneDevices) - count($deviceMap),
                'devices_with_alerts' => $enrichedDevices->where('alerts_count', '>', 0)->count(),
            ];

            return Inertia::render('NinjaOne/Devices/Index', [
                'devices' => $enrichedDevices,
                'stats' => $stats,
                'connection_status' => 'connected'
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching NinjaOne devices', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('NinjaOne/Devices/Index', [
                'devices' => collect([]),
                'stats' => [
                    'total_devices' => 0,
                    'online_devices' => 0,
                    'offline_devices' => 0,
                    'mapped_devices' => 0,
                    'unmapped_devices' => 0,
                    'devices_with_alerts' => 0,
                ],
                'connection_status' => 'error',
                'error_message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Show detailed information for a specific NinjaOne device
     */
    public function show($deviceId)
    {
        try {
            // Obtener información detallada del dispositivo
            $device = $this->ninjaOneService->getDevice($deviceId);
            $healthStatus = $this->ninjaOneService->getDeviceHealthStatus($deviceId);
            $alerts = $this->ninjaOneService->getDeviceAlerts($deviceId);
            
            // Buscar dispositivo local correspondiente
            $localDevice = Device::where('ninjaone_device_id', $deviceId)
                ->with(['brand', 'model', 'system', 'name_device', 'owner', 'sharedWith'])
                ->first();

            return Inertia::render('NinjaOne/Devices/Show', [
                'device' => $device,
                'health_status' => $healthStatus,
                'alerts' => $alerts,
                'local_device' => $localDevice
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching NinjaOne device details', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);

            return redirect()->route('ninjaone.devices.index')
                ->with('error', 'Error loading device details: ' . $e->getMessage());
        }
    }

    /**
     * Sync a NinjaOne device with local database
     */
    public function sync(Request $request, $deviceId)
    {
        try {
            // Obtener información del dispositivo de NinjaOne
            $ninjaDevice = $this->ninjaOneService->getDevice($deviceId);
            if (!$ninjaDevice) {
                return response()->json(['error' => 'Device not found in NinjaOne'], 404);
            }

            // Buscar o crear dispositivo local
            $localDevice = Device::where('ninjaone_device_id', $deviceId)->first();
            
            if (!$localDevice) {
                // Crear nuevo dispositivo local
                $localDevice = new Device();
                $localDevice->name = $ninjaDevice['systemName'] ?? $ninjaDevice['hostname'] ?? 'Unknown Device';
                $localDevice->ninjaone_device_id = $deviceId;
                $localDevice->ninjaone_enabled = true;
            }

            // Actualizar información desde NinjaOne
            $localDevice->ninjaone_system_name = $ninjaDevice['systemName'] ?? null;
            $localDevice->ninjaone_hostname = $ninjaDevice['hostname'] ?? null;
            $localDevice->ninjaone_serial_number = $ninjaDevice['serialNumber'] ?? null;
            $localDevice->ninjaone_online = $ninjaDevice['online'] ?? false;
            $localDevice->ninjaone_os = $ninjaDevice['operatingSystem'] ?? null;
            $localDevice->ninjaone_last_seen = isset($ninjaDevice['lastSeenUtc']) ? 
                \Carbon\Carbon::parse($ninjaDevice['lastSeenUtc']) : null;
            $localDevice->ninjaone_metadata = $ninjaDevice;

            // Obtener estado de salud
            $healthStatus = $this->ninjaOneService->getDeviceHealthStatus($deviceId);
            if ($healthStatus) {
                $localDevice->ninjaone_status = $healthStatus['status'] ?? 'unknown';
                $localDevice->ninjaone_issues_count = $healthStatus['issuesCount'] ?? 0;
                $localDevice->ninjaone_needs_attention = ($healthStatus['status'] ?? 'unknown') !== 'healthy';
            }

            $localDevice->save();

            return response()->json([
                'message' => 'Device synced successfully',
                'device' => $localDevice
            ]);

        } catch (\Exception $e) {
            Log::error('Error syncing NinjaOne device', [
                'device_id' => $deviceId,
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Error syncing device: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Test the NinjaOne connection and return connection status
     */
    public function testConnection()
    {
        try {
            $devices = $this->ninjaOneService->getAllDevices();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Successfully connected to NinjaOne',
                'device_count' => count($devices),
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to connect to NinjaOne: ' . $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * Get device count for demo purposes
     */
    public function getDemoDeviceCount()
    {
        try {
            $devices = $this->ninjaOneService->getAllDevices();
            
            return response()->json([
                'status' => 'success',
                'device_count' => count($devices),
                'online_count' => collect($devices)->where('online', true)->count(),
                'offline_count' => collect($devices)->where('online', false)->count(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get alerts count for demo purposes
     */
    public function getDemoAlertsCount()
    {
        try {
            // Get all devices first
            $devices = $this->ninjaOneService->getAllDevices();
            $totalAlerts = 0;
            $deviceAlerts = [];

            foreach ($devices as $device) {
                if (isset($device['id'])) {
                    $alerts = $this->ninjaOneService->getDeviceAlerts($device['id']);
                    $alertCount = count($alerts);
                    
                    if ($alertCount > 0) {
                        $deviceAlerts[] = [
                            'device_name' => $device['systemName'] ?? $device['hostname'] ?? 'Unknown',
                            'alert_count' => $alertCount,
                            'alerts' => array_slice($alerts, 0, 3) // Only first 3 alerts for demo
                        ];
                    }
                    
                    $totalAlerts += $alertCount;
                }
            }

            return response()->json([
                'status' => 'success',
                'total_alerts' => $totalAlerts,
                'device_alerts' => $deviceAlerts,
                'devices_with_alerts' => count($deviceAlerts)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'total_alerts' => 0,
                'device_alerts' => [],
                'devices_with_alerts' => 0
            ], 500);
        }
    }
}
