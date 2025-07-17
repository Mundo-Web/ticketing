<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Device;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class SetupAllNinjaOneDevices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ninjaone:setup-all-devices';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Setup relationships for all NinjaOne devices with all tenants';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Setting up relationships for all NinjaOne devices...');
        
        try {
            // 1. Obtener todos los dispositivos NinjaOne
            $devices = Device::where('ninjaone_enabled', true)->get();
            if ($devices->isEmpty()) {
                $this->error('No NinjaOne enabled devices found');
                return;
            }
            
            $this->info("Found {$devices->count()} NinjaOne devices:");
            foreach ($devices as $device) {
                $this->info("  - {$device->name} (ID: {$device->id})");
            }
            
            // 2. Obtener todos los tenants
            $tenants = Tenant::all();
            if ($tenants->isEmpty()) {
                $this->error('No tenants found');
                return;
            }
            
            $this->info("Found {$tenants->count()} tenants:");
            foreach ($tenants as $tenant) {
                $this->info("  - {$tenant->name} (ID: {$tenant->id})");
            }
            
            // 3. Crear relaciones para cada dispositivo
            $relationshipsCreated = 0;
            $relationshipsExisting = 0;
            
            foreach ($devices as $device) {
                foreach ($tenants as $index => $tenant) {
                    // El primer tenant será el owner, el resto serán shared
                    $ownerTenantId = $tenants->first()->id;
                    $sharedTenantId = $tenant->id;
                    
                    // Verificar si ya existe la relación
                    $existingRelation = DB::table('share_device_tenant')
                        ->where('device_id', $device->id)
                        ->where('owner_tenant_id', $ownerTenantId)
                        ->where('shared_with_tenant_id', $sharedTenantId)
                        ->first();
                        
                    if (!$existingRelation) {
                        DB::table('share_device_tenant')->insert([
                            'device_id' => $device->id,
                            'owner_tenant_id' => $ownerTenantId,
                            'shared_with_tenant_id' => $sharedTenantId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        
                        $relationshipsCreated++;
                        $shareType = ($ownerTenantId === $sharedTenantId) ? 'owner' : 'shared';
                        $this->info("✓ Created {$shareType} relationship: Device {$device->name} with Tenant {$tenant->name}");
                    } else {
                        $relationshipsExisting++;
                    }
                }
            }
            
            // 4. Mostrar estadísticas finales
            $totalPivotRecords = DB::table('share_device_tenant')->count();
            $totalNinjaOneDevices = Device::where('ninjaone_enabled', true)->count();
            
            $this->info("\n=== Final Statistics ===");
            $this->info("New relationships created: {$relationshipsCreated}");
            $this->info("Existing relationships: {$relationshipsExisting}");
            $this->info("Total pivot records: {$totalPivotRecords}");
            $this->info("Total NinjaOne devices: {$totalNinjaOneDevices}");
            
            // 5. Mostrar resumen por tenant
            foreach ($tenants as $tenant) {
                $ownedDevices = Device::whereHas('owner', function($query) use ($tenant) {
                    $query->where('tenants.id', $tenant->id);
                })->count();
                $sharedDevices = Device::whereHas('sharedWith', function($query) use ($tenant) {
                    $query->where('tenants.id', $tenant->id);
                })->count();
                
                $this->info("Tenant '{$tenant->name}': {$ownedDevices} owned, {$sharedDevices} shared");
            }
            
            $this->info("\n✅ All NinjaOne devices setup complete!");
            
        } catch (\Exception $e) {
            $this->error("Error setting up devices: " . $e->getMessage());
            $this->error($e->getTraceAsString());
        }
    }
}
