<?php

namespace App\Jobs;

use App\Models\TicketComment;
use App\Models\User;
use App\Notifications\TicketCommentNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTicketCommentEmailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $comment;

    /**
     * Create a new job instance.
     */
    public function __construct(TicketComment $comment)
    {
        $this->comment = $comment;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Cargar relaciones necesarias
            $this->comment->load(['ticket', 'user']);
            $ticket = $this->comment->ticket;
            $ticket->load(['user', 'assignedTo', 'device', 'building']);

            $recipients = collect();

            // 1. Notificar al usuario que creó el ticket (si no es el que comentó)
            if ($ticket->user && $ticket->user->id !== $this->comment->user_id && $ticket->user->email_notifications) {
                $recipients->push($ticket->user);
            }

            // 2. Notificar al técnico asignado (si no es el que comentó)
            if ($ticket->assignedTo && $ticket->assignedTo->id !== $this->comment->user_id && $ticket->assignedTo->email_notifications) {
                $recipients->push($ticket->assignedTo);
            }

            // 3. Notificar a admins (si no son los que comentaron)
            $admins = User::role('super-admin')
                ->where('email_notifications', true)
                ->where('id', '!=', $this->comment->user_id)
                ->get();
            $recipients = $recipients->merge($admins);

            // 4. Notificar a otros usuarios que han comentado en este ticket (conversación)
            $otherCommenters = User::whereHas('ticketComments', function ($query) use ($ticket) {
                $query->where('ticket_id', $ticket->id);
            })
            ->where('email_notifications', true)
            ->where('id', '!=', $this->comment->user_id)
            ->get();
            $recipients = $recipients->merge($otherCommenters);

            // Eliminar duplicados
            $recipients = $recipients->unique('email');

            // Enviar notificaciones
            foreach ($recipients as $user) {
                try {
                    $user->notify(new TicketCommentNotification($this->comment));
                } catch (\Exception $e) {
                    Log::error("Error sending comment notification to user {$user->id}: " . $e->getMessage());
                }
            }

            Log::info('Ticket comment emails sent successfully', [
                'comment_id' => $this->comment->id,
                'ticket_id' => $ticket->id,
                'recipients_count' => $recipients->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Error in SendTicketCommentEmailsJob: ' . $e->getMessage(), [
                'comment_id' => $this->comment->id,
                'error' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Dispatch the job to run after the HTTP response is sent
     */
    public static function dispatchAfterResponse(...$arguments)
    {
        return self::dispatch(...$arguments)->afterResponse();
    }
}
