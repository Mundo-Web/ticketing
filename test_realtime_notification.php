<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use App\Services\NotificationDispatcherService;
use App\Models\User;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "Testing real-time notification...\n";
    
    // Get user ID 1
    $user = User::find(1);
    if (!$user) {
        echo "User with ID 1 not found!\n";
        exit(1);
    }
    
    echo "Found user: {$user->name} (ID: {$user->id})\n";
    
    // Create notification service
    $service = new NotificationDispatcherService();
    
    // Create a direct database notification to test real-time updates
    $notification = \Illuminate\Notifications\DatabaseNotification::create([
        'id' => \Illuminate\Support\Str::uuid(),
        'type' => 'App\Notifications\TicketNotification',
        'notifiable_type' => 'App\Models\User',
        'notifiable_id' => $user->id,
        'data' => [
            'title' => 'Test Real-time Notification',
            'message' => 'This is a test to check if real-time notifications are working now. The time is ' . date('H:i:s'),
            'type' => 'test',
            'color' => 'blue',
            'ticket_code' => 'TEST-' . time(),
            'priority' => 'medium'
        ],
        'read_at' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    // Emit socket event manually
    echo "Notification created with ID: {$notification->id}\n";
    echo "Broadcasting socket event...\n";
    
    event(new \App\Events\NotificationCreated($notification, $user->id));
    
    echo "Notification sent successfully!\n";
    echo "Check your browser for the real-time notification.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}