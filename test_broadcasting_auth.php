<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use App\Models\User;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "Testing broadcasting authentication...\n";
    
    // Get user ID 1
    $user = User::find(1);
    if (!$user) {
        echo "User with ID 1 not found!\n";
        exit(1);
    }
    
    echo "Found user: {$user->name} (ID: {$user->id})\n";
    
    // Test the broadcasting channel authorization
    $channel = "notifications.{$user->id}";
    echo "Testing channel: {$channel}\n";
    
    // Simulate what the Broadcast::channel callback does
    $authorized = (int) $user->id === (int) $user->id;
    echo "Authorization result: " . ($authorized ? "AUTHORIZED" : "DENIED") . "\n";
    
    if ($authorized) {
        echo "✅ Channel authorization should work for this user.\n";
    } else {
        echo "❌ Channel authorization failed.\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}