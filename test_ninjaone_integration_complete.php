<?php

require_once 'vendor/autoload.php';

use App\Models\Device;
use App\Models\Tenant;
use App\Models\User;
use App\Services\NinjaOneService;
use Illuminate\Support\Facades\DB;

// Test the complete NinjaOne integration
echo "=== Testing NinjaOne Integration ===\n\n";

// 1. Test Device Model relationships
echo "1. Testing Device Model relationships:\n";
$device = Device::with(['owner', 'sharedWith'])->where('ninjaone_enabled', true)->first();
if ($device) {
    echo "✓ Found NinjaOne enabled device: {$device->name}\n";
    echo "✓ Device owner: " . ($device->owner ? $device->owner->name : 'None') . "\n";
    echo "✓ Shared with " . $device->sharedWith->count() . " tenants\n";
    echo "✓ All tenants count: " . $device->allTenants()->count() . "\n";
} else {
    echo "✗ No NinjaOne enabled devices found\n";
}

// 2. Test NinjaOne Service
echo "\n2. Testing NinjaOne Service:\n";
try {
    $ninjaOneService = new NinjaOneService();
    echo "✓ NinjaOne Service initialized\n";
    
    // Test device search (if we have a device name)
    if ($device && $device->name) {
        echo "✓ Testing device search for: {$device->name}\n";
        $ninjaOneDeviceId = $ninjaOneService->findDeviceIdByName($device->name);
        if ($ninjaOneDeviceId) {
            echo "✓ Found NinjaOne device ID: {$ninjaOneDeviceId}\n";
            
            // Test health status
            $healthStatus = $ninjaOneService->getDeviceHealthStatus($ninjaOneDeviceId);
            echo "✓ Device health status: " . json_encode($healthStatus) . "\n";
            
            // Test alerts
            $alerts = $ninjaOneService->getDeviceAlerts($ninjaOneDeviceId);
            echo "✓ Device alerts count: " . count($alerts) . "\n";
        } else {
            echo "✗ Device not found in NinjaOne\n";
        }
    }
} catch (Exception $e) {
    echo "✗ NinjaOne Service error: " . $e->getMessage() . "\n";
}

// 3. Test Pivot Table relationships
echo "\n3. Testing Pivot Table relationships:\n";
$sampleTenant = Tenant::first();
if ($sampleTenant) {
    echo "✓ Testing with tenant: {$sampleTenant->name}\n";
    
    // Test owned devices
    $ownedDevices = Device::whereHas('owner', function($query) use ($sampleTenant) {
        $query->where('tenants.id', $sampleTenant->id);
    })->count();
    echo "✓ Owned devices count: {$ownedDevices}\n";
    
    // Test shared devices
    $sharedDevices = Device::whereHas('sharedWith', function($query) use ($sampleTenant) {
        $query->where('tenants.id', $sampleTenant->id);
    })->count();
    echo "✓ Shared devices count: {$sharedDevices}\n";
}

// 4. Test API endpoints (simulate)
echo "\n4. Testing API endpoint logic:\n";
$user = User::whereHas('tenant')->first();
if ($user && $device) {
    echo "✓ Testing with user: {$user->name}\n";
    
    // Test device access logic
    $hasAccess = false;
    
    // Check if user owns the device
    if ($device->owner()->where('tenants.id', $user->tenant->id ?? 0)->exists()) {
        $hasAccess = true;
        echo "✓ User has access as owner\n";
    }
    
    // Check if device is shared with user
    if ($device->sharedWith()->where('tenants.id', $user->tenant->id ?? 0)->exists()) {
        $hasAccess = true;
        echo "✓ User has access as shared\n";
    }
    
    if (!$hasAccess) {
        echo "✗ User does not have access to device\n";
    }
}

// 5. Test database schema
echo "\n5. Testing database schema:\n";
try {
    $pivotCount = DB::table('share_device_tenant')->count();
    echo "✓ Pivot table 'share_device_tenant' exists with {$pivotCount} records\n";
    
    $ninjaOneDevices = Device::where('ninjaone_enabled', true)->count();
    echo "✓ NinjaOne enabled devices: {$ninjaOneDevices}\n";
    
    $ticketsWithDevices = DB::table('tickets')->whereNotNull('device_id')->count();
    echo "✓ Tickets with devices: {$ticketsWithDevices}\n";
} catch (Exception $e) {
    echo "✗ Database schema error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
