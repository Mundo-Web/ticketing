<?php

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Kernel::class);

$kernel->bootstrap();

echo "=== VERIFICANDO DATOS TÉCNICOS EN NOTIFICACIONES ===" . PHP_EOL;

// Ver las últimas notificaciones
$notifications = \App\Models\Notification::latest()->take(5)->get();

foreach ($notifications as $notification) {
    $data = json_decode($notification->data, true);
    echo "ID: {$notification->id}" . PHP_EOL;
    echo "Type: " . ($data['type'] ?? 'null') . PHP_EOL;
    echo "Technical ID: " . ($data['technical_id'] ?? 'null') . PHP_EOL;
    echo "Technical Name: " . ($data['technical_name'] ?? 'null') . PHP_EOL;
    echo "Message: " . ($data['message'] ?? 'null') . PHP_EOL;
    echo "Created: " . $notification->created_at . PHP_EOL;
    echo "---" . PHP_EOL;
}

echo PHP_EOL . "=== CREANDO TEST DE COMENTARIO ===" . PHP_EOL;

// Buscar un ticket con técnico
$ticket = \App\Models\Ticket::whereNotNull('technical_id')
    ->with(['technical', 'user', 'device.name_device'])
    ->first();

if ($ticket) {
    echo "Test Ticket: {$ticket->code}" . PHP_EOL;
    echo "Technical: {$ticket->technical->name}" . PHP_EOL;
    
    // Usar un usuario diferente
    $testUser = \App\Models\User::where('id', '!=', $ticket->user_id)->first();
    
    if ($testUser) {
        echo "Comment by: {$testUser->name}" . PHP_EOL;
        
        $service = new \App\Services\NotificationDispatcherService();
        $service->dispatchTicketCommentAdded($ticket, 'Test comment with technical data', $testUser);
        
        echo "Test notification created!" . PHP_EOL;
    }
}