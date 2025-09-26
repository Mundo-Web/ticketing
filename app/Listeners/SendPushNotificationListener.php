<?php

namespace App\Listeners;

use App\Events\NotificationCreated;
use App\Services\PushNotificationService;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendPushNotificationListener implements ShouldQueue
{
    use InteractsWithQueue;

    protected $pushService;

    /**
     * Create the event listener.
     */
    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    /**
     * Handle the event.
     */
    public function handle(NotificationCreated $event): void
    {
        try {
            // Get the user who should receive the notification
            $user = User::find($event->userId);
            
            if (!$user) {
                Log::warning('Push notification skipped: User not found', [
                    'user_id' => $event->userId
                ]);
                return;
            }

            // Only send push notifications to members (tenants)
            if (!$user->hasRole('member')) {
                Log::info('Push notification skipped: User is not a member', [
                    'user_id' => $event->userId,
                    'user_roles' => $user->roles->pluck('name')
                ]);
                return;
            }

            // Get tenant info
            $tenant = $user->tenant;
            if (!$tenant) {
                Log::warning('Push notification skipped: Tenant not found', [
                    'user_id' => $event->userId
                ]);
                return;
            }

            // Extract notification data
            $notificationData = is_array($event->notification) 
                ? $event->notification 
                : $event->notification->data ?? [];

            // Prepare push notification message
            $pushMessage = [
                'title' => $notificationData['title'] ?? '🔔 Nueva Notificación',
                'body' => $notificationData['message'] ?? 'Tienes una nueva notificación',
                'data' => [
                    'type' => $this->extractNotificationType($notificationData),
                    'screen' => $this->extractTargetScreen($notificationData),
                    'entityId' => $notificationData['ticket_id'] ?? $notificationData['appointment_id'] ?? null,
                    'notification_id' => $event->notification->id ?? null,
                    'timestamp' => now()->toISOString(),
                ]
            ];

            // Send push notification
            $result = $this->pushService->sendPushToTenant($tenant->id, $pushMessage);

            Log::info('Push notification sent from listener', [
                'tenant_id' => $tenant->id,
                'user_id' => $event->userId,
                'title' => $pushMessage['title'],
                'success' => $result['success'],
                'sent_to_devices' => $result['sent_to_devices'] ?? 0
            ]);

        } catch (\Exception $e) {
            Log::error('Error sending push notification from listener', [
                'user_id' => $event->userId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Extract notification type from notification data
     */
    private function extractNotificationType($data): string
    {
        // Check for specific types in the notification data
        if (isset($data['ticket_id'])) {
            return 'ticket';
        }
        
        if (isset($data['appointment_id'])) {
            return 'appointment';
        }

        if (isset($data['type'])) {
            return $data['type'];
        }

        return 'general';
    }

    /**
     * Extract target screen from notification data
     */
    private function extractTargetScreen($data): string
    {
        // Check for existing action_url
        if (isset($data['action_url'])) {
            return $data['action_url'];
        }

        // Generate screen based on type
        if (isset($data['ticket_id'])) {
            return '/tickets';
        }
        
        if (isset($data['appointment_id'])) {
            return '/appointments';
        }

        return '/notifications';
    }
}
