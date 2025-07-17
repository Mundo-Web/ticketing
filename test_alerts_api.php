<?php

use App\Services\NinjaOneService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Config;

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing NinjaOne API for DAMIANPC device\n";

$service = app(NinjaOneService::class);
$deviceId = $service->findDeviceIdByName('DAMIANPC');

if (!$deviceId) {
    echo "Device not found\n";
    exit(1);
}

echo "Device ID: {$deviceId}\n";

// API URL y headers
$apiUrl = Config::get('services.ninjaone.api_url');
$headers = $service->testConnection() ? [
    'Authorization' => 'Bearer ' . Config::get('services.ninjaone.api_key'),
    'Accept' => 'application/json',
] : [];

if (empty($headers)) {
    echo "Failed to get valid authorization headers\n";
    exit(1);
}

// Consultar detalles del dispositivo
$response = Http::withHeaders($headers)
    ->get("{$apiUrl}/v2/devices/{$deviceId}");

echo "Device details status: {$response->status()}\n";
if ($response->successful()) {
    $data = $response->json();
    echo "Device details: " . json_encode($data, JSON_PRETTY_PRINT) . "\n\n";
} else {
    echo "Failed to get device details: {$response->body()}\n";
}

// Consultar alertas del dispositivo
$alertsResponse = Http::withHeaders($headers)
    ->get("{$apiUrl}/v2/devices/{$deviceId}/alerts");

echo "Alerts status: {$alertsResponse->status()}\n";
if ($alertsResponse->successful()) {
    $alerts = $alertsResponse->json();
    echo "Alerts count: " . count($alerts) . "\n";
    echo "Alerts: " . json_encode($alerts, JSON_PRETTY_PRINT) . "\n\n";
} else {
    echo "Failed to get alerts: {$alertsResponse->body()}\n";
}

// Probar con diferentes parámetros para las alertas
$params = [
    'statuses' => 'active,acknowledged',
    'includeDismissed' => 'true',
    'includeResolved' => 'true'
];

$alertsWithParamsResponse = Http::withHeaders($headers)
    ->get("{$apiUrl}/v2/devices/{$deviceId}/alerts", $params);

echo "Alerts with params status: {$alertsWithParamsResponse->status()}\n";
if ($alertsWithParamsResponse->successful()) {
    $alertsWithParams = $alertsWithParamsResponse->json();
    echo "Alerts with params count: " . count($alertsWithParams) . "\n";
    echo "Alerts with params: " . json_encode($alertsWithParams, JSON_PRETTY_PRINT) . "\n\n";
} else {
    echo "Failed to get alerts with params: {$alertsWithParamsResponse->body()}\n";
}

// Probar con el endpoint de todas las alertas
echo "Trying all alerts endpoint...\n";
$allAlertsResponse = Http::withHeaders($headers)
    ->get("{$apiUrl}/v2/alerts", [
        'deviceId' => $deviceId,
    ]);

echo "All alerts status: {$allAlertsResponse->status()}\n";
if ($allAlertsResponse->successful()) {
    $allAlerts = $allAlertsResponse->json();
    echo "All alerts count: " . count($allAlerts) . "\n";
    echo "All alerts: " . json_encode($allAlerts, JSON_PRETTY_PRINT) . "\n\n";
} else {
    echo "Failed to get all alerts: {$allAlertsResponse->body()}\n";
}
