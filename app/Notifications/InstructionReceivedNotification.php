<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use App\Models\Technical;
use App\Models\User;

class InstructionReceivedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Technical $technical,
        public string $instruction,
        public string $priority,
        public User $sender
    ) {
        Log::info('📝 InstructionReceivedNotification created', [
            'technical_id' => $this->technical->id,
            'technical_email' => $this->technical->email,
            'priority' => $this->priority,
            'sender' => $this->sender->name
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
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $priorityEmojis = [
            'low' => '📝',
            'normal' => '💼',
            'high' => '⚡',
            'urgent' => '🚨'
        ];

        $priorityMessages = [
            'low' => 'Baja prioridad',
            'normal' => 'Prioridad normal',
            'high' => 'Alta prioridad',
            'urgent' => 'URGENTE'
        ];

        return [
            'type' => 'instruction_received',
            'title' => $priorityEmojis[$this->priority] . ' Nueva instrucción recibida',
            'message' => "De: {$this->sender->name} - {$priorityMessages[$this->priority]}",
            'instruction' => $this->instruction,
            'priority' => $this->priority,
            'sender' => [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'email' => $this->sender->email,
            ],
            'technical' => [
                'id' => $this->technical->id,
                'name' => $this->technical->name,
            ],
            'timestamp' => now()->toISOString(),
        ];
    }
}