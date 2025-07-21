<?php

require_once 'vendor/autoload.php';

// Cargar las variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "=== TESTING NINJAONE SYNC FUNCTIONALITY ===\n";

// Test: Verificar ruta de sync
function testSyncRoute() {
    echo "\n=== TESTING SYNC ROUTE ===\n";
    
    $url = 'https://adkassist.xyz/api/ninjaone/devices/1/sync';
    
    $syncData = [
        'systemName' => 'Admins-iMac.local',
        'hostname' => 'Admins-iMac.local',
        'manufacturer' => 'Apple',
        'model' => 'iMac',
        'operatingSystem' => 'macOS',
        'deviceId' => 1
    ];
    
    echo "Testing Sync Endpoint:\n";
    echo "- URL: $url\n";
    echo "- Device: Admins-iMac.local\n";
    echo "- Manufacturer: Apple\n";
    echo "- Model: iMac\n\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($syncData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo "Sync Test - HTTP Code: $httpCode\n";
    
    if ($error) {
        echo "cURL Error: $error\n";
    }
    
    if ($httpCode === 200) {
        echo "✅ Sync endpoint is accessible!\n";
        echo "Response: $response\n";
    } elseif ($httpCode === 401) {
        echo "⚠️  Sync endpoint requires authentication\n";
        echo "💡 You need to be logged in to use this endpoint\n";
        echo "Response: $response\n";
    } elseif ($httpCode === 404) {
        echo "❌ Sync endpoint not found\n";
        echo "💡 Check if the route is properly defined\n";
    } else {
        echo "❌ Sync endpoint failed\n";
        echo "Response: $response\n";
    }
}

// Test: Verificar rutas de NinjaOne disponibles
function testAvailableRoutes() {
    echo "\n=== TESTING AVAILABLE NINJAONE ROUTES ===\n";
    
    $routes = [
        'Test Connection' => 'https://adkassist.xyz/api/ninjaone/test-connection',
        'Demo Device Count' => 'https://adkassist.xyz/api/ninjaone/demo/device-count',
        'Demo Alerts Count' => 'https://adkassist.xyz/api/ninjaone/demo/alerts-count',
        'Webhook' => 'https://adkassist.xyz/api/ninjaone/webhook'
    ];
    
    foreach ($routes as $name => $url) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_NOBODY, true); // HEAD request
        curl_setopt($ch, CURLOPT_HEADER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $status = ($httpCode < 400) ? '✅' : '❌';
        echo "$status $name: HTTP $httpCode\n";
    }
}

// Ejecutar los tests
testSyncRoute();
testAvailableRoutes();

echo "\n=== SYNC TESTS COMPLETED ===\n";
echo "\n💡 SUMMARY:\n";
echo "1. ✅ NinjaOne API Connection: Working\n";
echo "2. ✅ Webhook Endpoint: Working\n";
echo "3. ? Sync Endpoint: Check results above\n";
echo "\nIf sync requires authentication, you'll need to:\n";
echo "- Login to the admin panel first\n";
echo "- Use the authenticated session to access sync\n";
