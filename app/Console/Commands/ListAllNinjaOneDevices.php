<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Services\NinjaOneService;
use Illuminate\Console\Command;

class ListAllNinjaOneDevices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ninjaone:list-all-devices';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all devices available in NinjaOne and sync them to local database';

    /**
     * Execute the console command.
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
        
        $this->info('✅ NinjaOne API connection successful!');
        
        // Obtener todos los dispositivos de NinjaOne
        $this->info('Fetching all devices from NinjaOne...');
        $allDevices = $ninjaOneService->getAllDevices();
        
        if (empty($allDevices)) {
            $this->error('No devices found in NinjaOne');
            return 1;
        }
        
        $this->info("Found " . count($allDevices) . " devices in NinjaOne:");
        
        // Mostrar todos los dispositivos en formato tabla
        $devicesList = array_map(function($device) {
            return [
                'ninjaone_id' => $device['id'] ?? 'N/A',
                'name' => $device['name'] ?? 'N/A',
                'system_name' => $device['systemName'] ?? 'N/A',
                'hostname' => $device['hostname'] ?? 'N/A',
                'operating_system' => substr($device['operatingSystem'] ?? 'N/A', 0, 20),
                'status' => $device['status'] ?? 'N/A',
                'online' => ($device['online'] ?? false) ? 'Yes' : 'No',
                'needs_attention' => ($device['needsAttention'] ?? false) ? 'Yes' : 'No',
            ];
        }, $allDevices);
        
        $this->table([
            'NinjaOne ID', 
            'Name', 
            'System Name', 
            'Hostname', 
            'OS', 
            'Status', 
            'Online', 
            'Needs Attention'
        ], $devicesList);
        
        // Mostrar dispositivos locales que están marcados como en NinjaOne
        $this->info("\n=== Local Devices marked as in NinjaOne ===");
        $localDevices = Device::where('ninjaone_enabled', true)->get();
        
        if ($localDevices->isEmpty()) {
            $this->warn('No local devices marked as NinjaOne enabled');
        } else {
            $localDevicesList = $localDevices->map(function($device) {
                return [
                    'local_id' => $device->id,
                    'name' => $device->name ?? 'N/A',
                    'ninjaone_id' => $device->ninjaone_device_id ?? 'N/A',
                    'system_name' => $device->ninjaone_system_name ?? 'N/A',
                    'hostname' => $device->ninjaone_hostname ?? 'N/A',
                    'status' => $device->ninjaone_status ?? 'N/A',
                ];
            })->toArray();
            
            $this->table([
                'Local ID',
                'Name', 
                'NinjaOne ID',
                'System Name',
                'Hostname',
                'Status'
            ], $localDevicesList);
        }
        
        // Ofrecer sincronizar dispositivos
        if ($this->confirm('Do you want to sync these devices to the local database?')) {
            $this->info('Syncing devices...');
            $syncedCount = 0;
            $updatedCount = 0;
            
            foreach ($allDevices as $ninjaDevice) {
                $ninjaoneId = $ninjaDevice['id'] ?? null;
                $systemName = $ninjaDevice['systemName'] ?? $ninjaDevice['name'] ?? null;
                
                if (!$ninjaoneId || !$systemName) {
                    continue;
                }
                
                // Buscar dispositivo existente por ninjaone_device_id o nombre
                $existingDevice = Device::where('ninjaone_device_id', $ninjaoneId)
                    ->orWhere('name', $systemName)
                    ->first();
                
                if ($existingDevice) {
                    // Actualizar dispositivo existente
                    $existingDevice->update([
                        'ninjaone_enabled' => true,
                        'ninjaone_device_id' => $ninjaoneId,
                        'ninjaone_system_name' => $ninjaDevice['systemName'] ?? null,
                        'ninjaone_hostname' => $ninjaDevice['hostname'] ?? null,
                        'ninjaone_status' => $ninjaDevice['status'] ?? null,
                        'ninjaone_online' => $ninjaDevice['online'] ?? false,
                        'ninjaone_needs_attention' => $ninjaDevice['needsAttention'] ?? false,
                        'ninjaone_last_seen' => isset($ninjaDevice['lastContact']) ? 
                            now()->setTimestamp($ninjaDevice['lastContact']) : null,
                        'ninjaone_issues_count' => $ninjaDevice['issuesCount'] ?? 0,
                    ]);
                    $updatedCount++;
                    $this->info("✓ Updated device: {$systemName} (ID: {$existingDevice->id})");
                } else {
                    // Crear nuevo dispositivo
                    $newDevice = Device::create([
                        'name' => $systemName,
                        'ninjaone_enabled' => true,
                        'ninjaone_device_id' => $ninjaoneId,
                        'ninjaone_system_name' => $ninjaDevice['systemName'] ?? null,
                        'ninjaone_hostname' => $ninjaDevice['hostname'] ?? null,
                        'ninjaone_status' => $ninjaDevice['status'] ?? null,
                        'ninjaone_online' => $ninjaDevice['online'] ?? false,
                        'ninjaone_needs_attention' => $ninjaDevice['needsAttention'] ?? false,
                        'ninjaone_last_seen' => isset($ninjaDevice['lastContact']) ? 
                            now()->setTimestamp($ninjaDevice['lastContact']) : null,
                        'ninjaone_issues_count' => $ninjaDevice['issuesCount'] ?? 0,
                        'name_device_id' => 1, // Asignar un ID de tipo de dispositivo por defecto
                        'brand_id' => 3, // PC brand por defecto
                        'model_id' => 4, // PC model por defecto
                        'system_id' => 5, // PC system por defecto
                    ]);
                    $syncedCount++;
                    $this->info("✓ Created new device: {$systemName} (ID: {$newDevice->id})");
                }
            }
            
            $this->info("\n=== Sync Summary ===");
            $this->info("New devices created: {$syncedCount}");
            $this->info("Existing devices updated: {$updatedCount}");
            $this->info("Total processed: " . ($syncedCount + $updatedCount));
        }
        
        return 0;
    }
}
