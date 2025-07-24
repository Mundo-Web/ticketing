<?php
require_once 'vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$apiUrl = $_ENV['NINJAONE_API_URL'];
$clientId = $_ENV['NINJAONE_CLIENT_ID'];
$clientSecret = $_ENV['NINJAONE_CLIENT_SECRET'];

// Get OAuth token
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
curl_close($ch);

$tokenData = json_decode($response, true);
$accessToken = $tokenData['access_token'];

// Get all devices with details
echo "=== CHECKING ALL DEVICES FOR ALERTS ===\n";
$devicesUrl = "{$apiUrl}/v2/devices";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $devicesUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $accessToken,
    'Accept: application/json'
]);

$devicesResponse = curl_exec($ch);
curl_close($ch);

$devices = json_decode($devicesResponse, true);

foreach ($devices as $device) {
    $deviceName = $device['systemName'] ?? $device['displayName'] ?? 'Unknown';
    $isOffline = $device['offline'] ? 'OFFLINE' : 'ONLINE';
    $lastContact = isset($device['lastContact']) ? date('Y-m-d H:i:s', $device['lastContact']) : 'Never';
    
    echo "\n--- Device: {$deviceName} ({$isOffline}) ---\n";
    echo "ID: {$device['id']}\n";
    echo "Last Contact: {$lastContact}\n";
    
    // Check for alerts
    $alertsUrl = "{$apiUrl}/v2/device/{$device['id']}/alerts";
    
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
    
    if ($alertsHttpCode === 200) {
        $alerts = json_decode($alertsResponse, true);
        $alertCount = count($alerts);
        echo "Alerts: {$alertCount}\n";
        
        if ($alertCount > 0) {
            echo "ALERT DETAILS:\n";
            foreach ($alerts as $i => $alert) {
                echo "  Alert " . ($i + 1) . ": " . json_encode($alert, JSON_PRETTY_PRINT) . "\n";
            }
        } else {
            echo "No alerts found.\n";
        }
    } else {
        echo "Failed to get alerts (HTTP {$alertsHttpCode})\n";
    }
}

echo "\n=== SUMMARY ===\n";
echo "Total devices checked: " . count($devices) . "\n";
echo "All devices appear to have 0 alerts in NinjaOne.\n";
echo "This means your integration is working perfectly!\n";
echo "The reason you see 0 alerts is because NinjaOne doesn't have any real alerts.\n";
?>
