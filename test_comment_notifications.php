<?php

require_once __DIR__ . '/bootstrap/app.php';

use App\Models\Ticket;
use App\Models\User;
use App\Services\NotificationDispatcherService;

// Buscar un ticket que tenga técnico asignado
$ticket = Ticket::with(['technical', 'user', 'device.name_device'])
    ->whereNotNull('technical_id')
    ->whereNotNull('user_id')
    ->first();

if (!$ticket) {
    echo "❌ No se encontró un ticket con técnico asignado para probar\n";
    exit(1);
}

echo "🎫 Testing comment notification with ticket: {$ticket->code}\n";
echo "👤 Ticket owner: {$ticket->user->name} (ID: {$ticket->user->id})\n";
echo "👨‍🔧 Technical assigned: {$ticket->technical->name} (ID: {$ticket->technical->id})\n";

// Buscar un usuario que NO sea ni el owner ni el técnico para simular comentario
$commentBy = User::whereNotIn('id', [$ticket->user->id])
    ->whereNotIn('email', [$ticket->technical->email])
    ->first();

if (!$commentBy) {
    echo "❌ No se encontró un usuario diferente para simular comentario\n";
    exit(1);
}

echo "💬 Comment by: {$commentBy->name} (ID: {$commentBy->id})\n\n";

// Probar el dispatch de notificación
try {
    $notificationService = new NotificationDispatcherService();
    $testComment = "This is a test comment to verify notifications work correctly";
    
    echo "📤 Dispatching comment notification...\n";
    $notificationService->dispatchTicketCommentAdded($ticket, $testComment, $commentBy);
    
    echo "✅ Comment notification dispatched successfully!\n";
    echo "📧 Check the logs for detailed information about the notification process.\n";
    
} catch (\Exception $e) {
    echo "❌ Error dispatching notification: {$e->getMessage()}\n";
    echo "📍 File: {$e->getFile()}:{$e->getLine()}\n";
}