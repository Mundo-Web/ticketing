<?php

/**
 * Quick Test Script for NinjaOne Alerts Sync
 * Run this with: php test_ninjaone_sync.php
 */

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\NinjaOneService;
use App\Models\Device;
use App\Models\NinjaOneAlert;

echo "🚀 NinjaOne Alerts Sync - Quick Test\n";
echo "===================================\n\n";

try {
    // Test 1: Check NinjaOne Service
    echo "1️⃣ Testing NinjaOne Service...\n";
    $ninjaOneService = app(NinjaOneService::class);
    echo "   ✅ NinjaOne Service loaded successfully\n\n";

    // Test 2: Check devices with NinjaOne integration
    echo "2️⃣ Checking devices with NinjaOne integration...\n";
    $devices = Device::whereNotNull('ninjaone_device_id')
                    ->where('ninjaone_device_id', '!=', '')
                    ->limit(5)
                    ->get();
    
    echo "   📱 Found {$devices->count()} devices with NinjaOne integration\n";
    foreach ($devices as $device) {
        echo "      - {$device->name} (NinjaOne ID: {$device->ninjaone_device_id})\n";
    }
    echo "\n";

    // Test 3: Try to fetch alerts from API
    if ($devices->count() > 0) {
        echo "3️⃣ Testing API connectivity with first device...\n";
        $testDevice = $devices->first();
        echo "   🔗 Testing device: {$testDevice->name}\n";
        
        try {
            $alerts = $ninjaOneService->getDeviceAlerts($testDevice->ninjaone_device_id);
            echo "   ✅ API call successful! Found " . count($alerts) . " alerts\n";
            
            if (count($alerts) > 0) {
                $firstAlert = $alerts[0];
                echo "   📄 Sample alert data:\n";
                echo "      - Title: " . ($firstAlert['title'] ?? $firstAlert['subject'] ?? 'N/A') . "\n";
                echo "      - Severity: " . ($firstAlert['severity'] ?? $firstAlert['priority'] ?? 'N/A') . "\n";
                echo "      - Status: " . ($firstAlert['status'] ?? 'N/A') . "\n";
            }
        } catch (Exception $e) {
            echo "   ❌ API call failed: " . $e->getMessage() . "\n";
        }
    } else {
        echo "3️⃣ ⚠️ No devices with NinjaOne integration found - skipping API test\n";
    }
    echo "\n";

    // Test 4: Check current alerts in database
    echo "4️⃣ Checking current alerts in database...\n";
    $alertCount = NinjaOneAlert::count();
    echo "   📊 Current alerts in database: {$alertCount}\n";
    
    if ($alertCount > 0) {
        $statusCounts = NinjaOneAlert::groupBy('status')
                                   ->selectRaw('status, count(*) as count')
                                   ->pluck('count', 'status')
                                   ->toArray();
        
        echo "   📈 Alert status distribution:\n";
        foreach ($statusCounts as $status => $count) {
            echo "      - {$status}: {$count}\n";
        }
    }
    echo "\n";

    // Test 5: Show available commands
    echo "5️⃣ Available sync commands:\n";
    echo "   📋 Test sync functionality:\n";
    echo "      php artisan ninjaone:test-alerts-sync\n\n";
    echo "   🔄 Sync all alerts:\n";
    echo "      php artisan ninjaone:sync-alerts\n\n";
    echo "   🎯 Sync specific device:\n";
    echo "      php artisan ninjaone:sync-alerts --device=DEVICE_ID\n\n";
    echo "   🧹 Cleanup old alerts:\n";
    echo "      php artisan ninjaone:sync-alerts --cleanup\n\n";

    // Summary
    echo "📊 SUMMARY:\n";
    echo "==========\n";
    echo "✅ NinjaOne Service: Working\n";
    echo "📱 Devices with integration: {$devices->count()}\n";
    echo "💾 Current alerts in DB: {$alertCount}\n";
    
    if ($devices->count() > 0) {
        echo "\n🚀 RECOMMENDED NEXT STEPS:\n";
        echo "1. Run: php artisan ninjaone:test-alerts-sync\n";
        echo "2. Run: php artisan ninjaone:sync-alerts --force\n";
        echo "3. Check your alerts page in the web interface\n";
        echo "4. Set up automatic sync with cron job\n";
    } else {
        echo "\n⚠️ WARNING:\n";
        echo "No devices with NinjaOne integration found.\n";
        echo "Make sure devices have 'ninjaone_device_id' populated.\n";
    }

} catch (Exception $e) {
    echo "❌ Error during test: " . $e->getMessage() . "\n";
    echo "Check your .env file and database connection.\n";
}

echo "\n🎉 Test completed!\n";
