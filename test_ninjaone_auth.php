<?php
require_once 'vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$apiUrl = $_ENV['NINJAONE_API_URL'];
$clientId = $_ENV['NINJAONE_CLIENT_ID'];
$clientSecret = $_ENV['NINJAONE_CLIENT_SECRET'];

echo "=== TESTING NINJAONE AUTHENTICATION ===\n";
echo "API URL: {$apiUrl}\n";
echo "Client ID: {$clientId}\n";
echo "Client Secret: " . substr($clientSecret, 0, 10) . "...\n\n";

// Test OAuth token
echo "1. Testing OAuth Token...\n";
$tokenUrl = "{$apiUrl}/ws/oauth/token";
$postData = [
    'grant_type' => 'client_credentials',
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'scope' => 'monitoring'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $tokenUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
echo "Response: {$response}\n\n";

if ($httpCode === 200) {
    $tokenData = json_decode($response, true);
    $accessToken = $tokenData['access_token'];
    echo "✅ OAuth token obtained successfully!\n";
    echo "Token: " . substr($accessToken, 0, 20) . "...\n\n";
    
    // Test get all devices
    echo "2. Testing Get All Devices...\n";
    $devicesUrl = "{$apiUrl}/v2/devices";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $devicesUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Accept: application/json'
    ]);
    
    $devicesResponse = curl_exec($ch);
    $devicesHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Code: {$devicesHttpCode}\n";
    echo "Response: " . substr($devicesResponse, 0, 500) . "...\n\n";
    
    if ($devicesHttpCode === 200) {
        $devices = json_decode($devicesResponse, true);
        echo "✅ Devices retrieved successfully!\n";
        echo "Device count: " . count($devices) . "\n";
        
        if (!empty($devices)) {
            $firstDevice = $devices[0];
            echo "First device: " . json_encode($firstDevice, JSON_PRETTY_PRINT) . "\n\n";
            
            // Test get device alerts for first device
            if (isset($firstDevice['id'])) {
                echo "3. Testing Get Device Alerts for device ID: {$firstDevice['id']}...\n";
                $alertsUrl = "{$apiUrl}/v2/device/{$firstDevice['id']}/alerts";
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $alertsUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $accessToken,
                    'Accept: application/json'
                ]);
                
                $alertsResponse = curl_exec($ch);
                $alertsHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                echo "HTTP Code: {$alertsHttpCode}\n";
                echo "Response: {$alertsResponse}\n\n";
                
                if ($alertsHttpCode === 200) {
                    $alerts = json_decode($alertsResponse, true);
                    echo "✅ Device alerts retrieved successfully!\n";
                    echo "Alerts count: " . count($alerts) . "\n";
                    if (!empty($alerts)) {
                        echo "First alert: " . json_encode($alerts[0], JSON_PRETTY_PRINT) . "\n";
                    } else {
                        echo "ℹ️  No alerts found for this device.\n";
                    }
                } else {
                    echo "❌ Failed to get device alerts\n";
                }
            }
        }
    } else {
        echo "❌ Failed to get devices\n";
    }
} else {
    echo "❌ Failed to get OAuth token\n";
}

echo "\n=== TEST COMPLETE ===\n";
?>
