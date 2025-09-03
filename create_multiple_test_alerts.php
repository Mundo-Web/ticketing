<?php

/**
 * Create Multiple Test Alerts Script
 */

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Device;
use App\Models\NinjaOneAlert;

echo "🧪 Creating multiple test alerts for testing...\n";

try {
    // Get devices with NinjaOne integration
    $devices = Device::whereNotNull('ninjaone_device_id')->get();
    
    if ($devices->count() === 0) {
        echo "❌ No devices with NinjaOne integration found\n";
        exit(1);
    }
    
    echo "📱 Found {$devices->count()} devices with NinjaOne integration\n";
    
    $alerts = [
        [
            'title' => 'Disk Space Critical',
            'description' => 'Disk space is running low on C:\ drive. Only 2GB remaining.',
            'severity' => 'critical',
            'alert_type' => 'disk',
        ],
        [
            'title' => 'High CPU Usage',
            'description' => 'CPU usage has been above 90% for the last 15 minutes.',
            'severity' => 'warning',
            'alert_type' => 'performance',
        ],
        [
            'title' => 'Service Down',
            'description' => 'Windows Update service is not running.',
            'severity' => 'warning',
            'alert_type' => 'service',
        ],
        [
            'title' => 'Security Update Available',
            'description' => 'Important security updates are available for installation.',
            'severity' => 'info',
            'alert_type' => 'update',
        ],
        [
            'title' => 'Network Connectivity Issue',
            'description' => 'Intermittent network connectivity issues detected.',
            'severity' => 'warning',
            'alert_type' => 'network',
        ]
    ];
    
    $createdAlerts = 0;
    
    foreach ($devices as $device) {
        // Create 2-3 random alerts per device
        $numAlerts = rand(2, 3);
        $deviceAlerts = array_slice($alerts, 0, $numAlerts);
        
        echo "\n📱 Creating alerts for device: {$device->name}\n";
        
        foreach ($deviceAlerts as $alertData) {
            $alert = new NinjaOneAlert();
            $alert->device_id = $device->id;
            $alert->ninjaone_alert_id = 'test-alert-' . time() . '-' . rand(1000, 9999);
            $alert->title = $alertData['title'];
            $alert->description = $alertData['description'];
            $alert->alert_type = $alertData['alert_type'];
            $alert->severity = $alertData['severity'];
            $alert->status = 'open';
            $alert->save();
            
            echo "   ✅ {$alertData['title']} ({$alertData['severity']})\n";
            $createdAlerts++;
            
            // Small delay to avoid duplicate timestamps
            usleep(100000); // 0.1 seconds
        }
    }
    
    echo "\n📊 Summary:\n";
    echo "   - Created {$createdAlerts} test alerts\n";
    echo "   - Total alerts in database: " . NinjaOneAlert::count() . "\n";
    
    // Show alerts by severity
    $severityCounts = NinjaOneAlert::groupBy('severity')
                                  ->selectRaw('severity, count(*) as count')
                                  ->pluck('count', 'severity')
                                  ->toArray();
    
    echo "\n📈 Alerts by severity:\n";
    foreach ($severityCounts as $severity => $count) {
        $emoji = match($severity) {
            'critical' => '🔴',
            'warning' => '🟡',
            'info' => '🔵',
            default => '⚪'
        };
        echo "   {$emoji} {$severity}: {$count}\n";
    }
    
    echo "\n🌐 Verifica las alertas en tu aplicación:\n";
    echo "   URL: http://localhost/projects/ticketing/public/alerts\n";
    echo "   (o la URL que uses para acceder a tu aplicación)\n";
    
} catch (Exception $e) {
    echo "❌ Error creating test alerts: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n🎉 Test completado! Ahora deberías ver múltiples alertas en tu dashboard.\n";