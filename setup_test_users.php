<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== SETTING UP TEST USER WITH TENANT ===\n\n";

try {
    // Buscar o crear tenant user
    $tenantUser = App\Models\User::where('email', 'tenant.test@adkassist.com')->first();
    
    if (!$tenantUser) {
        $tenantUser = App\Models\User::create([
            'name' => 'Test Tenant Organization',
            'email' => 'tenant.test@adkassist.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);
        echo "✓ Tenant user created: {$tenantUser->email} (ID: {$tenantUser->id})\n";
    } else {
        echo "✓ Using existing tenant user: {$tenantUser->email} (ID: {$tenantUser->id})\n";
    }

    // Asignar rol de tenant si no lo tiene
    if (class_exists('Spatie\Permission\Models\Role')) {
        $tenantRole = Spatie\Permission\Models\Role::firstOrCreate(['name' => 'tenant']);
        if (!$tenantUser->hasRole('tenant')) {
            $tenantUser->assignRole($tenantRole);
        }
    }

    // Crear registro en tabla tenants
    $tenant = App\Models\Tenant::where('email', 'tenant.test@adkassist.com')->first();
    if (!$tenant) {
        $tenant = App\Models\Tenant::create([
            'apartment_id' => 240, // Demo Building
            'name' => 'Test Tenant Organization',
            'email' => 'tenant.test@adkassist.com',
            'phone' => '+1234567890',
            'visible' => true,
            'status' => 1
        ]);
        echo "✓ Tenant record created: {$tenant->email} (ID: {$tenant->id})\n";
    } else {
        echo "✓ Using existing tenant record: {$tenant->email} (ID: {$tenant->id})\n";
    }

    // Crear usuario member con mismo email que el tenant
    $memberUser = App\Models\User::where('email', 'tenant.test@adkassist.com')->first();
    
    echo "✓ Member user will use tenant email: {$memberUser->email} (ID: {$memberUser->id})\n";
    echo "✓ Member associated with tenant record ID: {$tenant->id}\n";

    // Asignar rol member si no lo tiene (el mismo user puede tener múltiples roles)
    if (class_exists('Spatie\Permission\Models\Role')) {
        $memberRole = Spatie\Permission\Models\Role::firstOrCreate(['name' => 'member']);
        if (!$memberUser->hasRole('member')) {
            $memberUser->assignRole($memberRole);
        }
        echo "✓ Member role assigned to user\n";
    }

    // Usar dispositivo existente que tiene alertas y asociarlo al tenant
    $device = App\Models\Device::find(17); // DESKTOP-6VEP452
    if ($device) {
        // Asociar dispositivo al tenant usando la tabla pivot
        $tenant->devices()->syncWithoutDetaching([$device->id]);
        echo "✓ Device associated with tenant: {$device->name} (ID: {$device->id})\n";
        echo "✓ Device NinjaOne ID: {$device->ninjaone_device_id}\n";
    } else {
        echo "✗ Device ID 17 not found\n";
        return;
    }

    echo "✓ Device created: {$device->name} (ID: {$device->id})\n";


    // Crear token para el usuario member
    $token = $memberUser->createToken('mobile-app-test')->plainTextToken;
    echo "✓ Sanctum token created for member user\n";

    echo "\n=== TESTING MOBILE API WITH PROPER SETUP ===\n";

    // Test mobile alerts API
    $mobileRequest = Illuminate\Http\Request::create(
        '/api/ninjaone/mobile-alerts',
        'GET',
        [],
        [],
        [],
        [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            'HTTP_ACCEPT' => 'application/json'
        ]
    );
    $mobileRequest->setUserResolver(function() use ($memberUser) {
        return $memberUser;
    });

    $alertsController = new App\Http\Controllers\NinjaOneAlertsController();
    $mobileResponse = $alertsController->mobileAlerts($mobileRequest);
    
    echo "Mobile API Response: " . $mobileResponse->status() . "\n";
    $mobileData = json_decode($mobileResponse->getContent(), true);
    
    if ($mobileData['success']) {
        echo "✓ Mobile API working correctly\n";
        echo "Total Alerts: " . $mobileData['total_count'] . "\n";
        echo "Critical Alerts: " . $mobileData['critical_count'] . "\n";
        echo "Device Count: " . $mobileData['device_count'] . "\n";
    } else {
        echo "✗ Mobile API Error: " . $mobileData['message'] . "\n";
    }

    echo "\n=== TEST CREDENTIALS ===\n";
    echo "Tenant User (same as member):\n";
    echo "  Email: {$tenantUser->email}\n";
    echo "  Password: password\n";
    echo "  Roles: tenant, member\n";
    echo "  User ID: {$tenantUser->id}\n";
    echo "  Tenant Record ID: {$tenant->id}\n";
    echo "  Sanctum Token: {$token}\n\n";
    
    echo "Device:\n";
    echo "  Name: {$device->name}\n";
    echo "  ID: {$device->id}\n";
    echo "  NinjaOne Device ID: {$device->ninjaone_device_id}\n";
    echo "  Associated with Tenant: {$tenant->name}\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}