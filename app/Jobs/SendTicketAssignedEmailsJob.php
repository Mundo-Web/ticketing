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
            $this->ticket->load(['user', 'device']);

            $recipients = collect();

            // 1. Notificar al técnico asignado - buscar el User correspondiente
            if ($this->assignee) {
                // Buscar el usuario que corresponde al técnico por email
                $technicalUser = User::where('email', $this->assignee->email)->first();
                if ($technicalUser && ($technicalUser->email_notifications ?? true)) {
                    $recipients->push($technicalUser);
                    Log::info('Adding technical user to recipients', [
                        'technical_id' => $this->assignee->id,
                        'user_id' => $technicalUser->id,
                        'email' => $technicalUser->email
                    ]);
                }
            }

            // 2. Notificar al usuario que creó el ticket
            if ($this->ticket->user && ($this->ticket->user->email_notifications ?? true)) {
                $recipients->push($this->ticket->user);
                Log::info('Adding ticket creator to recipients', [
                    'user_id' => $this->ticket->user->id,
                    'email' => $this->ticket->user->email
                ]);
            }

            // 3. Notificar a admins
            $admins = User::role('super-admin')
                ->where('email_notifications', true)
                ->where('id', '!=', $this->assigner->id) // No notificar al que asignó
                ->get();
            $recipients = $recipients->merge($admins);

            // Eliminar duplicados
            $recipients = $recipients->unique('email');

            Log::info('Final recipients for ticket assignment', [
                'ticket_id' => $this->ticket->id,
                'assignee_id' => $this->assignee->id,
                'recipients_count' => $recipients->count(),
                'recipients' => $recipients->map(function($r) {
                    return ['id' => $r->id, 'email' => $r->email];
                })->toArray()
            ]);

            // Enviar notificaciones
            foreach ($recipients as $user) {
                try {
                    $user->notify(new TicketAssignedNotification(
                        $this->ticket, 
                        $this->assignee, 
                        $this->assigner
                    ));
                    Log::info("Notification sent to user", [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'ticket_id' => $this->ticket->id
                    ]);
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
