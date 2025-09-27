<?php

namespace App\Services;

use App\Models\PushToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class PushNotificationService
{
    /**
     * Send push notification to all devices of a tenant
     */
    public function sendPushToTenant($tenantId, $message)
    {
        try {
            // Get all active tokens for the tenant
            $tokenRecords = PushToken::forTenant($tenantId)->active()->get();

            if ($tokenRecords->isEmpty()) {
                Log::info("No push tokens found for tenant: {$tenantId}");
                return [
                    'success' => false,
                    'message' => 'No active push tokens found',
                    'sent_to_devices' => 0
                ];
            }

            $results = [];
            $successCount = 0;

            // Send to each token based on its type
            foreach ($tokenRecords as $tokenRecord) {
                try {
                    if ($tokenRecord->isFcm()) {
                        $result = $this->sendToFirebase(
                            $tokenRecord->push_token,
                            $message['title'],
                            $message['body'],
                            $message['data'] ?? []
                        );
                    } else {
                        $result = $this->sendToExpo(
                            $tokenRecord->push_token,
                            $message['title'],
                            $message['body'],
                            $message['data'] ?? []
                        );
                    }

                    if ($result['success']) {
                        $successCount++;
                    }
                    
                    $results[] = $result;

                } catch (\Exception $e) {
                    Log::error("Error sending to individual token", [
                        'tenant_id' => $tenantId,
                        'token_type' => $tokenRecord->token_type,
                        'error' => $e->getMessage()
                    ]);
                    
                    $results[] = [
                        'success' => false,
                        'token_type' => $tokenRecord->token_type,
                        'error' => $e->getMessage()
                    ];
                }
            }

            Log::info("Push notifications batch completed", [
                'tenant_id' => $tenantId,
                'total_devices' => count($tokenRecords),
                'successful_sends' => $successCount,
                'title' => $message['title']
            ]);

            return [
                'success' => $successCount > 0,
                'message' => "Sent to {$successCount}/{$tokenRecords->count()} devices",
                'sent_to_devices' => $successCount,
                'results' => $results
            ];

        } catch (\Exception $e) {
            Log::error('Push notification service error', [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Push notification service error: ' . $e->getMessage(),
                'sent_to_devices' => 0
            ];
        }
    }

    /**
     * Send single notification (for testing)
     */
    public function sendSingleNotification($token, $tokenType, $title, $body, $data = [])
    {
        Log::info('Sending single push notification', [
            'token_type' => $tokenType,
            'token' => substr($token, 0, 20) . '...',
            'title' => $title,
        ]);

        try {
            if ($tokenType === 'fcm') {
                return $this->sendToFirebase($token, $title, $body, $data);
            } else {
                return $this->sendToExpo($token, $title, $body, $data);
            }
        } catch (\Exception $e) {
            Log::error('Error sending single push notification', [
                'token_type' => $tokenType,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'token_type' => $tokenType,
            ];
        }
    }

    /**
     * Send to Firebase Cloud Messaging
     */
    private function sendToFirebase($token, $title, $body, $data)
    {
        try {
            // Check if Firebase is configured
            if (!config('services.firebase.credentials') || !config('services.firebase.project_id')) {
                throw new \Exception('Firebase credentials not configured');
            }

            // Initialize Firebase
            $factory = (new Factory)
                ->withServiceAccount(config('services.firebase.credentials'))
                ->withProjectId(config('services.firebase.project_id'));
                
            $messaging = $factory->createMessaging();

            // Create notification
            $notification = Notification::create($title, $body);

            // Create message
            $message = CloudMessage::withTarget('token', $token)
                ->withNotification($notification)
                ->withData($data);

            // Send
            $result = $messaging->send($message);
            
            Log::info('FCM notification sent successfully', [
                'token' => substr($token, 0, 20) . '...',
                'title' => $title,
                'result' => $result,
            ]);

            return [
                'success' => true,
                'service' => 'Firebase Cloud Messaging',
                'token_type' => 'fcm',
            ];
            
        } catch (\Exception $e) {
            Log::error('FCM send error', [
                'error' => $e->getMessage(),
                'token' => substr($token, 0, 20) . '...',
                'title' => $title,
            ]);
            
            throw new \Exception('FCM Error: ' . $e->getMessage());
        }
    }

    /**
     * Send to Expo Push Service
     */
    private function sendToExpo($token, $title, $body, $data)
    {
        try {
            $payload = [
                'to' => $token,
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'sound' => 'default',
                'priority' => 'high',
                'channelId' => 'default',
            ];

            $response = Http::timeout(30)->post('https://exp.host/--/api/v2/push/send', $payload);

            if ($response->successful()) {
                Log::info('Expo notification sent successfully', [
                    'token' => substr($token, 0, 20) . '...',
                    'title' => $title,
                    'response' => $response->json(),
                ]);

                return [
                    'success' => true,
                    'service' => 'Expo Push Service',
                    'token_type' => 'expo',
                ];
            } else {
                throw new \Exception('Expo API returned: ' . $response->status() . ' - ' . $response->body());
            }
            
        } catch (\Exception $e) {
            Log::error('Expo send error', [
                'error' => $e->getMessage(),
                'token' => substr($token, 0, 20) . '...',
                'title' => $title,
            ]);
            
            throw new \Exception('Expo Error: ' . $e->getMessage());
        }
    }

    /**
     * Register a new push token for a tenant
     */
    public function registerToken($tenantId, $tokenData)
    {
        try {
            $pushToken = PushToken::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'push_token' => $tokenData['push_token']
                ],
                [
                    'platform' => $tokenData['platform'],
                    'device_name' => $tokenData['device_name'] ?? null,
                    'device_type' => $tokenData['device_type'],
                    'token_type' => $tokenData['token_type'] ?? 'expo',
                    'app_ownership' => $tokenData['app_ownership'] ?? null,
                    'is_standalone' => $tokenData['is_standalone'] ?? false,
                    'execution_environment' => $tokenData['execution_environment'] ?? null,
                    'is_active' => true,
                    'updated_at' => now(),
                ]
            );

            Log::info("Push token registered successfully", [
                'tenant_id' => $tenantId,
                'platform' => $tokenData['platform'],
                'device_type' => $tokenData['device_type'],
                'token_type' => $tokenData['token_type'] ?? 'expo',
                'is_standalone' => $tokenData['is_standalone'] ?? false,
            ]);

            return [
                'success' => true, 
                'message' => 'Push token registered successfully',
                'token_type' => $tokenData['token_type'] ?? 'expo',
            ];

        } catch (\Exception $e) {
            Log::error('Error registering push token', [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage()
            ]);

            return ['success' => false, 'message' => 'Failed to register push token: ' . $e->getMessage()];
        }
    }

    /**
     * Remove a push token
     */
    public function removeToken($pushToken)
    {
        try {
            $deleted = PushToken::where('push_token', $pushToken)->delete();

            Log::info("Push token removed", [
                'push_token' => substr($pushToken, 0, 20) . '...',
                'deleted' => $deleted
            ]);

            return ['success' => true, 'message' => 'Push token removed successfully'];

        } catch (\Exception $e) {
            Log::error('Error removing push token', [
                'push_token' => substr($pushToken, 0, 20) . '...',
                'error' => $e->getMessage()
            ]);

            return ['success' => false, 'message' => 'Failed to remove push token'];
        }
    }

    /**
     * Send push notification for ticket events
     */
    public function sendTicketNotification($tenantId, $ticket, $type = 'update')
    {
        $messages = [
            'created' => [
                'title' => '✅ Ticket Creado',
                'body' => "Tu ticket #{$ticket->id} fue creado exitosamente",
                'data' => [
                    'type' => 'ticket',
                    'screen' => '/tickets',
                    'ticketId' => (string)$ticket->id,
                    'action' => 'ticket_created'
                ]
            ],
            'assigned' => [
                'title' => '👨‍🔧 Técnico Asignado',
                'body' => "Se asignó un técnico a tu ticket #{$ticket->id}",
                'data' => [
                    'type' => 'ticket',
                    'screen' => '/tickets',
                    'ticketId' => (string)$ticket->id,
                    'action' => 'ticket_assigned'
                ]
            ],
            'status_updated' => [
                'title' => '📋 Ticket Actualizado',
                'body' => "Tu ticket #{$ticket->id} cambió de estado",
                'data' => [
                    'type' => 'ticket',
                    'screen' => '/tickets',
                    'ticketId' => (string)$ticket->id,
                    'action' => 'ticket_updated'
                ]
            ],
            'message' => [
                'title' => '💬 Nueva Respuesta',
                'body' => "Recibiste una nueva respuesta en tu ticket #{$ticket->id}",
                'data' => [
                    'type' => 'ticket',
                    'screen' => '/tickets',
                    'ticketId' => (string)$ticket->id,
                    'action' => 'ticket_message'
                ]
            ],
            'completed' => [
                'title' => '🎉 Ticket Completado',
                'body' => "Tu ticket #{$ticket->id} ha sido completado",
                'data' => [
                    'type' => 'ticket',
                    'screen' => '/tickets',
                    'ticketId' => (string)$ticket->id,
                    'action' => 'ticket_completed'
                ]
            ]
        ];

        $message = $messages[$type] ?? $messages['status_updated'];
        
        return $this->sendPushToTenant($tenantId, $message);
    }
}