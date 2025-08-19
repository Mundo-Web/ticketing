<?php

namespace App\Notifications;

use App\Models\Appointment;
use App\Models\NotificationTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AppointmentRescheduledNotification extends Notification
{
    protected $appointment;
    protected $oldDateTime;
    protected $newDateTime;
    protected $recipientType;

    /**
     * Create a new notification instance.
     */
    public function __construct(Appointment $appointment, $oldDateTime, $newDateTime, $recipientType = 'technical')
    {
        $this->appointment = $appointment;
        $this->oldDateTime = $oldDateTime;
        $this->newDateTime = $newDateTime;
        $this->recipientType = $recipientType; // 'technical' or 'member'
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
        $template = NotificationTemplate::getByName('appointment_rescheduled');
        
        if ($template) {
            $data = $this->getTemplateData();
            $processed = $template->processTemplate($data);
            
            return (new MailMessage)
                ->subject($processed['subject'])
                ->view('emails.appointment-notification', [
                    'content' => $processed['body_html'],
                    'appointment' => $this->appointment,
                    'user' => $notifiable
                ]);
        }

        // Fallback si no hay template
        $oldDate = Carbon::parse($this->oldDateTime)->format('d/m/Y H:i');
        $newDate = Carbon::parse($this->newDateTime)->format('d/m/Y H:i');
        
        return (new MailMessage)
            ->subject('Cita Reagendada - ' . $this->appointment->ticket->code)
            ->greeting('¡Hola ' . $notifiable->name . '!')
            ->line('Tu cita ha sido reagendada.')
            ->line('Ticket: ' . $this->appointment->ticket->code)
            ->line('Título: ' . ($this->appointment->title ?? 'Sin título'))
            ->line('Fecha anterior: ' . $oldDate)
            ->line('Nueva fecha: ' . $newDate)
            ->action('Ver Cita', url('/appointments/' . $this->appointment->id))
            ->line('¡Por favor revisa los nuevos detalles de tu cita!');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        // Personalizar el mensaje según el destinatario
        $title = '';
        $message = '';
        $icon = 'calendar';
        $color = 'orange';

        $oldDate = Carbon::parse($this->oldDateTime)->format('d/m/Y H:i');
        $newDate = Carbon::parse($this->newDateTime)->format('d/m/Y H:i');

        // Debug log para entender qué está pasando
        Log::info('AppointmentRescheduledNotification toDatabase debug', [
            'notifiable_id' => $notifiable->id,
            'notifiable_email' => $notifiable->email,
            'appointment_id' => $this->appointment->id,
            'recipient_type' => $this->recipientType,
            'technical_email' => $this->appointment->technical->email ?? 'N/A',
            'ticket_user_id' => $this->appointment->ticket->user_id ?? 'N/A',
            'old_datetime' => $oldDate,
            'new_datetime' => $newDate
        ]);

        if ($this->recipientType === 'technical') {
            // Mensaje para el técnico
            $title = '📅 Cita reagendada - Técnico';
            $message = sprintf(
                'Tu cita como técnico ha sido reagendada. Ticket %s - De %s a %s',
                $this->appointment->ticket->code,
                $oldDate,
                $newDate
            );
            $icon = 'calendar-days';
            $color = 'blue';
        } else {
            // Mensaje para el cliente/miembro
            $title = '📅 Cita reagendada - Cliente';
            $message = sprintf(
                'Tu cita ha sido reagendada. Ticket %s - De %s a %s',
                $this->appointment->ticket->code,
                $oldDate,
                $newDate
            );
            $icon = 'calendar-check';
            $color = 'green';
        }

        Log::info('AppointmentRescheduledNotification: Final message', [
            'title' => $title,
            'message' => $message,
            'icon' => $icon,
            'color' => $color,
            'recipient_type' => $this->recipientType
        ]);

        return [
            'type' => 'appointment_rescheduled',
            'appointment_id' => $this->appointment->id,
            'ticket_id' => $this->appointment->ticket->id,
            'ticket_code' => $this->appointment->ticket->code,
            'title' => $title,
            'message' => $message,
            'action_url' => '/appointments/' . $this->appointment->id,
            'icon' => $icon,
            'color' => $color,
            'recipient_type' => $this->recipientType,
            'old_datetime' => $this->oldDateTime,
            'new_datetime' => $this->newDateTime,
            'old_datetime_formatted' => $oldDate,
            'new_datetime_formatted' => $newDate,
            'appointment_title' => $this->appointment->title,
            'appointment_address' => $this->appointment->address,
            'technical_name' => $this->appointment->technical->name ?? 'N/A',
            'technical_email' => $this->appointment->technical->email ?? 'N/A',
            'created_at' => now(),
        ];
    }

    /**
     * Get template data
     */
    protected function getTemplateData(): array
    {
        $oldDate = Carbon::parse($this->oldDateTime)->format('d/m/Y H:i');
        $newDate = Carbon::parse($this->newDateTime)->format('d/m/Y H:i');
        
        return [
            'appointment_id' => $this->appointment->id,
            'ticket_code' => $this->appointment->ticket->code,
            'appointment_title' => $this->appointment->title ?? 'Sin título',
            'appointment_address' => $this->appointment->address ?? 'Dirección no especificada',
            'old_datetime' => $oldDate,
            'new_datetime' => $newDate,
            'technical_name' => $this->appointment->technical->name ?? 'N/A',
            'rescheduled_at' => now()->format('d/m/Y H:i'),
            'appointment_url' => url('/appointments/' . $this->appointment->id),
            'recipient_type' => $this->recipientType,
        ];
    }
}