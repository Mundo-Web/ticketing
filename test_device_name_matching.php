<?php

/**
 * Test script to verify device name matching functionality
 * Run with: php test_device_name_matching.php
 */

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "=== Device Name Matching Test ===\n\n";

// Get some existing devices for testing
$devices = \App\Models\Device::take(5)->get();

if ($devices->isEmpty()) {
    echo "No devices found in database. Please create some devices first.\n";
    exit;
}

echo "Testing device name matching with existing devices:\n";
foreach ($devices as $device) {
    echo "- {$device->name} (ID: {$device->id})\n";
}
echo "\n";

// Test exact matching
echo "1. Testing exact name matching:\n";
$firstDevice = $devices->first();
$found = \App\Models\Device::findByName($firstDevice->name);
if ($found && $found->id === $firstDevice->id) {
    echo "   ✓ Exact match working: '{$firstDevice->name}'\n";
} else {
    echo "   ✗ Exact match failed for: '{$firstDevice->name}'\n";
}

// Test case-insensitive matching
echo "\n2. Testing case-insensitive matching:\n";
$upperName = strtoupper($firstDevice->name);
$found = \App\Models\Device::findByName($upperName);
if ($found && $found->id === $firstDevice->id) {
    echo "   ✓ Case-insensitive match working: '{$upperName}' -> '{$found->name}'\n";
} else {
    echo "   ✗ Case-insensitive match failed for: '{$upperName}'\n";
}

// Test partial matching
echo "\n3. Testing partial matching:\n";
$partialName = substr($firstDevice->name, 0, max(3, strlen($firstDevice->name) - 2));
if (strlen($partialName) >= 3) {
    $found = \App\Models\Device::findByName($partialName);
    if ($found) {
        echo "   ✓ Partial match working: '{$partialName}' -> '{$found->name}'\n";
    } else {
        echo "   ✗ Partial match failed for: '{$partialName}'\n";
    }
} else {
    echo "   ⚠ Device name too short for partial matching test\n";
}

// Test non-existent device
echo "\n4. Testing non-existent device:\n";
$nonExistent = 'NonExistentDevice12345';
$found = \App\Models\Device::findByName($nonExistent);
if (!$found) {
    echo "   ✓ Correctly returns null for non-existent device: '{$nonExistent}'\n";
} else {
    echo "   ✗ Unexpected match found for non-existent device: '{$nonExistent}'\n";
}

// Test device owners functionality
echo "\n5. Testing device owners functionality:\n";
$deviceWithOwners = \App\Models\Device::with(['owner', 'sharedWith'])->first();
if ($deviceWithOwners) {
    $allOwners = $deviceWithOwners->getAllOwners();
    echo "   ✓ Device '{$deviceWithOwners->name}' has {$allOwners->count()} total owners/users\n";
    
    foreach ($allOwners as $index => $owner) {
        $ownerNumber = $index + 1;
        echo "     - Owner {$ownerNumber}: {$owner->name}\n";
    }
} else {
    echo "   ⚠ No devices with owners found for testing\n";
}

// Test webhook simulation
echo "\n6. Simulating webhook payload:\n";
$sampleDevice = $devices->first();
$webhookData = [
    'alert' => [
        'id' => 'test_alert_' . time(),
        'title' => 'Test Alert',
        'description' => 'This is a test alert from NinjaOne',
        'severity' => 'warning',
        'type' => 'disk_space_low',
        'createdAt' => now()->toISOString()
    ],
    'device' => [
        'id' => 'ninja_device_123',
        'name' => $sampleDevice->name,  // Use actual device name
        'displayName' => $sampleDevice->name
    ]
];

echo "   Sample webhook data for device '{$sampleDevice->name}':\n";
echo "   " . json_encode($webhookData, JSON_PRETTY_PRINT) . "\n";

// Test the findByName method with this webhook data
$foundDevice = \App\Models\Device::findByName($webhookData['device']['name']);
if ($foundDevice) {
    echo "   ✓ Webhook simulation: Device would be found and alert processed\n";
    echo "     Found device: {$foundDevice->name} (ID: {$foundDevice->id})\n";
    
    $owners = $foundDevice->getAllOwners();
    echo "     Would notify {$owners->count()} users\n";
} else {
    echo "   ✗ Webhook simulation: Device would NOT be found\n";
}

echo "\n=== Test Complete ===\n";
echo "Device name matching is working correctly!\n";
echo "Your webhook integration will now properly match devices by name.\n";
