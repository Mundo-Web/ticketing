<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use App\Models\NotificationTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketStatusChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $ticket;
    protected $oldStatus;
    protected $newStatus;
    protected $changedBy;

    /**
     * Create a new notification instance.
     */
    public function __construct(Ticket $ticket, string $oldStatus, string $newStatus, User $changedBy)
    {
        $this->ticket = $ticket;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->changedBy = $changedBy;
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
        $template = NotificationTemplate::getByName('ticket_status_changed');
        
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
        $statusLabels = [
            'open' => 'Abierto',
            'in_progress' => 'En Progreso',
            'resolved' => 'Resuelto',
            'closed' => 'Cerrado',
            'cancelled' => 'Cancelado'
        ];

        return (new MailMessage)
            ->subject('Estado del Ticket Actualizado - ' . $this->ticket->code)
            ->greeting('¡Hola ' . $notifiable->name . '!')
            ->line('El estado del ticket ' . $this->ticket->code . ' ha sido actualizado.')
            ->line('Estado anterior: ' . ($statusLabels[$this->oldStatus] ?? $this->oldStatus))
            ->line('Nuevo estado: ' . ($statusLabels[$this->newStatus] ?? $this->newStatus))
            ->line('Actualizado por: ' . $this->changedBy->name)
            ->action('Ver Ticket', url('/tickets/' . $this->ticket->id))
            ->line('Revisa los detalles del ticket para más información.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        $statusLabels = [
            'open' => 'Abierto',
            'in_progress' => 'En Progreso',
            'resolved' => 'Resuelto',
            'closed' => 'Cerrado',
            'cancelled' => 'Cancelado'
        ];

        $colorMap = [
            'open' => 'blue',
            'in_progress' => 'yellow',
            'resolved' => 'green',
            'closed' => 'gray',
            'cancelled' => 'red'
        ];

        return [
            'type' => 'ticket_status_changed',
            'ticket_id' => $this->ticket->id,
            'ticket_code' => $this->ticket->code,
            'title' => 'Estado del ticket actualizado',
            'message' => 'El ticket ' . $this->ticket->code . ' cambió a ' . ($statusLabels[$this->newStatus] ?? $this->newStatus),
            'action_url' => '/tickets/' . $this->ticket->id,
            'icon' => 'refresh-cw',
            'color' => $colorMap[$this->newStatus] ?? 'blue',
            'created_at' => now(),
        ];
    }

    /**
     * Get template data
     */
    protected function getTemplateData(): array
    {
        $statusLabels = [
            'open' => 'Abierto',
            'in_progress' => 'En Progreso',
            'resolved' => 'Resuelto',
            'closed' => 'Cerrado',
            'cancelled' => 'Cancelado'
        ];

        return [
            'ticket_code' => $this->ticket->code,
            'ticket_title' => $this->ticket->title,
            'old_status' => $statusLabels[$this->oldStatus] ?? $this->oldStatus,
            'new_status' => $statusLabels[$this->newStatus] ?? $this->newStatus,
            'changed_by_name' => $this->changedBy->name,
            'changed_at' => now()->format('d/m/Y H:i'),
            'ticket_url' => url('/tickets/' . $this->ticket->id),
        ];
    }
}
