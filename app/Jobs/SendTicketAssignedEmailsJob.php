<?php

namespace App\Jobs;

use App\Models\Ticket;
use App\Models\User;
use App\Models\Technical;
use App\Notifications\TicketAssignedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTicketAssignedEmailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $ticket;
    public $assignee;
    public $assigner;

    /**
     * Create a new job instance.
     */
    public function __construct(Ticket $ticket, Technical $assignee, User $assigner)
    {
        $this->ticket = $ticket;
        $this->assignee = $assignee;
        $this->assigner = $assigner;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Cargar relaciones necesarias
            $this->ticket->load(['user', 'device', 'building']);

            $recipients = collect();

            // 1. Notificar al técnico asignado
            if ($this->assignee && $this->assignee->email_notifications) {
                $recipients->push($this->assignee);
            }

            // 2. Notificar al usuario que creó el ticket
            if ($this->ticket->user && $this->ticket->user->email_notifications) {
                $recipients->push($this->ticket->user);
            }

            // 3. Notificar a admins
            $admins = User::role('super-admin')
                ->where('email_notifications', true)
                ->where('id', '!=', $this->assigner->id) // No notificar al que asignó
                ->get();
            $recipients = $recipients->merge($admins);

            // Eliminar duplicados
            $recipients = $recipients->unique('email');

            // Enviar notificaciones
            foreach ($recipients as $user) {
                try {
                    $user->notify(new TicketAssignedNotification(
                        $this->ticket, 
                        $this->assignee, 
                        $this->assigner
                    ));
                } catch (\Exception $e) {
                    Log::error("Error sending assignment notification to user {$user->id}: " . $e->getMessage());
                }
            }

            Log::info('Ticket assignment emails sent successfully', [
                'ticket_id' => $this->ticket->id,
                'assignee_id' => $this->assignee->id,
                'recipients_count' => $recipients->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Error in SendTicketAssignedEmailsJob: ' . $e->getMessage(), [
                'ticket_id' => $this->ticket->id,
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
