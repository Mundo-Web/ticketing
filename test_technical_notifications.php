<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\Ticket;
use App\Models\User;
use App\Services\NotificationDispatcherService;

echo "=== TESTING TECHNICAL DATA IN COMMENT NOTIFICATIONS ===" . PHP_EOL;

// Buscar un ticket con técnico asignado
$ticket = Ticket::where('status', '!=', 'closed')
    ->whereNotNull('technical_id')
    ->with(['technical', 'user', 'device.name_device'])
    ->first();

if (!$ticket) {
    echo "No hay tickets con técnico asignado disponibles para testing." . PHP_EOL;
    exit;
}

echo "Testing ticket: {$ticket->code}" . PHP_EOL;
echo "Technical: " . ($ticket->technical ? $ticket->technical->name : 'None') . PHP_EOL;
echo "User: {$ticket->user->name}" . PHP_EOL;

// Buscar un usuario diferente para hacer el comentario
$testUser = User::where('id', '!=', $ticket->user_id)->first();
if (!$testUser) {
    echo "No hay usuarios disponibles para testing." . PHP_EOL;
    exit;
}

echo "Comment by: {$testUser->name}" . PHP_EOL . PHP_EOL;

// Ejecutar el servicio
$service = new NotificationDispatcherService();
$service->dispatchTicketCommentAdded($ticket, 'Test comment with technical data', $testUser);

echo "Comment notification dispatched successfully!" . PHP_EOL;

// Ver las últimas notificaciones
echo PHP_EOL . "=== ÚLTIMAS NOTIFICACIONES CREADAS ===" . PHP_EOL;
$notifications = \App\Models\Notification::latest()->take(3)->get();
foreach ($notifications as $notification) {
    $data = json_decode($notification->data, true);
    echo "ID: {$notification->id}" . PHP_EOL;
    echo "Type: {$data['type']}" . PHP_EOL;
    echo "Message: {$data['message']}" . PHP_EOL;
    echo "Technical ID: " . ($data['technical_id'] ?? 'null') . PHP_EOL;
    echo "Technical Name: " . ($data['technical_name'] ?? 'null') . PHP_EOL;
    echo "Device Name: " . ($data['device_name'] ?? 'null') . PHP_EOL;
    echo "---" . PHP_EOL;
}