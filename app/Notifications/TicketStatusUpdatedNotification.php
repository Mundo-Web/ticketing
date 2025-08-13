<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class TicketStatusUpdatedNotification extends Notification
{
    use Queueable;

    private $ticket;
    private $oldStatus;
    private $newStatus;
    private $updatedBy;

    /**
     * Create a new notification instance.
     */
    public function __construct(Ticket $ticket, $oldStatus, $newStatus, User $updatedBy)
    {
        $this->ticket = $ticket;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->updatedBy = $updatedBy;
        
        Log::info('TicketStatusUpdatedNotification created', [
            'ticket_id' => $ticket->id,
            'ticket_code' => $ticket->code,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'updated_by' => $updatedBy->name,
        ]);
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->line('Your ticket status has been updated.')
                    ->action('View Ticket', route('tickets.show', $this->ticket->id))
                    ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase($notifiable)
    {
        // Determinar el mensaje basado en el nuevo status
        $statusMessages = [
            'open' => [
                'title' => '🎫 Ticket Opened',
                'message' => "Your ticket #{$this->ticket->code} has been opened and is being reviewed.",
                'icon' => 'ticket',
                'color' => 'blue'
            ],
            'in_progress' => [
                'title' => '🔧 Ticket In Progress',
                'message' => "Your ticket #{$this->ticket->code} is now being worked on by our technical team.",
                'icon' => 'wrench',
                'color' => 'purple'
            ],
            'resolved' => [
                'title' => '✅ Ticket Resolved',
                'message' => "Great news! Your ticket #{$this->ticket->code} has been resolved.",
                'icon' => 'check-circle',
                'color' => 'green'
            ],
            'closed' => [
                'title' => '📋 Ticket Closed',
                'message' => "Your ticket #{$this->ticket->code} has been closed. Thank you for using our service.",
                'icon' => 'clipboard-check',
                'color' => 'gray'
            ],
            'cancelled' => [
                'title' => '❌ Ticket Cancelled',
                'message' => "Your ticket #{$this->ticket->code} has been cancelled.",
                'icon' => 'x-circle',
                'color' => 'red'
            ]
        ];

        $statusInfo = $statusMessages[$this->newStatus] ?? [
            'title' => '📄 Ticket Updated',
            'message' => "Your ticket #{$this->ticket->code} status has been updated to {$this->newStatus}.",
            'icon' => 'info',
            'color' => 'blue'
        ];

        $data = [
            'type' => 'ticket_status_updated',
            'title' => $statusInfo['title'],
            'message' => $statusInfo['message'],
            'icon' => $statusInfo['icon'],
            'color' => $statusInfo['color'],
            'ticket_id' => $this->ticket->id,
            'ticket_code' => $this->ticket->code,
            'ticket_title' => $this->ticket->title,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'updated_by' => $this->updatedBy->name,
            'updated_by_id' => $this->updatedBy->id,
            'updated_by_email' => $this->updatedBy->email,
            'action_url' => route('tickets.show', $this->ticket->id),
            'timestamp' => now()->toISOString(),
        ];

        Log::info('TicketStatusUpdatedNotification database data', [
            'notifiable_id' => $notifiable->id,
            'notifiable_type' => get_class($notifiable),
            'data' => $data
        ]);

        return $data;
    }
}
