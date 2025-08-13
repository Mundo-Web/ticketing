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

class SendTicketCreatedNotificationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $ticket;

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
        Log::info('SendTicketCreatedNotificationsJob started', [
            'ticket_id' => $this->ticket->id,
            'ticket_code' => $this->ticket->code,
            'created_by' => $this->ticket->user->name ?? 'Unknown'
        ]);

        try {
            // 1. Notificar al creador del ticket (member)
            if ($this->ticket->user) {
                $this->ticket->user->notify(new TicketCreatedNotification($this->ticket));
                Log::info('Notification sent to ticket creator', [
                    'user_id' => $this->ticket->user->id,
                    'user_name' => $this->ticket->user->name
                ]);
            }

            // 2. Notificar a todos los administradores
            $admins = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['super-admin', 'admin']);
            })->get();

            foreach ($admins as $admin) {
                $admin->notify(new TicketCreatedNotification($this->ticket));
                Log::info('Notification sent to admin', [
                    'admin_id' => $admin->id,
                    'admin_name' => $admin->name
                ]);
            }

            // 3. Notificar a técnicos por defecto (que pueden asignar tickets)
            $defaultTechnicals = User::whereHas('roles', function ($query) {
                $query->where('name', 'technical');
            })->whereHas('technical', function ($query) {
                $query->where('is_default', true);
            })->get();

            foreach ($defaultTechnicals as $technical) {
                // Buscar el usuario correspondiente al técnico
                $user = User::where('email', $technical->email)->first();
                if ($user) {
                    $user->notify(new TicketCreatedNotification($this->ticket));
                    Log::info('Notification sent to default technical', [
                        'technical_id' => $technical->id,
                        'technical_name' => $technical->name,
                        'user_id' => $user->id
                    ]);
                }
            }

            Log::info('SendTicketCreatedNotificationsJob completed successfully', [
                'ticket_id' => $this->ticket->id,
                'admins_notified' => $admins->count(),
                'technicals_notified' => $defaultTechnicals->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Error in SendTicketCreatedNotificationsJob', [
                'ticket_id' => $this->ticket->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
