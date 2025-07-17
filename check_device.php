<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

$device = \App\Models\Device::find(13);

if ($device) {
    echo "Device ID: " . $device->id . "\n";
    echo "Name: " . $device->name . "\n";
    echo "NinjaOne Status: " . ($device->ninjaone_status ?? 'null') . "\n";
    echo "NinjaOne Online: " . ($device->ninjaone_online ? 'true' : 'false') . "\n";
    echo "NinjaOne Issues Count: " . ($device->ninjaone_issues_count ?? 'null') . "\n";
    echo "NinjaOne System Name: " . ($device->ninjaone_system_name ?? 'null') . "\n";
    echo "Is in NinjaOne: " . ($device->is_in_ninjaone ? 'true' : 'false') . "\n";
} else {
    echo "Device not found\n";
}
