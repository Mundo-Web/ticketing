<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Ticket;
use App\Models\User;
use App\Services\NotificationDispatcherService;

class TestCommentNotificationsCommand extends Command
{
    protected $signature = 'test:comment-notifications';
    protected $description = 'Test comment notifications system';

    public function handle()
    {
        $this->info('🧪 Testing Comment Notifications System');
        
        // Buscar un ticket que tenga técnico asignado
        $ticket = Ticket::with(['technical', 'user', 'device.name_device'])
            ->whereNotNull('technical_id')
            ->whereNotNull('user_id')
            ->first();

        if (!$ticket) {
            $this->error('❌ No se encontró un ticket con técnico asignado para probar');
            return 1;
        }

        $this->info("🎫 Testing with ticket: {$ticket->code}");
        $this->info("👤 Ticket owner: {$ticket->user->name} (ID: {$ticket->user->id})");
        $this->info("👨‍🔧 Technical assigned: {$ticket->technical->name} (ID: {$ticket->technical->id})");

        // Buscar un usuario que NO sea ni el owner ni el técnico para simular comentario
        $commentBy = User::whereNotIn('id', [$ticket->user->id])
            ->whereNotIn('email', [$ticket->technical->email])
            ->first();

        if (!$commentBy) {
            $this->error('❌ No se encontró un usuario diferente para simular comentario');
            return 1;
        }

        $this->info("💬 Comment by: {$commentBy->name} (ID: {$commentBy->id})");
        $this->newLine();

        // Probar el dispatch de notificación
        try {
            $notificationService = new NotificationDispatcherService();
            $testComment = "This is a test comment to verify notifications work correctly at " . now();
            
            $this->info('📤 Dispatching comment notification...');
            $notificationService->dispatchTicketCommentAdded($ticket, $testComment, $commentBy);
            
            $this->info('✅ Comment notification dispatched successfully!');
            $this->info('📧 Check the logs for detailed information about the notification process.');
            
            return 0;
            
        } catch (\Exception $e) {
            $this->error("❌ Error dispatching notification: {$e->getMessage()}");
            $this->error("📍 File: {$e->getFile()}:{$e->getLine()}");
            return 1;
        }
    }
}