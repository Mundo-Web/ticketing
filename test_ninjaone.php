<?php

require_once 'vendor/autoload.php';

// Cargar las variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "=== NINJAONE CONFIGURATION TEST ===\n";
echo "API URL: " . $_ENV['NINJAONE_API_URL'] . "\n";
echo "Client ID: " . $_ENV['NINJAONE_CLIENT_ID'] . "\n";
echo "Client Secret: " . substr($_ENV['NINJAONE_CLIENT_SECRET'], 0, 10) . "...\n";
echo "Webhook Secret: " . substr($_ENV['NINJAONE_WEBHOOK_SECRET'], 0, 10) . "...\n";

echo "\n=== TESTING API CONNECTION ===\n";

// Test 1: Obtener token de acceso
function getNinjaOneToken() {
    $url = $_ENV['NINJAONE_API_URL'] . '/ws/oauth/token';
    
    $data = [
        'grant_type' => 'client_credentials',
        'client_id' => $_ENV['NINJAONE_CLIENT_ID'],
        'client_secret' => $_ENV['NINJAONE_CLIENT_SECRET'],
        'scope' => 'monitoring'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Token Request - HTTP Code: $httpCode\n";
    
    if ($httpCode === 200) {
        $tokenData = json_decode($response, true);
        echo "✅ Token obtained successfully!\n";
        echo "Token Type: " . $tokenData['token_type'] . "\n";
        echo "Expires In: " . $tokenData['expires_in'] . " seconds\n";
        return $tokenData['access_token'];
    } else {
        echo "❌ Failed to get token\n";
        echo "Response: $response\n";
        return null;
    }
}

// Test 2: Obtener lista de dispositivos
function getDevices($token) {
    if (!$token) return;
    
    echo "\n=== TESTING DEVICES API ===\n";
    
    $url = $_ENV['NINJAONE_API_URL'] . '/v2/devices';
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Devices Request - HTTP Code: $httpCode\n";
    
    if ($httpCode === 200) {
        $devices = json_decode($response, true);
        echo "✅ Devices retrieved successfully!\n";
        echo "Total devices: " . count($devices) . "\n";
        
        if (!empty($devices)) {
            echo "\nFirst device info:\n";
            $firstDevice = $devices[0];
            echo "- ID: " . ($firstDevice['id'] ?? 'N/A') . "\n";
            echo "- System Name: " . ($firstDevice['systemName'] ?? 'N/A') . "\n";
            echo "- Online: " . ($firstDevice['online'] ? 'Yes' : 'No') . "\n";
        }
        
        return $devices;
    } else {
        echo "❌ Failed to get devices\n";
        echo "Response: $response\n";
        return null;
    }
}

// Test 3: Probar webhook endpoint
function testWebhookEndpoint() {
    echo "\n=== TESTING WEBHOOK ENDPOINT ===\n";
    
    $url = 'https://adkassist.xyz/api/ninjaone/webhook';
    
    // Simular un webhook de prueba
    $testPayload = [
        'eventType' => 'test',
        'timestamp' => date('c'),
        'data' => [
            'message' => 'Test webhook call'
        ]
    ];
    
    $signature = hash_hmac('sha256', json_encode($testPayload), $_ENV['NINJAONE_WEBHOOK_SECRET']);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testPayload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-NinjaRMM-Signature: sha256=' . $signature
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "Webhook Test - HTTP Code: $httpCode\n";
    
    if ($httpCode === 200) {
        echo "✅ Webhook endpoint is working!\n";
        echo "Response: $response\n";
    } else {
        echo "❌ Webhook endpoint failed\n";
        echo "Response: $response\n";
    }
}

// Ejecutar todos los tests
$token = getNinjaOneToken();
$devices = getDevices($token);
testWebhookEndpoint();

echo "\n=== TEST COMPLETED ===\n";
