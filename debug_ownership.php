<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== DEVICE OWNERSHIP CHECK ===\n\n";

$device = \App\Models\Device::find(16);
if ($device) {
    echo "Device: {$device->name} (ID: {$device->id})\n";
    echo "Device table: " . $device->getTable() . "\n\n";
    
    // Check tenants relationship
    try {
        $tenants = $device->tenants;
        echo "Tenants count: " . $tenants->count() . "\n";
        foreach ($tenants as $tenant) {
            echo "- Tenant: {$tenant->name} (ID: {$tenant->id})\n";
            
            // Check if tenant has a User
            if (property_exists($tenant, 'user') && $tenant->user) {
                echo "  - User: {$tenant->user->name} (ID: {$tenant->user->id})\n";
            }
        }
    } catch (Exception $e) {
        echo "Error getting tenants: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== DEVICE-TENANT RELATIONSHIP TABLE ===\n";
    try {
        $pivotRecords = \DB::table('device_tenant')->where('device_id', 16)->get();
        echo "Pivot records count: " . $pivotRecords->count() . "\n";
        foreach ($pivotRecords as $record) {
            echo "- Device ID: {$record->device_id}, Tenant ID: {$record->tenant_id}\n";
        }
    } catch (Exception $e) {
        echo "Error getting pivot records: " . $e->getMessage() . "\n";
    }
    
} else {
    echo "Device with ID 16 not found\n";
}

echo "\n=== TESTING USER-DEVICE RELATIONSHIP ===\n";
$user = \App\Models\User::where('email', 'superadmin@adk.com')->first();
if ($user) {
    echo "User: {$user->name} (ID: {$user->id})\n";
    echo "User type: " . get_class($user) . "\n";
    
    if (property_exists($user, 'tenant') && $user->tenant) {
        echo "User has tenant: {$user->tenant->name} (ID: {$user->tenant->id})\n";
        if (method_exists($user->tenant, 'devices')) {
            $devices = $user->tenant->devices;
            echo "Tenant devices count: " . $devices->count() . "\n";
        }
    } else {
        echo "User does not have tenant relationship\n";
    }
}

echo "\n=== CHECKING TENANT BRAD ===\n";
$tenant = \App\Models\Tenant::find(348);
if ($tenant) {
    echo "Tenant: {$tenant->name} (ID: {$tenant->id})\n";
    echo "Email: {$tenant->email}\n";
    echo "Tenant class: " . get_class($tenant) . "\n";
    
    // Check if Tenant extends User or if there's a user relationship
    if ($tenant instanceof \App\Models\User) {
        echo "Tenant IS a User - can login directly\n";
    } else {
        echo "Tenant is NOT a User - checking for user relationship\n";
        if (property_exists($tenant, 'user') && $tenant->user) {
            echo "Tenant has associated User: {$tenant->user->name}\n";
        } else {
            echo "Tenant has NO associated User\n";
        }
    }
}
