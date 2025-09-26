<?php

namespace App\Services;

use App\Models\PushToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    /**
     * Send push notification to all devices of a tenant
     */
    public function sendPushToTenant($tenantId, $message)
    {
        try {
            // Get all active tokens for the tenant
            $tokens = PushToken::forTenant($tenantId)
                              ->active()
                              ->pluck('push_token')
                              ->toArray();

            if (empty($tokens)) {
                Log::info("No push tokens found for tenant: {$tenantId}");
                return [
                    'success' => false,
                    'message' => 'No active push tokens found',
                    'sent_to_devices' => 0
                ];
            }

            // Prepare messages for Expo
            $messages = [];
            foreach ($tokens as $token) {
                $messages[] = [
                    'to' => $token,
                    'title' => $message['title'],
                    'body' => $message['body'],
                    'data' => $message['data'] ?? [],
                    'sound' => 'default',
                    'priority' => 'high',
                    'channelId' => 'default',
                ];
            }

            // Send to Expo Push API
            $response = Http::timeout(30)->post('https://exp.host/--/api/v2/push/send', $messages);

            if ($response->successful()) {
                Log::info("Push notifications sent successfully", [
                    'tenant_id' => $tenantId,
                    'device_count' => count($tokens),
                    'title' => $message['title']
                ]);

                return [
                    'success' => true,
                    'message' => 'Push notifications sent successfully',
                    'sent_to_devices' => count($tokens)
                ];
            } else {
                Log::error('Expo Push API error', [
                    'tenant_id' => $tenantId,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);

                return [
                    'success' => false,
                    'message' => 'Failed to send push notifications',
                    'sent_to_devices' => 0
                ];
            }

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
     * Register a new push token for a tenant
     */
    public function registerToken($tenantId, $tokenData)
    {
        try {
            PushToken::updateOrCreate(
                ['push_token' => $tokenData['push_token']],
                [
                    'tenant_id' => $tenantId,
                    'platform' => $tokenData['platform'],
                    'device_name' => $tokenData['device_name'] ?? null,
                    'device_type' => $tokenData['device_type'],
                    'is_active' => true,
                ]
            );

            Log::info("Push token registered successfully", [
                'tenant_id' => $tenantId,
                'platform' => $tokenData['platform'],
                'device_type' => $tokenData['device_type']
            ]);

            return ['success' => true, 'message' => 'Push token registered successfully'];

        } catch (\Exception $e) {
            Log::error('Error registering push token', [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage()
            ]);

            return ['success' => false, 'message' => 'Failed to register push token'];
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
                    'ticketId' => $ticket->id
                ]
            ],
            'assigned' => [
                'title' => '👨‍🔧 Técnico Asignado',
                'body' => "Se asignó un técnico a tu ticket #{$ticket->id}",
                'data' => [
                    'type' => 'ticket',
                    'screen' => '/tickets',
                    'ticketId' => $ticket->id
                ]
            ],
            'status_updated' => [
                'title' => '📋 Ticket Actualizado',
                'body' => "Tu ticket #{$ticket->id} cambió de estado",
                'data' => [
                    'type' => 'ticket',
                    'screen' => '/tickets',
                    'ticketId' => $ticket->id
                ]
            ],
            'message' => [
                'title' => '💬 Nueva Respuesta',
                'body' => "Recibiste una nueva respuesta en tu ticket #{$ticket->id}",
                'data' => [
                    'type' => 'ticket',
                    'screen' => '/tickets',
                    'ticketId' => $ticket->id
                ]
            ],
            'completed' => [
                'title' => '🎉 Ticket Completado',
                'body' => "Tu ticket #{$ticket->id} ha sido completado",
                'data' => [
                    'type' => 'ticket',
                    'screen' => '/tickets',
                    'ticketId' => $ticket->id
                ]
            ]
        ];

        $message = $messages[$type] ?? $messages['update'];
        
        return $this->sendPushToTenant($tenantId, $message);
    }
}