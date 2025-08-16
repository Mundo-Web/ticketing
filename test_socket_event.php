<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

use App\Events\NotificationCreated;
use Illuminate\Notifications\DatabaseNotification;

echo "🔍 Testing socket event dispatch...\n";

// Crear una notificación de prueba
$notification = DatabaseNotification::create([
    'id' => \Illuminate\Support\Str::uuid(),
    'type' => 'App\Notifications\TicketNotification',
    'notifiable_type' => 'App\Models\User',
    'notifiable_id' => 1, // User ID de prueba
    'data' => [
        'type' => 'test_notification',
        'title' => 'Test Socket Notification',
        'message' => 'This is a test notification for socket testing',
        'created_at' => now()->toISOString()
    ],
    'read_at' => null,
    'created_at' => now(),
    'updated_at' => now(),
]);

echo "✅ Test notification created with ID: {$notification->id}\n";

// Disparar el evento
try {
    echo "🚀 Dispatching NotificationCreated event...\n";
    event(new NotificationCreated($notification, 1));
    echo "✅ Event dispatched successfully!\n";
} catch (Exception $e) {
    echo "❌ Error dispatching event: " . $e->getMessage() . "\n";
}

echo "🔍 Check your browser console and notification dropdown to see if the notification appears in real-time.\n";