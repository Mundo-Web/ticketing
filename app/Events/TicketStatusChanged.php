<?php

namespace App\Events;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ticket;
    public $oldStatus;
    public $newStatus;
    public $changedBy;

    /**
     * Create a new event instance.
     */
    public function __construct(Ticket $ticket, string $oldStatus, string $newStatus, User $changedBy)
    {
        $this->ticket = $ticket->load(['user', 'technical']);
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->changedBy = $changedBy;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('tickets'),
            new PrivateChannel('ticket.' . $this->ticket->id),
            new PrivateChannel('user.' . $this->ticket->user_id),
        ];

        // Si hay técnico asignado, también notificar
        if ($this->ticket->technical_id) {
            $channels[] = new PrivateChannel('user.' . $this->ticket->technical_id);
        }

        return $channels;
    }

    /**
     * Data to broadcast
     */
    public function broadcastWith(): array
    {
        return [
            'ticket' => [
                'id' => $this->ticket->id,
                'code' => $this->ticket->code,
                'title' => $this->ticket->title,
                'old_status' => $this->oldStatus,
                'new_status' => $this->newStatus,
                'changed_by' => $this->changedBy->name,
            ]
        ];
    }

    /**
     * Event name for broadcast
     */
    public function broadcastAs(): string
    {
        return 'ticket.status.changed';
    }
}
