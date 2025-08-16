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

class NotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;
    public $userId;

    public function __construct($notification, $userId)
    {
        $this->notification = $notification;
        $this->userId = $userId;
        
        Log::info('🚀 NotificationCreated event created', [
            'user_id' => $userId,
            'notification' => $notification
        ]);
    }

    public function broadcastOn()
    {
        $channel = 'notifications-public.' . $this->userId;
        Log::info('📡 Broadcasting on channel', ['channel' => $channel]);
        return new Channel($channel);
    }

    public function broadcastAs()
    {
        Log::info('🎯 Broadcasting as', ['event' => 'notification.created']);
        return 'notification.created';
    }
    
    public function broadcastWith()
    {
        $data = [
            'notification' => $this->notification,
            'user_id' => $this->userId,
            'timestamp' => now()
        ];
        Log::info('📦 Broadcasting with data', $data);
        return $data;
    }
}