<?php

namespace App\Jobs;

use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketCreatedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class SendTicketCreatedEmailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $ticket;

    /**
     * Create a new job instance.
     */
    public function __construct(Ticket $ticket)
    {
        $this->ticket = $ticket;
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

            // 1. Notificar al usuario que creó el ticket (si no es el mismo que lo solicitó)
            if ($this->ticket->user) {
                $recipients->push($this->ticket->user);
            }

            // 2. Notificar a todos los admins
            $admins = User::role('super-admin')
                ->where('email_notifications', true)
                ->get();
            $recipients = $recipients->merge($admins);

            // 3. Notificar a técnicos si hay categoría específica
            $technicals = User::role('technical')
                ->where('email_notifications', true)
                ->get();
            $recipients = $recipients->merge($technicals);

            // 4. Notificar al owner del edificio (si existe)
            if ($this->ticket->building) {
                $owners = User::role('owner')
                    ->whereHas('owner', function ($query) {
                        $query->where('building_id', $this->ticket->building->id);
                    })
                    ->where('email_notifications', true)
                    ->get();
                $recipients = $recipients->merge($owners);
            }

            // Eliminar duplicados por email
            $recipients = $recipients->unique('email');

            // Enviar notificaciones
            foreach ($recipients as $user) {
                try {
                    $user->notify(new TicketCreatedNotification($this->ticket));
                } catch (\Exception $e) {
                    Log::error("Error sending notification to user {$user->id}: " . $e->getMessage());
                }
            }

            Log::info('Ticket created emails sent successfully', [
                'ticket_id' => $this->ticket->id,
                'recipients_count' => $recipients->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Error in SendTicketCreatedEmailsJob: ' . $e->getMessage(), [
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
