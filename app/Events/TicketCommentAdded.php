<?php

namespace App\Events;

use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketCommentAdded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ticket;
    public $comment;

    /**
     * Create a new event instance.
     */
    public function __construct(Ticket $ticket, TicketComment $comment)
    {
        $this->ticket = $ticket->load(['user', 'technical']);
        $this->comment = $comment->load('user');
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
            ],
            'comment' => [
                'id' => $this->comment->id,
                'comment' => $this->comment->comment,
                'user' => $this->comment->user->name,
                'is_internal' => $this->comment->is_internal,
                'created_at' => $this->comment->created_at,
            ]
        ];
    }

    /**
     * Event name for broadcast
     */
    public function broadcastAs(): string
    {
        return 'ticket.comment.added';
    }
}
