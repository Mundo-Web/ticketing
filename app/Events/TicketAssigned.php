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

class TicketAssigned implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ticket;
    public $technical;
    public $assignedBy;

    /**
     * Create a new event instance.
     */
    public function __construct(Ticket $ticket, User $technical, User $assignedBy)
    {
        $this->ticket = $ticket->load(['user', 'device', 'device.nameDevice']);
        $this->technical = $technical;
        $this->assignedBy = $assignedBy;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('tickets'),
            new PrivateChannel('user.' . $this->ticket->user_id),
            new PrivateChannel('user.' . $this->technical->id),
        ];
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
                'status' => $this->ticket->status,
                'technical' => $this->technical->name,
                'assigned_by' => $this->assignedBy->name,
            ]
        ];
    }

    /**
     * Event name for broadcast
     */
    public function broadcastAs(): string
    {
        return 'ticket.assigned';
    }
}
