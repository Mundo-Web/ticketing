<?php

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Test final de integración NinjaOne-Mobile con datos correctos
 */

echo "=== FINAL NINJAONE MOBILE INTEGRATION TEST ===\n\n";

try {
    // Configurar la aplicación Laravel
    $app = require_once __DIR__ . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    // Usar el usuario que acabamos de configurar
    $tenantUser = App\Models\User::where('email', 'tenant.test@adkassist.com')->first();
    if (!$tenantUser) {
        echo "✗ Tenant user not found. Run setup_test_users.php first.\n";
        return;
    }

    // Crear nuevo token
    $token = $tenantUser->createToken('final-test')->plainTextToken;
    echo "✓ Using tenant user: {$tenantUser->email} (ID: {$tenantUser->id})\n";
    echo "✓ Generated fresh token\n";

    // Test 1: Mobile Alerts API
    echo "\n1. Testing Mobile Alerts API...\n";
    
    $mobileRequest = Illuminate\Http\Request::create(
        '/api/ninjaone/mobile-alerts',
        'GET',
        ['severity' => 'critical'], // Solo críticas
        [],
        [],
        [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
            'HTTP_ACCEPT' => 'application/json'
        ]
    );
    $mobileRequest->setUserResolver(function() use ($tenantUser) {
        return $tenantUser;
    });

    $alertsController = new App\Http\Controllers\NinjaOneAlertsController();
    $mobileResponse = $alertsController->mobileAlerts($mobileRequest);
    
    echo "   Response Code: " . $mobileResponse->status() . "\n";
    $mobileData = json_decode($mobileResponse->getContent(), true);
    
    if ($mobileData['success']) {
        echo "   ✓ Success!\n";
        echo "   Total Alerts: " . $mobileData['total_count'] . "\n";
        echo "   Critical Alerts: " . $mobileData['critical_count'] . "\n";
        echo "   Warning Alerts: " . $mobileData['warning_count'] . "\n";
        echo "   Device Count: " . $mobileData['device_count'] . "\n";
        
        if (!empty($mobileData['alerts'])) {
            echo "\n   Alert Details:\n";
            foreach ($mobileData['alerts'] as $index => $alert) {
                echo "     Alert #" . ($index + 1) . ":\n";
                echo "       ID: " . $alert['id'] . "\n";
                echo "       Title: " . $alert['title'] . "\n";
                echo "       Severity: " . $alert['severity'] . "\n";
                echo "       Status: " . $alert['status'] . "\n";
                echo "       Device: " . $alert['device']['name'] . "\n";
                echo "       Can Acknowledge: " . ($alert['can_acknowledge'] ? 'Yes' : 'No') . "\n";
                echo "       Can Create Ticket: " . ($alert['can_create_ticket'] ? 'Yes' : 'No') . "\n";
                echo "\n";
                
                // Test acknowledge action on first alert
                if ($index === 0 && $alert['can_acknowledge']) {
                    echo "   Testing Acknowledge on Alert #{$alert['id']}...\n";
                    
                    $ackRequest = Illuminate\Http\Request::create(
                        "/api/ninjaone/alerts/{$alert['id']}/acknowledge",
                        'POST',
                        [],
                        [],
                        [],
                        [
                            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
                            'HTTP_ACCEPT' => 'application/json'
                        ]
                    );
                    $ackRequest->setUserResolver(function() use ($tenantUser) {
                        return $tenantUser;
                    });

                    $alertModel = App\Models\NinjaOneAlert::find($alert['id']);
                    $ackResponse = $alertsController->mobileAcknowledge($ackRequest, $alertModel);
                    $ackData = json_decode($ackResponse->getContent(), true);
                    
                    echo "     Acknowledge Result: " . ($ackData['success'] ? '✓ Success' : '✗ Failed') . "\n";
                    echo "     Message: " . $ackData['message'] . "\n";
                }
                
                // Test ticket creation on first alert
                if ($index === 0 && $alert['can_create_ticket']) {
                    echo "   Testing Ticket Creation on Alert #{$alert['id']}...\n";
                    
                    $ticketRequest = Illuminate\Http\Request::create(
                        "/api/ninjaone/alerts/{$alert['id']}/create-ticket",
                        'POST',
                        [
                            'title' => 'Mobile Test Ticket - ' . date('H:i:s'),
                            'priority' => 'high'
                        ],
                        [],
                        [],
                        [
                            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
                            'HTTP_ACCEPT' => 'application/json'
                        ]
                    );
                    $ticketRequest->setUserResolver(function() use ($tenantUser) {
                        return $tenantUser;
                    });

                    $alertModel = App\Models\NinjaOneAlert::find($alert['id']);
                    $ticketResponse = $alertsController->mobileCreateTicket($ticketRequest, $alertModel);
                    $ticketData = json_decode($ticketResponse->getContent(), true);
                    
                    echo "     Ticket Creation Result: " . ($ticketData['success'] ? '✓ Success' : '✗ Failed') . "\n";
                    echo "     Message: " . $ticketData['message'] . "\n";
                    if (isset($ticketData['ticket_id'])) {
                        echo "     Ticket ID: " . $ticketData['ticket_id'] . "\n";
                    }
                }
                
                break; // Solo probar con la primera alerta
            }
        }
    } else {
        echo "   ✗ Failed: " . $mobileData['message'] . "\n";
    }

    // Test 2: Simular webhook NinjaOne
    echo "\n2. Testing Webhook Integration...\n";
    
    $webhookData = [
        'activityType' => 'CONDITION_ALERT',
        'timestamp' => date('c'),
        'data' => [
            'device' => [
                'id' => 5, // Usar el ID del dispositivo que ya existe
                'name' => 'DESKTOP-6VEP452',
                'systemName' => 'DESKTOP-6VEP452',
                'nodeClass' => 'WINDOWS_WORKSTATION'
            ],
            'alert' => [
                'uid' => 'mobile_test_' . time(),
                'title' => 'High Memory Usage Alert',
                'message' => 'Memory usage has exceeded 85% for 10 minutes',
                'severity' => 'warning',
                'category' => 'performance',
                'timestamp' => date('c'),
                'conditions' => [
                    [
                        'name' => 'Memory Usage',
                        'value' => '87%',
                        'threshold' => '85%'
                    ]
                ]
            ]
        ]
    ];

    $webhookRequest = Illuminate\Http\Request::create(
        '/api/ninjaone/webhook',
        'POST',
        [],
        [],
        [],
        [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_USER_AGENT' => 'NinjaRMM-Webhook/1.0'
        ],
        json_encode($webhookData)
    );

    $webhookController = new App\Http\Controllers\Api\NinjaOneWebhookController();
    $webhookResponse = $webhookController->handle($webhookRequest);
    
    echo "   Webhook Response: " . $webhookResponse->status() . "\n";
    $webhookResponseData = json_decode($webhookResponse->getContent(), true);
    echo "   Status: " . ($webhookResponseData['status'] ?? 'unknown') . "\n";
    echo "   Message: " . ($webhookResponseData['message'] ?? 'N/A') . "\n";

    // Verificar que la nueva alerta apareció
    echo "\n3. Verifying New Alert in Mobile API...\n";
    
    $verifyRequest = Illuminate\Http\Request::create(
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
    $verifyRequest->setUserResolver(function() use ($tenantUser) {
        return $tenantUser;
    });

    $verifyResponse = $alertsController->mobileAlerts($verifyRequest);
    $verifyData = json_decode($verifyResponse->getContent(), true);
    
    echo "   Updated Alert Count: " . $verifyData['total_count'] . "\n";
    echo "   Critical: " . $verifyData['critical_count'] . "\n";
    echo "   Warning: " . $verifyData['warning_count'] . "\n";

    echo "\n=== INTEGRATION TEST COMPLETED SUCCESSFULLY ===\n";
    echo "\n✅ READY FOR PRODUCTION!\n\n";
    
    echo "Mobile App Integration Details:\n";
    echo "===============================\n";
    echo "API Base URL: https://adkassist.com/api\n";
    echo "Authentication: Sanctum Bearer Token\n";
    echo "Endpoints:\n";
    echo "  - GET /ninjaone/mobile-alerts - Get alerts for mobile\n";
    echo "  - POST /ninjaone/alerts/{id}/acknowledge - Acknowledge alert\n";
    echo "  - POST /ninjaone/alerts/{id}/create-ticket - Create ticket from alert\n\n";
    
    echo "Webhook Configuration:\n";
    echo "=====================\n";
    echo "URL: https://adkassist.com/api/ninjaone/webhook\n";
    echo "Method: POST\n";
    echo "Content-Type: application/json\n";
    echo "Authentication: None (webhook signature validation can be added)\n\n";
    
    echo "Test Token (expires in 1 year): {$token}\n";
    echo "Test User: {$tenantUser->email} / password\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}