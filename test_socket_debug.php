<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Events\NotificationCreated;
use App\Models\DatabaseNotification;
use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Support\Facades\Event;

// Simular una notificación para el usuario 183
$notification = new \stdClass();
$notification->id = 'test-' . uniqid();
$notification->type = 'App\\Notifications\\TicketStatusChanged';
$notification->notifiable_type = 'App\\Models\\User';
$notification->notifiable_id = 183;
$notification->data = json_encode([
    'ticket_id' => 999,
    'title' => 'Ticket Test #999',
    'status' => 'resolved',
    'message' => 'Test socket notification - Debug enhanced'
]);
$notification->read_at = null;
$notification->created_at = now();
$notification->updated_at = now();

echo "🚀 Emitiendo evento NotificationCreated para usuario 183...\n";
echo "📋 Data: " . $notification->data . "\n";

// Método 1: Laravel Broadcasting
try {
    $event = new NotificationCreated($notification, 183);
    event($event);
    echo "✅ Laravel Broadcasting: Evento emitido exitosamente\n";
} catch (Exception $e) {
    echo "❌ Laravel Broadcasting Error: " . $e->getMessage() . "\n";
}

// Método 2: Pusher Directo
try {
    $pusher = new \Pusher\Pusher(
        env('PUSHER_APP_KEY'),
        env('PUSHER_APP_SECRET'),
        env('PUSHER_APP_ID'),
        [
            'cluster' => env('PUSHER_APP_CLUSTER'),
            'useTLS' => true,
        ]
    );

    $channel = 'notifications-public.183';
    $eventName = 'notification.created';
    $data = [
        'notification' => [
            'id' => $notification->id,
            'type' => $notification->type,
            'data' => json_decode($notification->data, true),
            'read_at' => $notification->read_at,
            'created_at' => $notification->created_at->toISOString(),
        ]
    ];

    $pusher->trigger($channel, $eventName, $data);
    echo "✅ Pusher Directo: Evento emitido a canal '$channel' con evento '$eventName'\n";
    echo "📡 Data enviada: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";

    // También probar otros nombres de eventos
    $pusher->trigger($channel, 'NotificationCreated', $data);
    echo "✅ Pusher Directo: También emitido como 'NotificationCreated'\n";

    $pusher->trigger($channel, '.notification.created', $data);
    echo "✅ Pusher Directo: También emitido como '.notification.created'\n";

} catch (Exception $e) {
    echo "❌ Pusher Directo Error: " . $e->getMessage() . "\n";
}

echo "\n🔍 Revisa la consola del navegador para ver si alguno de los listeners captura estos eventos\n";
echo "📍 Canal esperado: notifications-public.183\n";
echo "🎯 Eventos a buscar: notification.created, NotificationCreated, .notification.created\n";