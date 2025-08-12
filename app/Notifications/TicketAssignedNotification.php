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

class TicketAssignedNotification extends Notification
{

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
        // Personalizar el mensaje según el destinatario
        $title = '';
        $message = '';
        $icon = 'user-plus';
        $color = 'green';

        // Verificar si es el técnico asignado (comparar por ID si es un User que corresponde al Technical)
        $isAssignedTechnical = false;
        
        // Verificar si el notifiable es el usuario asociado al técnico asignado
        if ($notifiable->email === $this->technical->email) {
            $isAssignedTechnical = true;
        }
        
        if ($isAssignedTechnical) {
            // Mensaje para el técnico asignado
            $title = '🎯 Te han asignado un ticket';
            $message = sprintf(
                'Se te ha asignado el ticket %s por %s. %s',
                $this->ticket->code,
                $this->assignedBy->name,
                $this->ticket->title ? '- ' . $this->ticket->title : ''
            );
            $icon = 'clipboard-check';
            $color = 'blue';
        } elseif ($notifiable->id === $this->ticket->user_id) {
            // Mensaje para el usuario que creó el ticket
            $title = '👤 Técnico asignado a tu ticket';
            $message = sprintf(
                'Tu ticket %s ha sido asignado al técnico %s por %s',
                $this->ticket->code,
                $this->technical->name,
                $this->assignedBy->name
            );
            $icon = 'user-check';
            $color = 'green';
        } else {
            // Mensaje para administradores u otros usuarios
            $title = '📋 Ticket asignado';
            $message = sprintf(
                'El ticket %s ha sido asignado al técnico %s por %s',
                $this->ticket->code,
                $this->technical->name,
                $this->assignedBy->name
            );
            $icon = 'users';
            $color = 'gray';
        }

        return [
            'type' => 'ticket_assigned',
            'ticket_id' => $this->ticket->id,
            'ticket_code' => $this->ticket->code,
            'title' => $title,
            'message' => $message,
            'action_url' => '/tickets/' . $this->ticket->id,
            'icon' => $icon,
            'color' => $color,
            'assigned_to' => $this->technical->name,
            'assigned_to_id' => $this->technical->id,
            'assigned_to_email' => $this->technical->email,
            'assigned_by' => $this->assignedBy->name,
            'assigned_by_id' => $this->assignedBy->id,
            'assigned_by_email' => $this->assignedBy->email,
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
