<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Device;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SetupNinjaOneTestData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ninjaone:setup-test-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Setup test data for NinjaOne integration demonstration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Setting up NinjaOne test data...');
        
        try {
            // 1. Buscar el dispositivo NinjaOne
            $device = Device::where('ninjaone_enabled', true)->first();
            if (!$device) {
                $this->error('No NinjaOne enabled device found');
                return;
            }
            
            $this->info("Found device: {$device->name} (ID: {$device->id})");
            
            // 2. Buscar un tenant
            $tenant = Tenant::first();
            if (!$tenant) {
                $this->error('No tenant found');
                return;
            }
            
            $this->info("Found tenant: {$tenant->name} (ID: {$tenant->id})");
            
            // 3. Buscar otro tenant para compartir
            $secondTenant = Tenant::where('id', '!=', $tenant->id)->first();
            if (!$secondTenant) {
                // Si no hay segundo tenant, crear uno
                $secondTenant = Tenant::create([
                    'name' => 'Demo Tenant 2',
                    'description' => 'Second tenant for testing',
                ]);
                $this->info("✓ Created second tenant: {$secondTenant->name} (ID: {$secondTenant->id})");
            }
            
            // 4. Crear relación en la tabla pivot (siempre requiere shared_with_tenant_id)
            $existingRelation = DB::table('share_device_tenant')
                ->where('device_id', $device->id)
                ->where('owner_tenant_id', $tenant->id)
                ->where('shared_with_tenant_id', $secondTenant->id)
                ->first();
                
            if (!$existingRelation) {
                DB::table('share_device_tenant')->insert([
                    'device_id' => $device->id,
                    'owner_tenant_id' => $tenant->id,
                    'shared_with_tenant_id' => $secondTenant->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->info("✓ Created relationship: Device {$device->id} owned by Tenant {$tenant->id} and shared with Tenant {$secondTenant->id}");
            } else {
                $this->info("✓ Relationship already exists");
            }
            
            // 5. Verificar el usuario (no es necesario asignar tenant_id si no existe la columna)
            $user = User::first();
            if ($user) {
                $this->info("✓ Found user: {$user->name} (ID: {$user->id})");
            }
            
            // 6. Actualizar información del dispositivo
            $device->update([
                'ninjaone_system_name' => 'DAMIANPC',
                'ninjaone_hostname' => 'DAMIANPC',
                'ninjaone_status' => 'offline',
                'ninjaone_issues_count' => 0,
                'ninjaone_online' => false,
                'ninjaone_needs_attention' => true,
                'ninjaone_last_seen' => now(),
            ]);
            $this->info("✓ Updated device NinjaOne information");
            
            // 7. Mostrar estadísticas finales
            $totalPivotRecords = DB::table('share_device_tenant')->count();
            $ownedDevices = Device::whereHas('owner', function($query) use ($tenant) {
                $query->where('tenants.id', $tenant->id);
            })->count();
            $sharedDevices = Device::whereHas('sharedWith', function($query) use ($tenant) {
                $query->where('tenants.id', $tenant->id);
            })->count();
            
            $this->info("\n=== Final Statistics ===");
            $this->info("Total pivot records: {$totalPivotRecords}");
            $this->info("Devices owned by tenant {$tenant->id}: {$ownedDevices}");
            $this->info("Devices shared with tenant {$tenant->id}: {$sharedDevices}");
            $this->info("User found: {$user->name} (ID: {$user->id})");
            
            $this->info("\n✅ Test data setup complete!");
            $this->info("You can now run: php artisan test:ninjaone-integration");
            
        } catch (\Exception $e) {
            $this->error("Error setting up test data: " . $e->getMessage());
            $this->error($e->getTraceAsString());
        }
    }
}
