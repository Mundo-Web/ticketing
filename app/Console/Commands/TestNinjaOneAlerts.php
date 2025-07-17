<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Services\NinjaOneService;
use Illuminate\Console\Command;

class TestNinjaOneAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:ninjaone-alerts {name? : Device name to test}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test fetching NinjaOne alerts by device name';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $ninjaOneService = app(NinjaOneService::class);
        
        // Verificar conexión
        $this->info('Testing NinjaOne API connection...');
        if (!$ninjaOneService->testConnection()) {
            $this->error('Failed to connect to NinjaOne API. Check your credentials.');
            return 1;
        }
        
        $this->info('NinjaOne API connection successful!');
        
        // Obtener nombre del dispositivo (parámetro o pedir al usuario)
        $deviceName = $this->argument('name');
        if (!$deviceName) {
            // Listar dispositivos que están en NinjaOne
            $devices = Device::where('is_in_ninjaone', true)->get();
            
            if ($devices->isEmpty()) {
                $this->error('No devices marked as in NinjaOne.');
                $deviceName = $this->ask('Enter a device name to search in NinjaOne:');
            } else {
                $this->info('Devices marked as in NinjaOne:');
                $devicesList = $devices->map(function($device) {
                    return [
                        'id' => $device->id,
                        'name' => $device->name ?: '(No name)',
                        'name_device' => $device->name_device->name ?? 'N/A',
                    ];
                })->toArray();
                
                $this->table(['ID', 'Name', 'Device Type'], $devicesList);
                
                $deviceId = $this->ask('Enter the ID of the device to test:');
                $device = Device::find($deviceId);
                
                if (!$device) {
                    $this->error('Invalid device ID.');
                    return 1;
                }
                
                $deviceName = $device->name;
                if (empty($deviceName)) {
                    $this->error('The selected device has no name. Please add a name for NinjaOne matching.');
                    return 1;
                }
            }
        }
        
        // Buscar el dispositivo por nombre
        $this->info("Searching for device with name: {$deviceName}");
        $deviceId = $ninjaOneService->findDeviceIdByName($deviceName);
        
        if (!$deviceId) {
            $this->error("No device found in NinjaOne with name '{$deviceName}'");
            
            // Mostrar todos los dispositivos en NinjaOne
            $this->info('Available devices in NinjaOne:');
            $allDevices = $ninjaOneService->getAllDevices();
            
            $devicesList = array_map(function($device) {
                return [
                    'id' => $device['id'] ?? 'N/A',
                    'name' => $device['name'] ?? 'N/A',
                    'system_name' => $device['systemName'] ?? 'N/A',
                    'host_name' => $device['hostname'] ?? 'N/A',
                    'operating_system' => $device['operatingSystem'] ?? 'N/A',
                ];
            }, $allDevices);
            
            $this->table(['ID', 'Name', 'System Name', 'Host Name', 'OS'], $devicesList);
            
            // Ofrecer intentar con systemName en lugar de name
            if ($this->confirm('Do you want to try with a system name instead?')) {
                $systemNames = array_column($devicesList, 'system_name');
                $systemName = $this->choice('Select a system name', $systemNames);
                // Obtener alertas directamente por nombre del sistema
                $this->info("Fetching alerts for device with system name '{$systemName}'...");
                $alerts = $ninjaOneService->getDeviceAlertsByName($systemName);
                
                if (empty($alerts)) {
                    $this->warn("No alerts found for system name '{$systemName}'");
                    
                    // Intentar obtener todas las alertas para ver qué hay disponible
                    $this->info("Fetching all active alerts to check availability...");
                    $allAlerts = $ninjaOneService->getAlerts(['statuses' => 'active,acknowledged,resolved,dismissed']);
                    
                    if (!empty($allAlerts)) {
                        $this->info("Found " . count($allAlerts) . " active alerts in the system");
                        
                        $allAlertsList = array_map(function($alert) {
                            return [
                                'id' => $alert['id'] ?? 'N/A',
                                'device' => $alert['deviceName'] ?? ($alert['systemName'] ?? 'N/A'),
                                'type' => $alert['type'] ?? 'N/A',
                                'severity' => $alert['severity'] ?? 'N/A',
                                'message' => substr($alert['message'] ?? 'N/A', 0, 50) . '...',
                            ];
                        }, array_slice($allAlerts, 0, 10)); // Mostrar sólo las primeras 10 alertas
                        
                        $this->table(['ID', 'Device', 'Type', 'Severity', 'Message'], $allAlertsList);
                        $this->info("Showing only first 10 alerts. Total: " . count($allAlerts));
                    } else {
                        $this->error("No active alerts found in the system");
                    }
                    
                    return 0;
                }
                
                $this->info("Found " . count($alerts) . " alerts for device '{$systemName}':");
                
                // Mostrar alertas en formato tabla
                $alertsList = array_map(function($alert) {
                    return [
                        'id' => $alert['id'] ?? 'N/A',
                        'device' => $alert['deviceName'] ?? ($alert['systemName'] ?? 'N/A'),
                        'type' => $alert['type'] ?? 'N/A',
                        'severity' => $alert['severity'] ?? 'N/A',
                        'message' => substr($alert['message'] ?? 'N/A', 0, 50) . '...',
                    ];
                }, $alerts);
                
                $this->table(['ID', 'Device', 'Type', 'Severity', 'Message'], $alertsList);
                return 0;
            }
            return 1;
        }
        
        $this->info("Device found in NinjaOne with ID: {$deviceId}");
        
        // Obtener alertas del dispositivo
        $this->info("Fetching alerts for device '{$deviceName}'...");
        $alerts = $ninjaOneService->getDeviceAlertsByName($deviceName);
        
        if (empty($alerts)) {
            $this->warn("No alerts found for device '{$deviceName}'");
            return 0;
        }
        
        $this->info("Found " . count($alerts) . " alerts for device '{$deviceName}':");
        
        // Mostrar alertas en formato tabla
        $alertsList = array_map(function($alert) {
            return [
                'id' => $alert['id'] ?? 'N/A',
                'type' => $alert['type'] ?? 'N/A',
                'severity' => $alert['severity'] ?? 'N/A',
                'message' => substr($alert['message'] ?? 'N/A', 0, 50) . '...',
                'status' => $alert['status'] ?? 'N/A',
            ];
        }, $alerts);
        
        $this->table(['ID', 'Type', 'Severity', 'Message', 'Status'], $alertsList);
        
        return 0;
    }
}
