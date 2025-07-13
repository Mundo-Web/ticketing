<?php

/**
 * Test script to simulate a real NinjaOne webhook
 * This script will send a test webhook to our endpoint
 */

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "=== NinjaOne Webhook Simulation ===\n\n";

// Get a test device
$testDevice = \App\Models\Device::where('name', 'TestDevice1')->first();

if (!$testDevice) {
    echo "No test device found. Please run the device name update command first.\n";
    exit;
}

echo "Using test device: {$testDevice->name} (ID: {$testDevice->id})\n\n";

// Create webhook payload that matches NinjaOne format
$webhookPayload = [
    'eventType' => 'alert.created',
    'data' => [
        'alert' => [
            'id' => 'ninja_alert_' . time(),
            'title' => 'Low Disk Space Warning',
            'description' => 'Disk C: is 85% full. Available space: 1.2GB',
            'severity' => 'warning',
            'type' => 'disk_space_low',
            'createdAt' => now()->toISOString(),
            'status' => 'open'
        ],
        'device' => [
            'id' => 'ninja_device_' . $testDevice->id,
            'name' => $testDevice->name,
            'displayName' => $testDevice->name,
            'serial' => 'ABC123DEF456',
            'asset_tag' => 'ASSET-001'
        ],
        'organization' => [
            'id' => 'org_123',
            'name' => 'Test Organization'
        ]
    ]
];

echo "Webhook payload:\n";
echo json_encode($webhookPayload, JSON_PRETTY_PRINT) . "\n\n";

try {
    // Simulate the webhook processing directly
    echo "Processing webhook...\n";
    
    $data = $webhookPayload['data'];
    $alertId = $data['alert']['id'];
    $deviceName = $data['device']['name'];
    $alertType = $data['alert']['type'];
    $severity = $data['alert']['severity'];
    $title = $data['alert']['title'];
    $description = $data['alert']['description'];
    
    // Find device by name (this is our new functionality)
    echo "Looking for device by name: '{$deviceName}'...\n";
    $device = \App\Models\Device::findByName($deviceName);
    
    if ($device) {
        echo "✓ Device found: {$device->name} (ID: {$device->id})\n";
        
        // Auto-enable NinjaOne if not enabled
        if (!$device->ninjaone_enabled) {
            $device->update([
                'ninjaone_enabled' => true,
                'ninjaone_device_id' => $data['device']['id'],
            ]);
            echo "✓ Auto-enabled NinjaOne for device\n";
        }
        
        // Create alert
        $alert = \App\Models\NinjaOneAlert::create([
            'ninjaone_alert_id' => $alertId,
            'ninjaone_device_id' => $data['device']['id'],
            'device_id' => $device->id,
            'alert_type' => $alertType,
            'severity' => $severity,
            'title' => $title,
            'description' => $description,
            'metadata' => $data,
            'ninjaone_created_at' => now(),
        ]);
        
        echo "✓ Alert created successfully!\n";
        echo "  - Alert ID: {$alert->id}\n";
        echo "  - Title: {$alert->title}\n";
        echo "  - Device: {$alert->device->name}\n";
        echo "  - Severity: {$alert->severity}\n";
        echo "  - Status: {$alert->status}\n";
        
        // Get device owners for notification
        $owners = $device->getAllOwners();
        echo "  - Would notify {$owners->count()} users\n";
        
        if ($owners->count() > 0) {
            foreach ($owners as $owner) {
                echo "    * {$owner->name}\n";
            }
        }
        
    } else {
        echo "✗ Device not found with name: '{$deviceName}'\n";
        echo "Available devices:\n";
        $allDevices = \App\Models\Device::whereNotNull('name')->get();
        foreach ($allDevices as $d) {
            echo "  - {$d->name} (ID: {$d->id})\n";
        }
    }
    
} catch (Exception $e) {
    echo "Error processing webhook: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Webhook Test Complete ===\n";
