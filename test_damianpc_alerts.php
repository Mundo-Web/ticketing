<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
require_once 'bootstrap/app.php';

use App\Services\NinjaOneService;

echo "Testing DAMIANPC device alerts...\n";

try {
    $ninjaOneService = new NinjaOneService();
    
    // Test 1: Search by device name DAMIANPC
    echo "\n1. Searching for DAMIANPC alerts...\n";
    $alerts = $ninjaOneService->getDeviceAlertsByName('DAMIANPC');
    echo "Found " . count($alerts) . " alerts for DAMIANPC\n";
    
    if (count($alerts) > 0) {
        echo "\nFirst alert details:\n";
        $firstAlert = $alerts[0];
        
        // Check different possible name fields
        $possibleNameFields = ['deviceName', 'systemName', 'name', 'device_name', 'system_name'];
        foreach ($possibleNameFields as $field) {
            if (isset($firstAlert[$field])) {
                echo "  $field: " . $firstAlert[$field] . "\n";
            }
        }
        
        // Show alert structure
        echo "\nAlert structure keys:\n";
        foreach (array_keys($firstAlert) as $key) {
            echo "  - $key\n";
        }
        
        // Show first few alerts
        echo "\nFirst 3 alerts:\n";
        for ($i = 0; $i < min(3, count($alerts)); $i++) {
            $alert = $alerts[$i];
            echo "Alert $i:\n";
            echo "  Type: " . ($alert['type'] ?? 'N/A') . "\n";
            echo "  Status: " . ($alert['status'] ?? 'N/A') . "\n";
            echo "  Device: " . ($alert['deviceName'] ?? $alert['systemName'] ?? 'N/A') . "\n";
            echo "  Message: " . ($alert['message'] ?? 'N/A') . "\n";
            echo "---\n";
        }
    }
    
    // Test 2: Get all alerts to see the structure
    echo "\n2. Getting all alerts to check structure...\n";
    $allAlerts = $ninjaOneService->getAlerts(['pageSize' => 5]);
    echo "Found " . count($allAlerts) . " total alerts\n";
    
    if (count($allAlerts) > 0) {
        echo "\nSample alert structure:\n";
        $sampleAlert = $allAlerts[0];
        
        // Check what name fields exist
        echo "Name fields in alerts:\n";
        foreach ($possibleNameFields as $field) {
            if (isset($sampleAlert[$field])) {
                echo "  ✓ $field: " . $sampleAlert[$field] . "\n";
            } else {
                echo "  ✗ $field: not found\n";
            }
        }
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nTest completed!\n";

?>
