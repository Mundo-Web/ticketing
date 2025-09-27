<?php

namespace App\Listeners;

use App\Events\NotificationCreated;
use App\Services\PushNotificationService;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

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
            // 🔍 LOG 1: Datos iniciales del evento
            Log::info('📱 PUSH NOTIFICATION LISTENER - Event Received', [
                'user_id' => $event->userId,
                'notification_type' => get_class($event->notification),
                'notification_id' => $event->notification->id ?? 'N/A',
            ]);

            // Get the user who should receive the notification
            $user = User::find($event->userId);
            
            if (!$user) {
                Log::warning('❌ Push notification skipped: User not found', [
                    'user_id' => $event->userId
                ]);
                return;
            }

            // Only send push notifications to members (tenants)
            if (!$user->hasRole('member')) {
                Log::info('⏭️ Push notification skipped: User is not a member', [
                    'user_id' => $event->userId,
                    'user_roles' => $user->roles->pluck('name')
                ]);
                return;
            }

            // Check for duplicate notifications (deduplication)
            if ($this->isDuplicateNotification($event)) {
                Log::info('⏭️ Push notification skipped: Duplicate detected within time window', [
                    'user_id' => $event->userId,
                    'notification_id' => $event->notification->id ?? 'N/A'
                ]);
                return;
            }

            // Get tenant info
            $tenant = $user->tenant;
            if (!$tenant) {
                Log::warning('❌ Push notification skipped: Tenant not found', [
                    'user_id' => $event->userId
                ]);
                return;
            }

            // 🔍 LOG 2: Usuario y tenant validados
            Log::info('✅ PUSH NOTIFICATION - User and Tenant Validated', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_email' => $user->email,
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name,
                'tenant_phone' => $tenant->phone
            ]);

            // Extract notification data
            $notificationData = is_array($event->notification) 
                ? $event->notification 
                : $event->notification->data ?? [];

            // 🔍 LOG 3: Datos RAW de la notificación
            Log::info('📋 PUSH NOTIFICATION - Raw Notification Data', [
                'raw_notification_data' => $notificationData,
                'data_type' => gettype($notificationData),
                'data_keys' => is_array($notificationData) ? array_keys($notificationData) : 'Not array'
            ]);

            // Improve push notification message with better formatting
            $improvedMessage = $this->improvePushMessage($notificationData);

            // 🔍 LOG 4: Mensaje mejorado generado
            Log::info('✨ PUSH NOTIFICATION - Improved Message Generated', [
                'original_title' => $notificationData['title'] ?? 'N/A',
                'original_message' => $notificationData['message'] ?? 'N/A',
                'improved_title' => $improvedMessage['title'],
                'improved_body' => $improvedMessage['body'],
                'notification_type' => $notificationData['type'] ?? 'unknown'
            ]);

            // Prepare push notification message with enhanced data (using real model fields)
            $pushMessage = [
                'title' => $improvedMessage['title'],
                'body' => $improvedMessage['body'],
                'data' => [
                    'type' => $this->extractNotificationType($notificationData),
                    'screen' => $this->extractTargetScreen($notificationData),
                    'entityId' => $notificationData['ticket_id'] ?? $notificationData['appointment_id'] ?? null,
                    'notification_id' => $event->notification->id ?? null,
                    'timestamp' => now()->toISOString(),
                    
                    // Enhanced ticket data if available (using real fields)
                    'ticket_data' => isset($notificationData['ticket_id']) ? [
                        'id' => $notificationData['ticket_id'],
                        'code' => $notificationData['ticket_code'] ?? null,
                        'title' => $notificationData['ticket_title'] ?? null,
                        'category' => $notificationData['ticket_category'] ?? null,
                        'description' => $notificationData['ticket_description'] ?? null,
                        'status' => $notificationData['new_status'] ?? $notificationData['ticket_status'] ?? null,
                        'priority' => $notificationData['ticket_priority'] ?? $notificationData['priority'] ?? null,
                    ] : null,
                    
                    // Enhanced technical data if available (using real fields)
                    'technical_data' => isset($notificationData['technical_id']) ? [
                        'id' => $notificationData['technical_id'],
                        'name' => $notificationData['technical_name'] ?? null,
                        'phone' => $notificationData['technical_phone'] ?? null,
                        'email' => $notificationData['technical_email'] ?? null,
                        'shift' => $notificationData['technical_shift'] ?? null,
                        'photo' => $notificationData['technical_photo'] ?? null,
                    ] : null,
                    
                    // Enhanced device data if available (using real fields from Device model)
                    'device_data' => isset($notificationData['device_id']) ? [
                        'id' => $notificationData['device_id'],
                        'name' => $notificationData['device_name'] ?? null,
                        'brand' => $notificationData['device_brand'] ?? null,
                        'model' => $notificationData['device_model'] ?? null,
                        'ubicacion' => $notificationData['device_ubicacion'] ?? null,
                        'icon' => $notificationData['device_icon'] ?? null,
                    ] : null,
                    
                    // Enhanced appointment data if available (using real fields)
                    'appointment_data' => isset($notificationData['appointment_id']) ? [
                        'id' => $notificationData['appointment_id'],
                        'title' => $notificationData['appointment_title'] ?? null,
                        'description' => $notificationData['appointment_description'] ?? null,
                        'address' => $notificationData['appointment_address'] ?? null,
                        'scheduled_for' => $notificationData['scheduled_for'] ?? null,
                        'status' => $notificationData['appointment_status'] ?? null,
                        'estimated_duration' => $notificationData['estimated_duration'] ?? null,
                    ] : null,
                    
                    // Client/Location data if available (using real fields)
                    'location_data' => [
                        'client_name' => $notificationData['client_name'] ?? null,
                        'client_phone' => $notificationData['client_phone'] ?? null,
                        'client_email' => $notificationData['client_email'] ?? null,
                        'tenant_name' => $notificationData['tenant_name'] ?? null,
                        'tenant_phone' => $notificationData['tenant_phone'] ?? null,
                        'apartment_name' => $notificationData['apartment_name'] ?? null,
                        'apartment_ubicacion' => $notificationData['apartment_ubicacion'] ?? null,
                        'building_name' => $notificationData['building_name'] ?? null,
                        'building_address' => $notificationData['building_address'] ?? null,
                        'building_photo' => $notificationData['building_photo'] ?? null,
                    ]
                ]
            ];

            // 🔍 LOG 5: Payload completo que se envía al móvil
            Log::info('📤 PUSH NOTIFICATION - Complete Payload Being Sent', [
                'tenant_id' => $tenant->id,
                'complete_push_message' => $pushMessage,
                'message_structure' => [
                    'title' => $pushMessage['title'],
                    'body' => $pushMessage['body'],
                    'data_keys' => array_keys($pushMessage['data']),
                    'ticket_data_available' => !is_null($pushMessage['data']['ticket_data']),
                    'technical_data_available' => !is_null($pushMessage['data']['technical_data']),
                    'device_data_available' => !is_null($pushMessage['data']['device_data']),
                    'appointment_data_available' => !is_null($pushMessage['data']['appointment_data']),
                    'location_data_keys' => array_keys(array_filter($pushMessage['data']['location_data'] ?? []))
                ]
            ]);

            // Send push notification
            $result = $this->pushService->sendPushToTenant($tenant->id, $pushMessage);

            // 🔍 LOG 6: Resultado del envío
            Log::info('📬 PUSH NOTIFICATION - Send Result', [
                'tenant_id' => $tenant->id,
                'user_id' => $event->userId,
                'title' => $pushMessage['title'],
                'body' => $pushMessage['body'],
                'push_service_result' => $result,
                'success' => $result['success'] ?? false,
                'sent_to_devices' => $result['sent_to_devices'] ?? 0,
                'error_message' => $result['error'] ?? null
            ]);

            // 🔍 LOG 7: Resumen final
            if ($result['success'] ?? false) {
                Log::info('✅ PUSH NOTIFICATION - Successfully Sent', [
                    'notification_type' => $notificationData['type'] ?? 'unknown',
                    'entity_type' => isset($notificationData['ticket_id']) ? 'ticket' : (isset($notificationData['appointment_id']) ? 'appointment' : 'other'),
                    'entity_id' => $notificationData['ticket_id'] ?? $notificationData['appointment_id'] ?? null,
                    'devices_reached' => $result['sent_to_devices'] ?? 0
                ]);
            } else {
                Log::warning('⚠️ PUSH NOTIFICATION - Send Failed', [
                    'notification_type' => $notificationData['type'] ?? 'unknown', 
                    'error' => $result['error'] ?? 'Unknown error',
                    'devices_attempted' => $result['attempted_devices'] ?? 0
                ]);
            }

        } catch (\Exception $e) {
            // 🔍 LOG 8: Error crítico
            Log::error('❌ PUSH NOTIFICATION - Critical Error', [
                'user_id' => $event->userId,
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'stack_trace' => $e->getTraceAsString()
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
     * Improve push notification message with better formatting using real model fields
     */
    private function improvePushMessage($data): array
    {
        $title = $data['title'] ?? '🔔 New Notification';
        $body = $data['message'] ?? 'You have a new notification';

        // Improve ticket-related messages with complete information using real fields
        if (isset($data['ticket_id'])) {
            // Get complete ticket information (using real fields from models)
            $ticketTitle = $data['ticket_title'] ?? null;
            $ticketCode = $data['ticket_code'] ?? "Ticket #{$data['ticket_id']}";
            $deviceName = $data['device_name'] ?? 'Unknown Device';
            $deviceBrand = $data['device_brand'] ?? null;
            $deviceModel = $data['device_model'] ?? null;
            $technicalName = $data['technical_name'] ?? null;
            $clientName = $data['client_name'] ?? $data['tenant_name'] ?? 'Unknown Client';
            $buildingName = $data['building_name'] ?? null;
            $apartmentName = $data['apartment_name'] ?? null;
            
            // For status changes, provide detailed information
            if (isset($data['type']) && $data['type'] === 'ticket_status_changed') {
                $oldStatus = $this->formatStatusName($data['old_status'] ?? 'unknown');
                $newStatus = $this->formatStatusName($data['new_status'] ?? 'updated');
                
                if ($ticketTitle) {
                    $title = "🔄 Ticket Status Changed";
                    $body = "The ticket '{$ticketTitle}' has changed from {$oldStatus} to {$newStatus}";
                } else {
                    $title = "🔄 Ticket Status Changed";
                    $body = "{$ticketCode} has changed from {$oldStatus} to {$newStatus}";
                }
                
                // Add device information if available (using real fields)
                $deviceInfo = $deviceName;
                if ($deviceBrand && $deviceName !== 'Unknown Device') $deviceInfo = "{$deviceBrand} {$deviceInfo}";
                if ($deviceModel && $deviceName !== 'Unknown Device') $deviceInfo .= " ({$deviceModel})";
                if ($deviceName !== 'Unknown Device') {
                    $body .= " - Device: {$deviceInfo}";
                }
                
                // Add technical information if assigned
                if ($technicalName) {
                    $body .= " - Assigned to: {$technicalName}";
                }
                
                // Add location information if available
                if ($apartmentName && $buildingName) {
                    $body .= " - Location: {$apartmentName}, {$buildingName}";
                } elseif ($apartmentName) {
                    $body .= " - Location: {$apartmentName}";
                }
            }
            
            // For assignment notifications
            elseif (isset($data['type']) && $data['type'] === 'ticket_assigned') {
                $assignedTechnical = $data['technical_name'] ?? 'a technician';
                $technicalPhone = $data['technical_phone'] ?? null;
                
                if ($ticketTitle) {
                    $title = "👨‍🔧 Ticket Assigned";
                    $body = "The ticket '{$ticketTitle}' has been assigned to {$assignedTechnical}";
                } else {
                    $title = "👨‍🔧 Ticket Assigned";
                    $body = "{$ticketCode} has been assigned to {$assignedTechnical}";
                }
                
                // Add technical phone if available
                if ($technicalPhone) {
                    $body .= " (Phone: {$technicalPhone})";
                }
                
                // Add device information (using real fields)
                $deviceInfo = $deviceName;
                if ($deviceBrand && $deviceName !== 'Unknown Device') $deviceInfo = "{$deviceBrand} {$deviceInfo}";
                if ($deviceModel && $deviceName !== 'Unknown Device') $deviceInfo .= " ({$deviceModel})";
                if ($deviceName !== 'Unknown Device') {
                    $body .= " - Device: {$deviceInfo}";
                }
                
                // Add location if available
                if ($apartmentName && $buildingName) {
                    $body .= " at {$apartmentName}, {$buildingName}";
                }
            }
            
            // For ticket unassigned notifications
            elseif (isset($data['type']) && $data['type'] === 'ticket_unassigned') {
                $previousTechnical = $data['previous_technical_name'] ?? $data['technical_name'] ?? 'the technician';
                
                if ($ticketTitle) {
                    $title = "❌ Technician Unassigned";
                    $body = "The technician {$previousTechnical} has been unassigned from ticket '{$ticketTitle}'";
                } else {
                    $title = "❌ Technician Unassigned";
                    $body = "The technician {$previousTechnical} has been unassigned from {$ticketCode}";
                }
                
                // Add device information
                $deviceInfo = $deviceName;
                if ($deviceBrand && $deviceName !== 'Unknown Device') $deviceInfo = "{$deviceBrand} {$deviceInfo}";
                if ($deviceModel && $deviceName !== 'Unknown Device') $deviceInfo .= " ({$deviceModel})";
                if ($deviceName !== 'Unknown Device') {
                    $body .= " - Device: {$deviceInfo}";
                }
            }
            
            // For new tickets
            elseif (isset($data['type']) && $data['type'] === 'ticket_created') {
                $createdBy = $data['created_by'] ?? $clientName;
                
                if ($ticketTitle) {
                    $title = "🎫 New Ticket Created";
                    $body = "New ticket '{$ticketTitle}' has been created by {$createdBy}";
                } else {
                    $title = "🎫 New Ticket Created";
                    $body = "New {$ticketCode} has been created by {$createdBy}";
                }
                
                // Add device information
                $deviceInfo = $deviceName;
                if ($deviceBrand && $deviceName !== 'Unknown Device') $deviceInfo = "{$deviceBrand} {$deviceInfo}";
                if ($deviceModel && $deviceName !== 'Unknown Device') $deviceInfo .= " ({$deviceModel})";
                if ($deviceName !== 'Unknown Device') {
                    $body .= " - Device: {$deviceInfo}";
                }
                
                // Add location if available
                if ($apartmentName && $buildingName) {
                    $body .= " at {$apartmentName}, {$buildingName}";
                }
            }
        }
        
        // Improve appointment-related messages with complete information (using real fields)
        elseif (isset($data['appointment_id'])) {
            $appointmentTitle = $data['appointment_title'] ?? 'Appointment';
            $appointmentAddress = $data['appointment_address'] ?? '';
            $technicalName = $data['technical_name'] ?? 'a technician';
            $clientName = $data['client_name'] ?? 'client';
            $scheduledFor = $data['scheduled_for'] ?? null;
            
            // Format appointment date if available
            $appointmentDateFormatted = '';
            if ($scheduledFor) {
                try {
                    $appointmentDateFormatted = \Carbon\Carbon::parse($scheduledFor)->format('M d, Y \a\t g:i A');
                } catch (\Exception $e) {
                    $appointmentDateFormatted = $scheduledFor;
                }
            }
            
            if (isset($data['type'])) {
                switch ($data['type']) {
                    case 'appointment_created':
                        $title = "📅 New Appointment Created";
                        $body = "A new appointment '{$appointmentTitle}' has been created";
                        if ($appointmentDateFormatted) {
                            $body .= " for {$appointmentDateFormatted}";
                        }
                        if ($technicalName !== 'a technician') {
                            $body .= " with {$technicalName}";
                        }
                        if ($appointmentAddress) {
                            $body .= " at {$appointmentAddress}";
                        }
                        break;
                        
                    case 'appointment_rescheduled':
                        $oldDate = $data['old_datetime_formatted'] ?? 'previous date';
                        $newDate = $data['new_datetime_formatted'] ?? 'new date';
                        $title = "🔄 Appointment Rescheduled";
                        $body = "The appointment '{$appointmentTitle}' has been rescheduled from {$oldDate} to {$newDate}";
                        break;
                        
                    case 'appointment_reminder':
                        $minutesBefore = $data['minutes_before'] ?? 30;
                        $title = "⏰ Appointment Reminder";
                        $body = "Your appointment '{$appointmentTitle}' starts in {$minutesBefore} minutes";
                        if ($appointmentAddress) {
                            $body .= " at {$appointmentAddress}";
                        }
                        if ($technicalName !== 'a technician') {
                            $body .= " with {$technicalName}";
                        }
                        break;
                        
                    case 'appointment_started':
                        $title = "🚀 Appointment Started";
                        $body = "The appointment '{$appointmentTitle}' has started";
                        if ($technicalName !== 'a technician') {
                            $body .= " with {$technicalName}";
                        }
                        break;
                        
                    case 'appointment_completed':
                        $title = "✅ Appointment Completed";
                        $body = "The appointment '{$appointmentTitle}' has been completed";
                        if ($technicalName !== 'a technician') {
                            $body .= " by {$technicalName}";
                        }
                        break;
                        
                    case 'appointment_cancelled':
                        $title = "❌ Appointment Cancelled";
                        $body = "The appointment '{$appointmentTitle}' has been cancelled";
                        if ($appointmentDateFormatted) {
                            $body .= " (was scheduled for {$appointmentDateFormatted})";
                        }
                        $reason = $data['cancellation_reason'] ?? null;
                        if ($reason) {
                            $body .= " - Reason: {$reason}";
                        }
                        break;
                        
                    default:
                        $title = "📅 " . ucfirst(str_replace(['appointment_', '_'], ['', ' '], $data['type']));
                        break;
                }
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

    /**
     * Check if this notification is a duplicate within the deduplication window
     */
    private function isDuplicateNotification(NotificationCreated $event): bool
    {
        try {
            $cacheKey = 'push_notification_' . $event->userId . '_' . ($event->notification->id ?? 'unknown');
            $deduplicationWindow = 30; // seconds
            
            // Check if we already processed this notification recently
            if (Cache::has($cacheKey)) {
                Log::info('🔄 DEDUPLICATION - Duplicate notification blocked', [
                    'user_id' => $event->userId,
                    'notification_id' => $event->notification->id ?? 'N/A',
                    'cache_key' => $cacheKey,
                    'window_seconds' => $deduplicationWindow
                ]);
                return true;
            }
            
            // Mark this notification as processed
            Cache::put($cacheKey, true, $deduplicationWindow);
            
            Log::info('✅ DEDUPLICATION - Notification allowed (first occurrence)', [
                'user_id' => $event->userId,
                'notification_id' => $event->notification->id ?? 'N/A',
                'cache_key' => $cacheKey,
                'ttl_seconds' => $deduplicationWindow
            ]);
            
            return false;
            
        } catch (\Exception $e) {
            Log::error('❌ DEDUPLICATION - Error checking for duplicates', [
                'error' => $e->getMessage(),
                'user_id' => $event->userId,
                'notification_id' => $event->notification->id ?? 'N/A'
            ]);
            
            // If deduplication fails, allow the notification to prevent blocking legitimate ones
            return false;
        }
    }
}