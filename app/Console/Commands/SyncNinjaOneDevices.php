<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Services\NinjaOneService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncNinjaOneDevices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ninjaone:sync-devices {--force : Forzar sincronización de todos los dispositivos}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza los dispositivos con NinjaOne y actualiza su información';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('Iniciando sincronización con NinjaOne...');
        
        // Verificar conexión con NinjaOne
        $ninjaOneService = app(NinjaOneService::class);
        if (!$ninjaOneService->testConnection()) {
            $this->error('No se pudo conectar con NinjaOne. Verifique sus credenciales.');
            return 1;
        }
        
        $this->info('Conexión establecida con NinjaOne.');
        
        // Obtener todos los dispositivos de NinjaOne con estado de salud
        $ninjaOneDevices = $ninjaOneService->getDevicesWithHealth();
        if (empty($ninjaOneDevices)) {
            $this->warn('No se encontraron dispositivos en NinjaOne.');
            return 0;
        }
        
        $this->info('Se encontraron ' . count($ninjaOneDevices) . ' dispositivos en NinjaOne.');
        
        // Mapear los dispositivos de NinjaOne por nombre de sistema para facilitar la búsqueda
        $ninjaOneDevicesByName = [];
        foreach ($ninjaOneDevices as $device) {
            $systemName = $device['systemName'] ?? null;
            if ($systemName) {
                $ninjaOneDevicesByName[$systemName] = $device;
            }
        }
        
        // Obtener dispositivos locales marcados como NinjaOne
        $localDevices = Device::where('is_in_ninjaone', true)->get();
        $this->info('Se encontraron ' . $localDevices->count() . ' dispositivos locales marcados como NinjaOne.');
        
        $syncCount = 0;
        $errorCount = 0;
        $notFoundCount = 0;
        
        // Iterar sobre los dispositivos locales y sincronizar con NinjaOne
        foreach ($localDevices as $device) {
            $this->output->write("Sincronizando dispositivo {$device->id} ({$device->name})... ");
            
            // Buscar el dispositivo en NinjaOne por nombre
            $ninjaOneDevice = null;
            if ($device->name && isset($ninjaOneDevicesByName[$device->name])) {
                $ninjaOneDevice = $ninjaOneDevicesByName[$device->name];
            } else {
                // Si no se encontró por nombre exacto, intentar buscar por coincidencia parcial
                foreach ($ninjaOneDevicesByName as $systemName => $nDevice) {
                    if ($device->name && stripos($systemName, $device->name) !== false) {
                        $ninjaOneDevice = $nDevice;
                        break;
                    }
                }
            }
            
            if (!$ninjaOneDevice) {
                $this->output->writeln("<fg=yellow>No encontrado</>");
                $notFoundCount++;
                continue;
            }
            
            try {
                // Actualizar la información del dispositivo local
                $device->ninjaone_device_id = $ninjaOneDevice['id'] ?? null;
                $device->ninjaone_system_name = $ninjaOneDevice['systemName'] ?? null;
                $device->ninjaone_hostname = $ninjaOneDevice['dnsName'] ?? $ninjaOneDevice['hostname'] ?? null;
                $device->ninjaone_serial_number = $ninjaOneDevice['serialNumber'] ?? null;
                $device->ninjaone_last_seen = isset($ninjaOneDevice['lastContact']) ? 
                    now()->createFromTimestamp($ninjaOneDevice['lastContact']) : null;
                
                // Actualizar estado de salud desde la información agregada
                $healthInfo = $ninjaOneDevice['health'] ?? null;
                if ($healthInfo) {
                    $device->ninjaone_status = $healthInfo['status'] ?? 'unknown';
                    $device->ninjaone_issues_count = $healthInfo['issuesCount'] ?? 0;
                    $device->ninjaone_online = !($ninjaOneDevice['offline'] ?? false);
                } else {
                    // Si no hay información de salud, usar valores por defecto
                    $device->ninjaone_status = 'unknown';
                    $device->ninjaone_issues_count = 0;
                    $device->ninjaone_online = !($ninjaOneDevice['offline'] ?? false);
                }
                
                $device->save();
                $this->output->writeln("<fg=green>Sincronizado</>");
                $syncCount++;
                
            } catch (\Exception $e) {
                $this->output->writeln("<fg=red>Error: " . $e->getMessage() . "</>");
                $errorCount++;
                Log::error('Error sincronizando dispositivo', [
                    'device_id' => $device->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        $this->info("Sincronización completada:");
        $this->info("- Dispositivos sincronizados: {$syncCount}");
        $this->info("- Dispositivos no encontrados: {$notFoundCount}");
        $this->info("- Errores: {$errorCount}");
        
        return 0;
    }
}
