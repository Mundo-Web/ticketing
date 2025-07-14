<?php

namespace App\Jobs;

use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketStatusChangedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTicketStatusChangedEmailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $ticket;
    public $oldStatus;
    public $newStatus;
    public $changedBy;

    /**
     * Create a new job instance.
     */
    public function __construct(Ticket $ticket, string $oldStatus, string $newStatus, User $changedBy = null)
    {
        $this->ticket = $ticket;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->changedBy = $changedBy;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Cargar relaciones necesarias
            $this->ticket->load(['user', 'assignedTo', 'device', 'building']);

            $recipients = collect();

            // 1. Notificar al usuario que creó el ticket
            if ($this->ticket->user && $this->ticket->user->email_notifications) {
                $recipients->push($this->ticket->user);
            }

            // 2. Notificar al técnico asignado
            if ($this->ticket->assignedTo && $this->ticket->assignedTo->email_notifications) {
                $recipients->push($this->ticket->assignedTo);
            }

            // 3. Notificar a admins
            $admins = User::role('super-admin')
                ->where('email_notifications', true)
                ->get();
            $recipients = $recipients->merge($admins);

            // 4. Si el ticket se completa, notificar también a owners del edificio
            if ($this->newStatus === 'completed' && $this->ticket->building) {
                $owners = User::role('owner')
                    ->whereHas('owner', function ($query) {
                        $query->where('building_id', $this->ticket->building->id);
                    })
                    ->where('email_notifications', true)
                    ->get();
                $recipients = $recipients->merge($owners);
            }

            // Eliminar duplicados
            $recipients = $recipients->unique('email');

            // Enviar notificaciones
            foreach ($recipients as $user) {
                try {
                    $user->notify(new TicketStatusChangedNotification(
                        $this->ticket, 
                        $this->oldStatus, 
                        $this->newStatus,
                        $this->changedBy
                    ));
                } catch (\Exception $e) {
                    Log::error("Error sending status change notification to user {$user->id}: " . $e->getMessage());
                }
            }

            Log::info('Ticket status change emails sent successfully', [
                'ticket_id' => $this->ticket->id,
                'old_status' => $this->oldStatus,
                'new_status' => $this->newStatus,
                'recipients_count' => $recipients->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Error in SendTicketStatusChangedEmailsJob: ' . $e->getMessage(), [
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
