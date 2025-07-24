<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Services\NinjaOneService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
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
            
            // Obtener organizations y locations de NinjaOne
            $organizations = $this->ninjaOneService->getOrganizations();
            $locations = $this->ninjaOneService->getLocations();
            
            // Crear mapas para organizations y locations
            $organizationMap = [];
            foreach ($organizations as $org) {
                $organizationMap[$org['id']] = $org;
            }
            
            $locationMap = [];
            foreach ($locations as $loc) {
                $locationMap[$loc['id']] = $loc;
            }
            
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

            // Enriquecer datos de NinjaOne con información local y adicional
            $enrichedDevices = collect($ninjaOneDevices)->map(function ($ninjaDevice) use ($deviceMap, $organizationMap, $locationMap) {
                $localDevice = $deviceMap[$ninjaDevice['id']] ?? null;
                
                // Obtener información detallada del dispositivo (incluye OS, processors, etc.)
                $detailedDevice = $this->ninjaOneService->getDevice($ninjaDevice['id']);
                
                // Obtener información adicional del dispositivo
                $healthStatus = $this->ninjaOneService->getDeviceHealthStatus($ninjaDevice['id']);
                $alerts = $this->ninjaOneService->getDeviceAlerts($ninjaDevice['id']);
                
                // Mapear organization y location
                $organization = null;
                if (isset($ninjaDevice['organizationId']) && isset($organizationMap[$ninjaDevice['organizationId']])) {
                    $organization = [
                        'id' => $ninjaDevice['organizationId'],
                        'name' => $organizationMap[$ninjaDevice['organizationId']]['name']
                    ];
                }
                
                $location = null;
                if (isset($ninjaDevice['locationId']) && isset($locationMap[$ninjaDevice['locationId']])) {
                    $location = [
                        'id' => $ninjaDevice['locationId'],
                        'name' => $locationMap[$ninjaDevice['locationId']]['name']
                    ];
                }
                
                // Usar datos detallados si están disponibles, sino usar datos básicos
                $deviceData = $detailedDevice ?? $ninjaDevice;
                
                return [
                    'ninjaone_data' => $deviceData,
                    'local_device' => $localDevice,
                    'health_status' => $healthStatus,
                    'alerts' => $alerts,
                    'alerts_count' => count($alerts),
                    'has_local_mapping' => $localDevice !== null,
                    'organization' => $organization,
                    'location' => $location,
                ];
            });

            // Estadísticas generales
            $stats = [
                'total_devices' => count($ninjaOneDevices),
                'online_devices' => collect($ninjaOneDevices)->filter(function($device) {
                    return !($device['offline'] ?? false) && ($device['online'] ?? true);
                })->count(),
                'offline_devices' => collect($ninjaOneDevices)->filter(function($device) {
                    return ($device['offline'] ?? false) || ($device['online'] ?? true) === false;
                })->count(),
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
                return response()->json([
                    'success' => false, 
                    'error' => 'Device not found in NinjaOne'
                ], 404);
            }

            // Verificar si ya existe un dispositivo local con este ninjaone_device_id
            $existingDevice = Device::where('ninjaone_device_id', $deviceId)->first();
            if ($existingDevice) {
                return response()->json([
                    'success' => false, 
                    'error' => 'Device is already synced to local database'
                ], 400);
            }

            // Obtener nombres del dispositivo NinjaOne para buscar coincidencias
            $ninjaSystemName = $ninjaDevice['systemName'] ?? null;
            $ninjaHostname = $ninjaDevice['hostname'] ?? null;
            
            if (!$ninjaSystemName && !$ninjaHostname) {
                return response()->json([
                    'success' => false, 
                    'error' => 'NinjaOne device has no system name or hostname to match'
                ], 400);
            }

            // Buscar dispositivo local que coincida por nombre
            $localDevice = null;
            
            // Primero intentar con systemName
            if ($ninjaSystemName) {
                $localDevice = Device::where('name', $ninjaSystemName)
                    ->where(function($query) use ($deviceId) {
                        $query->whereNull('ninjaone_device_id')
                              ->orWhere('ninjaone_device_id', '!=', $deviceId);
                    })
                    ->first();
            }
            
            // Si no se encuentra, intentar con hostname
            if (!$localDevice && $ninjaHostname) {
                $localDevice = Device::where('name', $ninjaHostname)
                    ->where(function($query) use ($deviceId) {
                        $query->whereNull('ninjaone_device_id')
                              ->orWhere('ninjaone_device_id', '!=', $deviceId);
                    })
                    ->first();
            }
            
            // Si aún no se encuentra, intentar búsqueda parcial con systemName
            if (!$localDevice && $ninjaSystemName) {
                $localDevice = Device::where('name', 'LIKE', '%' . $ninjaSystemName . '%')
                    ->where(function($query) use ($deviceId) {
                        $query->whereNull('ninjaone_device_id')
                              ->orWhere('ninjaone_device_id', '!=', $deviceId);
                    })
                    ->first();
            }
            
            // Si aún no se encuentra, intentar búsqueda parcial con hostname
            if (!$localDevice && $ninjaHostname) {
                $localDevice = Device::where('name', 'LIKE', '%' . $ninjaHostname . '%')
                    ->where(function($query) use ($deviceId) {
                        $query->whereNull('ninjaone_device_id')
                              ->orWhere('ninjaone_device_id', '!=', $deviceId);
                    })
                    ->first();
            }

            // Si no se encuentra ningún dispositivo local para hacer match
            if (!$localDevice) {
                // Verificar si existe un dispositivo con el nombre pero ya está sincronizado con otro ID
                $existingNamedDevice = Device::where('name', $ninjaSystemName)
                    ->orWhere('name', $ninjaHostname)
                    ->first();
                
                if ($existingNamedDevice && $existingNamedDevice->ninjaone_device_id) {
                    return response()->json([
                        'success' => false, 
                        'error' => sprintf(
                            'Local device "%s" is already synced with NinjaOne device ID: %s. Cannot sync with multiple NinjaOne devices.',
                            $existingNamedDevice->name,
                            $existingNamedDevice->ninjaone_device_id
                        )
                    ], 400);
                }
                
                return response()->json([
                    'success' => false, 
                    'error' => sprintf(
                        'No local device found to match with this NinjaOne device. Please create a local device first with matching name: %s',
                        $ninjaSystemName ?? $ninjaHostname
                    )
                ], 404);
            }

            // Hacer el match - actualizar el dispositivo local con información de NinjaOne
            $localDevice->ninjaone_device_id = $deviceId;
            $localDevice->ninjaone_enabled = true;
            $localDevice->ninjaone_system_name = $ninjaSystemName;
            $localDevice->ninjaone_hostname = $ninjaHostname;
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
                'success' => true,
                'message' => sprintf(
                    'Device "%s" successfully matched and synced with NinjaOne device "%s"',
                    $localDevice->name,
                    $ninjaSystemName ?? $ninjaHostname
                ),
                'device' => $localDevice,
                'matched_by' => $localDevice->name === $ninjaSystemName ? 'systemName' : 
                              ($localDevice->name === $ninjaHostname ? 'hostname' : 'partial_match')
            ]);

        } catch (\Exception $e) {
            Log::error('Error syncing NinjaOne device', [
                'device_id' => $deviceId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false, 
                'error' => 'Error syncing device: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Refresh all devices from NinjaOne API
     */
    public function refresh(Request $request)
    {
        try {
            // Fetch fresh data from NinjaOne
            $devices = $this->ninjaOneService->getAllDevices();
            
            if (!$devices) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to fetch devices from NinjaOne'
                ], 500);
            }

            // Log the refresh action
            Log::info('NinjaOne devices refreshed', [
                'user_id' => Auth::id(),
                'device_count' => count($devices),
                'timestamp' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => sprintf('Successfully refreshed %d devices from NinjaOne', count($devices)),
                'device_count' => count($devices),
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('Error refreshing devices from NinjaOne', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error refreshing devices: ' . $e->getMessage()
            ], 500);
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
