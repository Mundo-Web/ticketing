<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetNotification extends Notification
{
    use Queueable;

    private $temporaryPassword;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $temporaryPassword)
    {
        $this->temporaryPassword = $temporaryPassword;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Password Reset - Ticketing System')
            ->greeting('Hello ' . $notifiable->name . '!')
            ->line('Your password has been reset successfully.')
            ->line('Your temporary password is: **' . $this->temporaryPassword . '**')
            ->line('For security reasons, please login and change your password immediately.')
            ->action('Login to System', url('/login'))
            ->line('If you did not request a password reset, please contact support immediately.')
            ->salutation('Best regards, The Ticketing System Team');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'message' => 'Your password has been reset. Check your email for the new temporary password.',
            'type' => 'password_reset'
        ];
    }
}