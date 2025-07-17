<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Device;
use App\Models\Tenant;
use App\Models\User;
use App\Services\NinjaOneService;
use Illuminate\Support\Facades\DB;

class TestNinjaOneIntegration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:ninjaone-integration';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the complete NinjaOne integration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Testing NinjaOne Integration ===');
        $this->newLine();

        // 1. Test Device Model relationships
        $this->info('1. Testing Device Model relationships:');
        $device = Device::with(['owner', 'sharedWith'])->where('ninjaone_enabled', true)->first();
        if ($device) {
            $this->line("✓ Found NinjaOne enabled device: {$device->name}");
            $owner = $device->owner()->first();
            $this->line("✓ Device owner: " . ($owner ? $owner->name : 'None'));
            $this->line("✓ Shared with " . $device->sharedWith->count() . " tenants");
            $this->line("✓ All tenants count: " . $device->allTenants()->count());
        } else {
            $this->error("✗ No NinjaOne enabled devices found");
        }

        // 2. Test NinjaOne Service
        $this->newLine();
        $this->info('2. Testing NinjaOne Service:');
        try {
            $ninjaOneService = new NinjaOneService();
            $this->line("✓ NinjaOne Service initialized");
            
            // Test device search (if we have a device name)
            if ($device && $device->name) {
                $this->line("✓ Testing device search for: {$device->name}");
                $ninjaOneDeviceId = $ninjaOneService->findDeviceIdByName($device->name);
                if ($ninjaOneDeviceId) {
                    $this->line("✓ Found NinjaOne device ID: {$ninjaOneDeviceId}");
                    
                    // Test health status
                    $healthStatus = $ninjaOneService->getDeviceHealthStatus($ninjaOneDeviceId);
                    $this->line("✓ Device health status: " . json_encode($healthStatus));
                    
                    // Test alerts
                    $alerts = $ninjaOneService->getDeviceAlerts($ninjaOneDeviceId);
                    $this->line("✓ Device alerts count: " . count($alerts));
                } else {
                    $this->error("✗ Device not found in NinjaOne");
                }
            }
        } catch (\Exception $e) {
            $this->error("✗ NinjaOne Service error: " . $e->getMessage());
        }

        // 3. Test Pivot Table relationships
        $this->newLine();
        $this->info('3. Testing Pivot Table relationships:');
        $sampleTenant = Tenant::first();
        if ($sampleTenant) {
            $this->line("✓ Testing with tenant: {$sampleTenant->name}");
            
            // Test owned devices
            $ownedDevices = Device::whereHas('owner', function($query) use ($sampleTenant) {
                $query->where('tenants.id', $sampleTenant->id);
            })->count();
            $this->line("✓ Owned devices count: {$ownedDevices}");
            
            // Test shared devices
            $sharedDevices = Device::whereHas('sharedWith', function($query) use ($sampleTenant) {
                $query->where('tenants.id', $sampleTenant->id);
            })->count();
            $this->line("✓ Shared devices count: {$sharedDevices}");
        }

        // 4. Test API endpoints (simulate)
        $this->newLine();
        $this->info('4. Testing API endpoint logic:');
        $user = User::whereHas('tenant')->first();
        if ($user && $device) {
            $this->line("✓ Testing with user: {$user->name}");
            
            // Test device access logic
            $hasAccess = false;
            
            // Check if user owns the device
            if ($device->owner()->where('tenants.id', $user->tenant->id ?? 0)->exists()) {
                $hasAccess = true;
                $this->line("✓ User has access as owner");
            }
            
            // Check if device is shared with user
            if ($device->sharedWith()->where('tenants.id', $user->tenant->id ?? 0)->exists()) {
                $hasAccess = true;
                $this->line("✓ User has access as shared");
            }
            
            if (!$hasAccess) {
                $this->error("✗ User does not have access to device");
            }
        }

        // 5. Test database schema
        $this->newLine();
        $this->info('5. Testing database schema:');
        try {
            $pivotCount = DB::table('share_device_tenant')->count();
            $this->line("✓ Pivot table 'share_device_tenant' exists with {$pivotCount} records");
            
            $ninjaOneDevices = Device::where('ninjaone_enabled', true)->count();
            $this->line("✓ NinjaOne enabled devices: {$ninjaOneDevices}");
            
            $ticketsWithDevices = DB::table('tickets')->whereNotNull('device_id')->count();
            $this->line("✓ Tickets with devices: {$ticketsWithDevices}");
        } catch (\Exception $e) {
            $this->error("✗ Database schema error: " . $e->getMessage());
        }

        $this->newLine();
        $this->info('=== Test Complete ===');
    }
}
