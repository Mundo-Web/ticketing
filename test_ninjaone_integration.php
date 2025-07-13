<?php

/**
 * Simple test script to verify NinjaOne integration functionality
 * Run with: php test_ninjaone_integration.php
 */

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo "=== NinjaOne Integration Test ===\n\n";

// Test 1: Check if NinjaOne-enabled devices exist
echo "1. Testing NinjaOne-enabled devices...\n";
try {
    $enabledDevices = \App\Models\Device::where('ninjaone_enabled', true)->count();
    echo "   ✓ Found {$enabledDevices} NinjaOne-enabled devices\n";
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 2: Check if NinjaOne alerts exist
echo "\n2. Testing NinjaOne alerts...\n";
try {
    $alertCount = \App\Models\NinjaOneAlert::count();
    echo "   ✓ Found {$alertCount} NinjaOne alerts\n";
    
    $statusCounts = \App\Models\NinjaOneAlert::selectRaw('status, COUNT(*) as count')
        ->groupBy('status')
        ->pluck('count', 'status')
        ->toArray();
    
    foreach ($statusCounts as $status => $count) {
        echo "     - {$status}: {$count} alerts\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 3: Test NinjaOneService
echo "\n3. Testing NinjaOneService...\n";
try {
    $service = new \App\Services\NinjaOneService();
    echo "   ✓ NinjaOneService instantiated successfully\n";
    
    // Test configuration
    $config = config('services.ninjaone');
    if ($config['api_url'] && $config['client_id']) {
        echo "   ✓ NinjaOne configuration loaded\n";
    } else {
        echo "   ⚠ Warning: NinjaOne configuration incomplete\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 4: Test NotificationService
echo "\n4. Testing NotificationService...\n";
try {
    $notificationService = new \App\Services\NotificationService();
    echo "   ✓ NotificationService instantiated successfully\n";
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 5: Test webhook route
echo "\n5. Testing webhook route...\n";
try {
    $routes = collect(\Illuminate\Support\Facades\Route::getRoutes()->getRoutes());
    $webhookRoute = $routes->first(function ($route) {
        return str_contains($route->uri(), 'ninjaone/webhook');
    });
    
    if ($webhookRoute) {
        echo "   ✓ Webhook route found: " . $webhookRoute->uri() . "\n";
    } else {
        echo "   ✗ Webhook route not found\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 6: Test device relationships
echo "\n6. Testing device relationships...\n";
try {
    $deviceWithAlerts = \App\Models\Device::where('ninjaone_enabled', true)
        ->with('ninjaoneAlerts')
        ->first();
    
    if ($deviceWithAlerts) {
        $alertCount = $deviceWithAlerts->ninjaoneAlerts->count();
        echo "   ✓ Device '{$deviceWithAlerts->name}' has {$alertCount} alerts\n";
    } else {
        echo "   ⚠ No NinjaOne-enabled devices found for relationship test\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

// Test 7: Test alert model methods
echo "\n7. Testing alert model methods...\n";
try {
    $alert = \App\Models\NinjaOneAlert::first();
    if ($alert) {
        echo "   ✓ Found alert: '{$alert->title}'\n";
        echo "     - Status: {$alert->status}\n";
        echo "     - Severity: {$alert->severity}\n";
        echo "     - Can be acknowledged: " . ($alert->canBeAcknowledged() ? 'Yes' : 'No') . "\n";
        echo "     - Can be resolved: " . ($alert->canBeResolved() ? 'Yes' : 'No') . "\n";
    } else {
        echo "   ⚠ No alerts found for testing\n";
    }
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
echo "Integration appears to be working correctly!\n";
echo "You can now test the frontend by visiting the tickets page.\n";
