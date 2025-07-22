<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\NotificationTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;

class TicketCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $ticket;

    /**
     * Create a new notification instance.
     */
    public function __construct(Ticket $ticket)
    {
        $this->ticket = $ticket;
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
        $template = NotificationTemplate::getByName('ticket_created');
        
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
            ->subject('Nuevo Ticket Creado - ' . $this->ticket->code)
            ->greeting('¡Hola ' . $notifiable->name . '!')
            ->line('Se ha creado un nuevo ticket con el código: ' . $this->ticket->code)
            ->line('Título: ' . $this->ticket->title)
            ->line('Categoría: ' . $this->ticket->category)
            ->line('Descripción: ' . $this->ticket->description)
            ->action('Ver Ticket', url('/tickets/' . $this->ticket->id))
            ->line('Gracias por usar nuestro sistema de tickets.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'ticket_created',
            'ticket_id' => $this->ticket->id,
            'ticket_code' => $this->ticket->code,
            'title' => 'Nuevo ticket creado',
            'message' => 'Se ha creado el ticket ' . $this->ticket->code . ': ' . $this->ticket->title,
            'action_url' => '/tickets/' . $this->ticket->id,
            'icon' => 'ticket',
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
            'ticket_code' => $this->ticket->code,
            'ticket_title' => $this->ticket->title,
            'ticket_description' => $this->ticket->description,
            'ticket_category' => $this->ticket->category,
            'ticket_status' => $this->ticket->status,
            'user_name' => $this->ticket->user->name ?? '',
            'device_name' => $this->ticket->device->name_device->name ?? 'Dispositivo desconocido',
            'created_at' => $this->ticket->created_at->format('d/m/Y H:i'),
            'ticket_url' => url('/tickets/' . $this->ticket->id),
        ];
    }
}
