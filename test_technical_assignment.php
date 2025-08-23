<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Ticket;
use App\Models\User;
use App\Models\Technical;
use App\Notifications\TicketAssignedNotification;
use App\Events\NotificationCreated;

echo "🚀 Testing technical assignment notifications...\n";

// Simular asignación de técnico para probar notificaciones
$ticketData = [
    'id' => 999,
    'code' => 'TCK-00999',
    'title' => 'Test Technical Assignment Notification',
    'status' => 'in_progress',
    'user_id' => 183, // Usuario que creó el ticket
];

$technicalData = [
    'id' => 1,
    'name' => 'Test Technical',
    'email' => 'technical@example.com'
];

$assignerData = [
    'id' => 1,
    'name' => 'Admin User',
    'email' => 'admin@example.com'
];

try {
    echo "✅ Simulating ticket assignment...\n";
    echo "📋 Ticket: {$ticketData['code']} - {$ticketData['title']}\n";
    echo "👤 Technical: {$technicalData['name']} ({$technicalData['email']})\n";
    echo "🔧 Assigned by: {$assignerData['name']}\n\n";

    // Simular notificación al técnico asignado (user ID 183)
    echo "📡 Sending notification to assigned technical...\n";
    
    $techNotification = new \stdClass();
    $techNotification->id = 'test-assign-tech-' . uniqid();
    $techNotification->type = 'App\\Notifications\\TicketAssignedNotification';
    $techNotification->notifiable_type = 'App\\Models\\User';
    $techNotification->notifiable_id = 183; // Technical user ID
    $techNotification->data = json_encode([
        'type' => 'ticket_assigned',
        'ticket_id' => $ticketData['id'],
        'ticket_code' => $ticketData['code'],
        'title' => '🎯 Te han asignado un ticket',
        'message' => '🎯 Ticket ' . $ticketData['code'] . ' asignado: ' . $ticketData['title'],
        'action_url' => '/tickets/' . $ticketData['id'],
        'icon' => 'clipboard-check',
        'color' => 'blue',
        'priority' => 'medium',
        'assigned_by' => $assignerData['name'],
        'technical_name' => $technicalData['name'],
        'device_name' => 'Test Device',
        'building_name' => 'Test Building',
        'created_at' => now()->toISOString(),
    ]);
    $techNotification->read_at = null;
    $techNotification->created_at = now();
    $techNotification->updated_at = now();

    echo "📋 Technical notification data: " . $techNotification->data . "\n";

    // Método 1: Laravel Broadcasting via NotificationCreated event
    try {
        $event = new NotificationCreated($techNotification, 183);
        event($event);
        echo "✅ Laravel Broadcasting: Technical notification event emitted\n";
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
                'id' => $techNotification->id,
                'type' => $techNotification->type,
                'data' => json_decode($techNotification->data, true),
                'read_at' => $techNotification->read_at,
                'created_at' => $techNotification->created_at->toISOString(),
            ],
            'user_id' => 183,
            'timestamp' => now()->toISOString()
        ];

        $pusher->trigger($channel, $eventName, $data);
        echo "✅ Pusher Directo: Technical notification sent to '$channel'\n";

    } catch (Exception $e) {
        echo "❌ Pusher Directo Error: " . $e->getMessage() . "\n";
    }

    // También simular notificación al usuario que creó el ticket
    echo "\n📡 Sending notification to ticket owner...\n";
    
    $ownerNotification = new \stdClass();
    $ownerNotification->id = 'test-assign-owner-' . uniqid();
    $ownerNotification->type = 'App\\Notifications\\TicketAssignedNotification';
    $ownerNotification->notifiable_type = 'App\\Models\\User';
    $ownerNotification->notifiable_id = 183; // Also testing with same user for demo
    $ownerNotification->data = json_encode([
        'type' => 'ticket_assigned',
        'ticket_id' => $ticketData['id'],
        'ticket_code' => $ticketData['code'],
        'title' => '👤 Technician assigned to your ticket',
        'message' => '👤 Your ticket ' . $ticketData['code'] . ' has been assigned to the technician ' . $technicalData['name'],
        'action_url' => '/tickets/' . $ticketData['id'],
        'icon' => 'user-check',
        'color' => 'green',
        'priority' => 'medium',
        'assigned_by' => $assignerData['name'],
        'technical_name' => $technicalData['name'],
        'device_name' => 'Test Device',
        'building_name' => 'Test Building',
        'created_at' => now()->toISOString(),
    ]);
    $ownerNotification->read_at = null;
    $ownerNotification->created_at = now();
    $ownerNotification->updated_at = now();

    try {
        $event = new NotificationCreated($ownerNotification, 183);
        event($event);
        echo "✅ Laravel Broadcasting: Owner notification event emitted\n";
    } catch (Exception $e) {
        echo "❌ Laravel Broadcasting Error: " . $e->getMessage() . "\n";
    }

    try {
        $data['notification']['id'] = $ownerNotification->id;
        $data['notification']['data'] = json_decode($ownerNotification->data, true);
        
        $pusher->trigger($channel, $eventName, $data);
        echo "✅ Pusher Directo: Owner notification sent to '$channel'\n";
        echo "📡 Data sent: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    } catch (Exception $e) {
        echo "❌ Pusher Directo Error: " . $e->getMessage() . "\n";
    }

} catch (Exception $e) {
    echo "❌ Error testing technical assignment: " . $e->getMessage() . "\n";
}

echo "\n🔍 Check the browser console for real-time notifications!\n";
echo "🎯 Expected events on channel: notifications-public.183\n";
echo "📱 Look for: '🎯 Ticket assigned to your ticket' and '👤 Technician assigned to your ticket'\n";
