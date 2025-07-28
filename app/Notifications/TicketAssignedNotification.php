<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use App\Models\Technical;
use App\Models\NotificationTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $ticket;
    protected $technical;
    protected $assignedBy;

    /**
     * Create a new notification instance.
     */
    public function __construct(Ticket $ticket, Technical $technical, User $assignedBy)
    {
        $this->ticket = $ticket;
        $this->technical = $technical;
        $this->assignedBy = $assignedBy;
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
        $template = NotificationTemplate::getByName('ticket_assigned');
        
        if ($template) {
            $data = $this->getTemplateData();
            $processed = $template->processTemplate($data);
            
            return (new MailMessage)
                ->subject($processed['subject'])
                ->view('emails.ticket-notification', [
                    'content' => $processed['body_html'],
                    'ticket' => $this->ticket,
                    'user' => $notifiable
                ]);
        }

        // Fallback si no hay template
        return (new MailMessage)
            ->subject('Ticket Asignado - ' . $this->ticket->code)
            ->greeting('¡Hola ' . $notifiable->name . '!')
            ->line('Se te ha asignado el ticket: ' . $this->ticket->code)
            ->line('Título: ' . $this->ticket->title)
            ->line('Asignado por: ' . $this->assignedBy->name)
            ->action('Ver Ticket', url('/tickets/' . $this->ticket->id))
            ->line('¡Por favor revisa los detalles y comienza a trabajar en él!');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'ticket_assigned',
            'ticket_id' => $this->ticket->id,
            'ticket_code' => $this->ticket->code,
            'title' => 'Ticket asignado',
            'message' => 'Se te ha asignado el ticket ' . $this->ticket->code . ' por ' . $this->assignedBy->name,
            'action_url' => '/tickets/' . $this->ticket->id,
            'icon' => 'user-plus',
            'color' => 'green',
            'created_at' => now(),
        ];
    }

    /**
     * Get template data
     */
    protected function getTemplateData(): array
    {
        return [
            'ticket_code' => $this->ticket->code,
            'ticket_title' => $this->ticket->title,
            'ticket_description' => $this->ticket->description,
            'technical_name' => $this->technical->name,
            'assigned_by_name' => $this->assignedBy->name,
            'assigned_at' => now()->format('d/m/Y H:i'),
            'ticket_url' => url('/tickets/' . $this->ticket->id),
        ];
    }
}
