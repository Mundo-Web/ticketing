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

            // Improve push notification message with better formatting
            $improvedMessage = $this->improvePushMessage($notificationData);

            // Prepare push notification message
            $pushMessage = [
                'title' => $improvedMessage['title'],
                'body' => $improvedMessage['body'],
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
                'body' => $pushMessage['body'],
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

    /**
     * Improve push notification message with better formatting
     */
    private function improvePushMessage($data): array
    {
        $title = $data['title'] ?? '🔔 New Notification';
        $body = $data['message'] ?? 'You have a new notification';

        // Improve ticket-related messages
        if (isset($data['ticket_id'])) {
            // Use ticket title instead of code if available
            $ticketTitle = $data['ticket_title'] ?? null;
            $ticketCode = $data['ticket_code'] ?? "Ticket #{$data['ticket_id']}";
            
            // For status changes, improve the message format
            if (isset($data['type']) && $data['type'] === 'ticket_status_changed') {
                $newStatus = $this->formatStatusName($data['new_status'] ?? 'updated');
                
                if ($ticketTitle) {
                    $title = "📋 Ticket Updated";
                    $body = "'{$ticketTitle}' is now {$newStatus}";
                } else {
                    $title = "📋 Ticket Updated";
                    $body = "{$ticketCode} is now {$newStatus}";
                }
            }
            // For assignment notifications
            elseif (isset($data['type']) && $data['type'] === 'ticket_assigned') {
                $technicalName = $data['technical_name'] ?? 'a technician';
                
                if ($ticketTitle) {
                    $title = "👷 Ticket Assigned";
                    $body = "'{$ticketTitle}' has been assigned to {$technicalName}";
                } else {
                    $title = "👷 Ticket Assigned";
                    $body = "{$ticketCode} has been assigned to {$technicalName}";
                }
            }
            // For new tickets
            elseif (isset($data['type']) && $data['type'] === 'ticket_created') {
                if ($ticketTitle) {
                    $title = "🎫 New Ticket Created";
                    $body = "'{$ticketTitle}' has been created";
                } else {
                    $title = "🎫 New Ticket Created";
                    $body = "{$ticketCode} has been created";
                }
            }
        }
        
        // Improve appointment-related messages
        elseif (isset($data['appointment_id'])) {
            if (isset($data['type']) && strpos($data['type'], 'appointment') !== false) {
                $title = "📅 " . ucfirst(str_replace(['appointment_', '_'], ['', ' '], $data['type']));
            }
        }

        return [
            'title' => $title,
            'body' => $body
        ];
    }

    /**
     * Format status name for better readability
     */
    private function formatStatusName($status): string
    {
        $statusMap = [
            'open' => 'Open',
            'in_progress' => 'In Progress', 
            'pending' => 'Pending',
            'resolved' => 'Resolved',
            'closed' => 'Closed',
            'cancelled' => 'Cancelled',
            'reopened' => 'Reopened',
            'on_hold' => 'On Hold',
            'waiting_parts' => 'Waiting for Parts',
            'scheduled' => 'Scheduled'
        ];

        return $statusMap[$status] ?? ucfirst(str_replace('_', ' ', $status));
    }
}
