<?php

namespace App\Events;

use App\Models\Appointment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentRescheduled // Remover ShouldBroadcast para evitar listeners automáticos
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $appointment;
    public $oldDateTime;
    public $newDateTime;

    /**
     * Create a new event instance.
     */
    public function __construct(Appointment $appointment, $oldDateTime, $newDateTime)
    {
        $this->appointment = $appointment->load(['technical', 'ticket.user']);
        $this->oldDateTime = $oldDateTime;
        $this->newDateTime = $newDateTime;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('appointments'),
        ];

        // Agregar canal del técnico si existe
        if ($this->appointment->technical) {
            $technicalUser = \App\Models\User::where('email', $this->appointment->technical->email)->first();
            if ($technicalUser) {
                $channels[] = new PrivateChannel('user.' . $technicalUser->id);
            }
        }

        // Agregar canal del cliente/miembro
        if ($this->appointment->ticket && $this->appointment->ticket->user) {
            $channels[] = new PrivateChannel('user.' . $this->appointment->ticket->user->id);
        }

        return $channels;
    }

    /**
     * Data to broadcast
     */
    public function broadcastWith(): array
    {
        return [
            'appointment' => [
                'id' => $this->appointment->id,
                'title' => $this->appointment->title,
                'address' => $this->appointment->address,
                'old_datetime' => $this->oldDateTime,
                'new_datetime' => $this->newDateTime,
                'ticket_code' => $this->appointment->ticket->code ?? 'N/A',
                'technical_name' => $this->appointment->technical->name ?? 'N/A',
                'member_name' => $this->appointment->ticket->user->name ?? 'N/A',
            ]
        ];
    }

    /**
     * Event name for broadcast
     */
    public function broadcastAs(): string
    {
        return 'appointment.rescheduled';
    }
}