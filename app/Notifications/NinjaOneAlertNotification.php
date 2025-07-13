<?php

namespace App\Notifications;

use App\Models\NinjaOneAlert;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NinjaOneAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $alert;

    /**
     * Create a new notification instance.
     */
    public function __construct(NinjaOneAlert $alert)
    {
        $this->alert = $alert;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
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
        $deviceName = $this->alert->device->name ?? 'Unknown Device';
        $severity = ucfirst($this->alert->severity);
        
        return (new MailMessage)
            ->subject("[{$severity}] Device Alert: {$deviceName}")
            ->line("Alert detected on your device: {$deviceName}")
            ->line("Severity: {$severity}")
            ->line("Title: {$this->alert->title}")
            ->line("Description: {$this->alert->description}")
            ->action('Create Ticket', route('tickets.create-from-alert', $this->alert->id))
            ->line('Click the button above to create a support ticket for this issue.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'alert_id' => $this->alert->id,
            'ninjaone_alert_id' => $this->alert->ninjaone_alert_id,
            'device_id' => $this->alert->device_id,
            'device_name' => $this->alert->device->name ?? 'Unknown Device',
            'title' => $this->alert->title,
            'severity' => $this->alert->severity,
            'alert_type' => $this->alert->alert_type,
            'description' => $this->alert->description,
            'created_at' => $this->alert->ninjaone_created_at->toISOString(),
            'action_url' => route('tickets.create-from-alert', $this->alert->id),
        ];
    }
}
