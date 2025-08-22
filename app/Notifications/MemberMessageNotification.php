<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MemberMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $ticket;
    protected $member;
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct(Ticket $ticket, Tenant $member, string $message)
    {
        $this->ticket = $ticket;
        $this->member = $member;
        $this->message = $message;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Message from Member - Ticket #' . $this->ticket->id)
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('You have received a new message from a member regarding ticket #' . $this->ticket->id)
            ->line('**From:** ' . $this->member->name)
            ->line('**Location:** ' . ($this->member->apartment->building->name ?? 'N/A') . ' - ' . ($this->member->apartment->name ?? 'N/A'))
            ->line('**Message:**')
            ->line('"' . $this->message . '"')
            ->action('View Ticket Details', url('/tickets?ticket=' . $this->ticket->id))
            ->line('Please respond to this message by adding a comment to the ticket.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'member_message',
            'ticket_id' => $this->ticket->id,
            'ticket_code' => $this->ticket->id,
            'member_id' => $this->member->id,
            'title' => 'New message from member',
            'message' => $this->member->name . ' sent you a message about ticket #' . $this->ticket->code,
            'member_message' => $this->message,
            'action_url' => '/tickets?ticket=' . $this->ticket->id,
            'icon' => 'message-circle',
            'color' => 'blue',
            'priority' => 'normal',
            'created_at' => now(),
        ];
    }
}