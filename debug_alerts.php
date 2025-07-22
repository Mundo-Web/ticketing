<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== DEBUGGING ALERT-DEVICE RELATIONSHIPS ===\n\n";

// Check alerts
$alerts = \App\Models\NinjaOneAlert::with('device')->get();
echo "Total alerts: " . $alerts->count() . "\n\n";

foreach ($alerts as $alert) {
    echo "Alert ID: {$alert->id}\n";
    echo "Device ID: {$alert->device_id}\n";
    echo "Device found: " . ($alert->device ? "YES - {$alert->device->name}" : "NO") . "\n";
    echo "---\n";
}

echo "\n=== DEVICES IN DATABASE ===\n";
$devices = \App\Models\Device::all();
echo "Total devices: " . $devices->count() . "\n\n";

foreach ($devices->take(10) as $device) {
    echo "Device ID: {$device->id} - Name: {$device->name}\n";
}

if ($devices->count() > 10) {
    echo "... and " . ($devices->count() - 10) . " more devices\n";
}
