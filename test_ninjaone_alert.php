<?php

require_once 'vendor/autoload.php';

// Cargar las variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "=== TESTING NINJAONE ALERT WEBHOOK ===\n";

// Test: Simular un webhook de alerta real
function testAlertWebhook() {
    $url = 'https://adkassist.xyz/api/ninjaone/webhook';
    
    // Simular un webhook de alerta real de NinjaOne
    $alertPayload = [
        'eventType' => 'alert.created',
        'timestamp' => date('c'),
        'data' => [
            'alert' => [
                'id' => 'alert_' . time(),
                'type' => 'disk_space',
                'severity' => 'warning',
                'title' => 'Low Disk Space Warning',
                'description' => 'Disk C: is running low on space (85% full)',
                'createdAt' => date('c')
            ],
            'device' => [
                'id' => 1,
                'name' => 'Admins-iMac.local',
                'displayName' => 'Admins-iMac.local'
            ]
        ]
    ];
    
    $payload = json_encode($alertPayload);
    $signature = hash_hmac('sha256', $payload, $_ENV['NINJAONE_WEBHOOK_SECRET']);
    
    echo "Testing Alert Event:\n";
    echo "- Event Type: alert.created\n";
    echo "- Device Name: Admins-iMac.local\n";
    echo "- Alert Type: disk_space\n";
    echo "- Severity: warning\n\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-NinjaOne-Signature: ' . $signature
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Alert Webhook Test - HTTP Code: $httpCode\n";
    echo "Response: $response\n";
    
    if ($httpCode === 200) {
        $responseData = json_decode($response, true);
        if (isset($responseData['alert_id'])) {
            echo "✅ Alert processed successfully! Alert ID: " . $responseData['alert_id'] . "\n";
        } elseif (isset($responseData['message']) && strpos($responseData['message'], 'not found') !== false) {
            echo "⚠️  Alert processed but device not found in system\n";
            echo "💡 You need to create a device with name: Admins-iMac.local\n";
        } else {
            echo "✅ Alert webhook working!\n";
        }
    } else {
        echo "❌ Alert webhook failed\n";
    }
}

// Test: Simular webhook de estado de dispositivo
function testDeviceStatusWebhook() {
    echo "\n=== TESTING DEVICE STATUS WEBHOOK ===\n";
    
    $url = 'https://adkassist.xyz/api/ninjaone/webhook';
    
    $statusPayload = [
        'eventType' => 'device.offline',
        'timestamp' => date('c'),
        'data' => [
            'device' => [
                'id' => 1,
                'name' => 'Admins-iMac.local'
            ],
            'status' => 'offline'
        ]
    ];
    
    $payload = json_encode($statusPayload);
    $signature = hash_hmac('sha256', $payload, $_ENV['NINJAONE_WEBHOOK_SECRET']);
    
    echo "Testing Device Status Event:\n";
    echo "- Event Type: device.offline\n";
    echo "- Device Name: Admins-iMac.local\n\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-NinjaOne-Signature: ' . $signature
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Device Status Webhook Test - HTTP Code: $httpCode\n";
    echo "Response: $response\n";
    
    if ($httpCode === 200) {
        echo "✅ Device status webhook working!\n";
    } else {
        echo "❌ Device status webhook failed\n";
    }
}

// Ejecutar los tests
testAlertWebhook();
testDeviceStatusWebhook();

echo "\n=== WEBHOOK TESTS COMPLETED ===\n";
echo "\n💡 NEXT STEPS:\n";
echo "1. Create devices in your system that match NinjaOne device names\n";
echo "2. Configure the webhook URL in NinjaOne console:\n";
echo "   URL: https://adkassist.xyz/api/ninjaone/webhook\n";
echo "   Secret: " . substr($_ENV['NINJAONE_WEBHOOK_SECRET'], 0, 20) . "...\n";
echo "3. Select events: alert.created, alert.resolved, device.online, device.offline\n";
