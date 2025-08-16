<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Ticket;
use App\Models\User;
use App\Models\Device;
use App\Notifications\TicketCreatedNotification;
use App\Events\NotificationCreated;

echo "🚀 Testing ticket creation notifications...\n";

// Simular creación de ticket para probar notificaciones
$ticketData = [
    'device_id' => 1, // Asegúrate de que exista este device
    'category' => 'Test Category',
    'title' => 'Test Ticket Creation Notification',
    'description' => 'Testing real-time notifications for ticket creation',
    'status' => 'open',
    'user_id' => 183, // Usuario que crea el ticket
    'technical_id' => null,
    'attachments' => [],
];

try {
    // Crear el ticket
    $ticket = new \stdClass();
    $ticket->id = 999;
    $ticket->code = 'TCK-' . str_pad(999, 5, '0', STR_PAD_LEFT);
    $ticket->title = $ticketData['title'];
    $ticket->category = $ticketData['category'];
    $ticket->description = $ticketData['description'];
    $ticket->status = $ticketData['status'];
    $ticket->user_id = $ticketData['user_id'];
    $ticket->created_at = now();

    echo "✅ Simulated ticket created: {$ticket->code}\n";

    // 1. Notificar a todos los super-admins
    echo "📡 Sending notifications to super-admins...\n";
    
    // Simular notificación a admin (user ID 1)
    $notification = new \stdClass();
    $notification->id = 'test-ticket-' . uniqid();
    $notification->type = 'App\\Notifications\\TicketCreatedNotification';
    $notification->notifiable_type = 'App\\Models\\User';
    $notification->notifiable_id = 1; // Admin user ID
    $notification->data = json_encode([
        'type' => 'ticket_created',
        'ticket_id' => $ticket->id,
        'ticket_code' => $ticket->code,
        'title' => 'Nuevo ticket creado',
        'message' => 'Se ha creado el ticket ' . $ticket->code . ': ' . $ticket->title,
        'action_url' => '/tickets/' . $ticket->id,
        'icon' => 'ticket',
        'color' => 'blue',
        'created_at' => now()->toISOString(),
    ]);
    $notification->read_at = null;
    $notification->created_at = now();
    $notification->updated_at = now();

    echo "📋 Notification data: " . $notification->data . "\n";

    // Método 1: Laravel Broadcasting via NotificationCreated event
    try {
        $event = new NotificationCreated($notification, 1); // Admin user ID
        event($event);
        echo "✅ Laravel Broadcasting: Notification event emitted for admin\n";
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

        $channel = 'notifications-public.1'; // Admin user ID
        $eventName = 'notification.created';
        $data = [
            'notification' => [
                'id' => $notification->id,
                'type' => $notification->type,
                'data' => json_decode($notification->data, true),
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at->toISOString(),
            ],
            'user_id' => 1,
            'timestamp' => now()->toISOString()
        ];

        $pusher->trigger($channel, $eventName, $data);
        echo "✅ Pusher Directo: Notification sent to admin channel '$channel'\n";
        echo "📡 Data sent: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";

    } catch (Exception $e) {
        echo "❌ Pusher Directo Error: " . $e->getMessage() . "\n";
    }

    // También notificar a técnicos default (user ID 183)
    echo "\n📡 Sending notifications to default technicals...\n";
    
    $techNotification = new \stdClass();
    $techNotification->id = 'test-ticket-tech-' . uniqid();
    $techNotification->type = 'App\\Notifications\\TicketCreatedNotification';
    $techNotification->notifiable_type = 'App\\Models\\User';
    $techNotification->notifiable_id = 183; // Technical user ID
    $techNotification->data = $notification->data; // Same data
    $techNotification->read_at = null;
    $techNotification->created_at = now();
    $techNotification->updated_at = now();

    try {
        $event = new NotificationCreated($techNotification, 183);
        event($event);
        echo "✅ Laravel Broadcasting: Notification event emitted for technical\n";
    } catch (Exception $e) {
        echo "❌ Laravel Broadcasting Error: " . $e->getMessage() . "\n";
    }

    try {
        $channel = 'notifications-public.183';
        $data['user_id'] = 183;
        $data['notification']['id'] = $techNotification->id;
        
        $pusher->trigger($channel, $eventName, $data);
        echo "✅ Pusher Directo: Notification sent to technical channel '$channel'\n";
    } catch (Exception $e) {
        echo "❌ Pusher Directo Error: " . $e->getMessage() . "\n";
    }

} catch (Exception $e) {
    echo "❌ Error creating test ticket: " . $e->getMessage() . "\n";
}

echo "\n🔍 Check the browser console for real-time notifications!\n";
echo "🎯 Expected events on channels: notifications-public.1, notifications-public.183\n";
echo "📱 Look for: 'Se ha creado el ticket TCK-00999: Test Ticket Creation Notification'\n";