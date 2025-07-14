<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\NotificationTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $comment;

    /**
     * Create a new notification instance.
     */
    public function __construct(TicketComment $comment)
    {
        $this->comment = $comment;
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
        $template = NotificationTemplate::getByName('ticket_comment_added');
        
        if ($template) {
            $data = $this->getTemplateData();
            $processed = $template->processTemplate($data);
            
            return (new MailMessage)
                ->subject($processed['subject'])
                ->view('emails.ticket-notification', [
                    'content' => $processed['body_html'],
                    'ticket' => $this->comment->ticket,
                    'user' => $notifiable
                ]);
        }

        // Fallback si no hay template
        return (new MailMessage)
            ->subject('Nuevo Comentario - ' . $this->comment->ticket->id)
            ->greeting('¡Hola ' . $notifiable->name . '!')
            ->line('Se ha añadido un nuevo comentario al ticket: #' . $this->comment->ticket->id)
            ->line('Comentario de: ' . $this->comment->user->name)
            ->line('Comentario: ' . substr($this->comment->comment, 0, 200) . (strlen($this->comment->comment) > 200 ? '...' : ''))
            ->action('Ver Ticket', url('/tickets/' . $this->comment->ticket->id))
            ->line('Mantente al día con las actualizaciones del ticket.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'ticket_comment',
            'ticket_id' => $this->comment->ticket->id,
            'ticket_code' => $this->comment->ticket->id,
            'comment_id' => $this->comment->id,
            'title' => 'Nuevo comentario',
            'message' => $this->comment->user->name . ' comentó en el ticket #' . $this->comment->ticket->id,
            'action_url' => '/tickets/' . $this->comment->ticket->id,
            'icon' => 'message-square',
            'color' => 'blue',
            'created_at' => now(),
        ];
    }

    /**
     * Get template data
     */
    protected function getTemplateData(): array
    {
        return [
            'ticket_code' => $this->comment->ticket->id,
            'ticket_title' => $this->comment->ticket->title,
            'comment_text' => $this->comment->comment,
            'comment_author' => $this->comment->user->name,
            'comment_date' => $this->comment->created_at->format('d/m/Y H:i'),
            'is_internal' => $this->comment->is_internal ? 'Sí' : 'No',
            'ticket_url' => url('/tickets/' . $this->comment->ticket->id),
        ];
    }
}
