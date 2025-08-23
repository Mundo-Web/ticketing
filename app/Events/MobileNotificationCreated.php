<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class MobileNotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;
    public $userId;

    public function __construct($notification, $userId)
    {
        $this->notification = $notification;
        $this->userId = $userId;
        
        Log::info('🚀 MobileNotificationCreated event created', [
            'user_id' => $userId,
            'notification' => $notification
        ]);
    }

    public function broadcastOn()
    {
        $channels = [
            // Canal privado para autenticación Sanctum
            new PrivateChannel('mobile-notifications.' . $this->userId),
            // Canal público para pruebas
            new Channel('mobile-notifications-public.' . $this->userId)
        ];
        
        Log::info('📡 Mobile broadcasting on channels', [
            'channels' => [
                'mobile-notifications.' . $this->userId,
                'mobile-notifications-public.' . $this->userId
            ]
        ]);
        
        return $channels;
    }

    public function broadcastAs()
    {
        Log::info('🎯 Mobile broadcasting as', ['event' => 'mobile.notification.created']);
        return 'mobile.notification.created';
    }
    
    public function broadcastWith()
    {
        $data = [
            'notification' => $this->notification,
            'user_id' => $this->userId,
            'timestamp' => now(),
            'platform' => 'mobile'
        ];
        Log::info('📦 Mobile broadcasting with data', $data);
        return $data;
    }
}