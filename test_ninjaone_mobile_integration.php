<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Schema;

/**
 * Script de prueba para la integración móvil de NinjaOne
 * Simula el flujo completo de recepción de webhook y notificación móvil
 */

echo "=== TESTING NINJAONE MOBILE INTEGRATION ===\n\n";

try {
    // Configurar la aplicación Laravel
    $app = require_once __DIR__ . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    // Test 1: Simular webhook de NinjaOne
    echo "1. Testing NinjaOne Webhook Reception...\n";
    
    $webhookData = [
        'activityType' => 'CONDITION_ALERT',
        'timestamp' => date('c'),
        'data' => [
            'device' => [
                'id' => 123,
                'name' => 'Test-PC-01',
                'systemName' => 'TEST-DEVICE'
            ],
            'alert' => [
                'uid' => 'alert_' . time(),
                'title' => 'High CPU Usage Alert',
                'message' => 'CPU usage has exceeded 90% for 5 minutes',
                'severity' => 'critical',
                'category' => 'performance',
                'timestamp' => date('c'),
                'conditions' => [
                    [
                        'name' => 'CPU Usage',
                        'value' => '95%',
                        'threshold' => '90%'
                    ]
                ]
            ]
        ]
    ];

    // Crear request simulado
    $request = Illuminate\Http\Request::create(
        '/api/ninjaone/webhook',
        'POST',
        [],
        [],
        [],
        ['CONTENT_TYPE' => 'application/json'],
        json_encode($webhookData)
    );

    $webhookController = new App\Http\Controllers\Api\NinjaOneWebhookController();
    $response = $webhookController->handle($request);
    
    echo "   Webhook Response: " . $response->status() . "\n";
    echo "   Response Body: " . $response->getContent() . "\n\n";

    // Test 2: Verificar que la alerta se guardó
    echo "2. Checking Alert Storage...\n";
    
    $latestAlert = App\Models\NinjaOneAlert::orderBy('created_at', 'desc')->first();
    if ($latestAlert) {
        echo "   ✓ Alert stored successfully\n";
        echo "   Alert ID: {$latestAlert->id}\n";
        echo "   Title: {$latestAlert->title}\n";
        echo "   Severity: {$latestAlert->severity}\n";
        echo "   Device ID: {$latestAlert->device_id}\n\n";
    } else {
        echo "   ✗ No alert found in database\n\n";
    }

    // Test 3: Simular acceso móvil a alertas
    echo "3. Testing Mobile API Access...\n";
    
    // Buscar un usuario con rol member
    $memberUser = App\Models\User::whereHas('roles', function($query) {
        $query->where('name', 'member');
    })->first();

    if (!$memberUser) {
        echo "   ⚠ No member user found, creating test user...\n";
        
        // Crear usuario de prueba
        $memberUser = App\Models\User::create([
            'name' => 'Mobile Test User',
            'email' => 'mobile.test@adkassist.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);
        
        // Asignar rol member
        if (class_exists('Spatie\Permission\Models\Role')) {
            $memberRole = Spatie\Permission\Models\Role::firstOrCreate(['name' => 'member']);
            $memberUser->assignRole($memberRole);
        }
        
        echo "   ✓ Test user created: {$memberUser->email}\n";
    }

    // Crear token de acceso
    $token = $memberUser->createToken('mobile-test')->plainTextToken;
    echo "   ✓ Access token created\n";

    // Simular request móvil
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
    
    echo "   Mobile API Response: " . $mobileResponse->status() . "\n";
    $mobileData = json_decode($mobileResponse->getContent(), true);
    echo "   Alerts Count: " . ($mobileData['total_count'] ?? 0) . "\n";
    echo "   Critical Count: " . ($mobileData['critical_count'] ?? 0) . "\n";
    echo "   Warning Count: " . ($mobileData['warning_count'] ?? 0) . "\n\n";

    // Test 4: Verificar notificaciones push
    echo "4. Testing Push Notification System...\n";
    
    $notifications = App\Models\User::find($memberUser->id)
        ->notifications()
        ->where('type', 'App\Notifications\NinjaOneAlertNotification')
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get();

    echo "   Recent NinjaOne notifications: " . $notifications->count() . "\n";
    
    foreach ($notifications as $notification) {
        $data = json_decode($notification->data, true);
        $title = isset($data['title']) ? $data['title'] : 'N/A';
        echo "   - {$title} ({$notification->created_at->diffForHumans()})\n";
    }

    // Test 5: Verificar configuración de Pusher
    echo "\n5. Checking Pusher Configuration...\n";
    
    $pusherKey = config('broadcasting.connections.pusher.key');
    $pusherSecret = config('broadcasting.connections.pusher.secret');
    $pusherAppId = config('broadcasting.connections.pusher.app_id');
    
    echo "   Pusher App ID: " . ($pusherAppId ? "✓ Configured" : "✗ Missing") . "\n";
    echo "   Pusher Key: " . ($pusherKey ? "✓ Configured" : "✗ Missing") . "\n";
    echo "   Pusher Secret: " . ($pusherSecret ? "✓ Configured" : "✗ Missing") . "\n";

    // Test 6: Verificar estructura de base de datos
    echo "\n6. Database Structure Verification...\n";
    
    // Verificar tabla ninja_one_alerts
    $alertsTableExists = Schema::hasTable('ninja_one_alerts');
    echo "   ninja_one_alerts table: " . ($alertsTableExists ? "✓ Exists" : "✗ Missing") . "\n";
    
    if ($alertsTableExists) {
        $columns = ['id', 'title', 'description', 'severity', 'status', 'device_id', 'ticket_id'];
        foreach ($columns as $column) {
            $hasColumn = Schema::hasColumn('ninja_one_alerts', $column);
            echo "     - $column: " . ($hasColumn ? "✓" : "✗") . "\n";
        }
    }

    // Verificar tabla devices
    $devicesTableExists = Schema::hasTable('devices');
    echo "   devices table: " . ($devicesTableExists ? "✓ Exists" : "✗ Missing") . "\n";

    echo "\n=== INTEGRATION TEST COMPLETED ===\n";
    echo "Summary:\n";
    echo "- Webhook endpoint: https://adkassist.com/api/ninjaone/webhook\n";
    echo "- Mobile API endpoint: https://adkassist.com/api/ninjaone/mobile-alerts\n";
    echo "- Authentication: Sanctum tokens for mobile\n";
    echo "- Real-time: Pusher WebSocket notifications\n";
    echo "- Database: NinjaOne alerts with device relationships\n\n";

    echo "Next Steps:\n";
    echo "1. Configure NinjaOne to send webhooks to your endpoint\n";
    echo "2. Test with real alerts from NinjaOne dashboard\n";
    echo "3. Integrate mobile app with /api/ninjaone/mobile-alerts\n";
    echo "4. Set up push notifications in mobile app\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}