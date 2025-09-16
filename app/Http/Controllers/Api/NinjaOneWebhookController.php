<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\NinjaOneAlert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NinjaOneWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $timestamp = now()->format('Y-m-d H:i:s');
        
        Log::info("=== NINJAONE WEBHOOK RECIBIDO [{$timestamp}] ===", [
            "timestamp" => $timestamp,
            "method" => $request->method(),
            "ip" => $request->ip(),
            "user_agent" => $request->userAgent(),
            "headers" => $request->headers->all(),
            "body" => $request->all(),
            "raw_body" => $request->getContent()
        ]);

        try {
            $payload = $request->all();
            
            if (empty($payload)) {
                Log::warning("❌ WEBHOOK: Payload vacío recibido");
                return response()->json(["error" => "Empty payload"], 400);
            }

            Log::info("🔄 WEBHOOK: Iniciando procesamiento de alerta...", [
                'payload_keys' => array_keys($payload)
            ]);

            // Procesar alerta
            $result = $this->handleAlertEvent($payload);
            
            Log::info("✅ WEBHOOK: Resultado del procesamiento:", $result);
            
            return response()->json($result, 200);

        } catch (\Exception $e) {
            Log::error("❌ WEBHOOK: Error en procesamiento: " . $e->getMessage(), [
                "exception" => $e->getMessage(),
                "file" => $e->getFile(),
                "line" => $e->getLine(),
                "trace" => $e->getTraceAsString()
            ]);
            
            return response()->json([
                "error" => "Internal server error",
                "message" => $e->getMessage()
            ], 500);
        }
    }

    private function handleAlertEvent(array $data)
    {
        Log::info("🔍 Procesando evento de alerta:", $data);

        // Extraer información del dispositivo - múltiples formatos posibles
        $deviceName = null;
        
        // Formato 1: device_name directo (tests locales)
        if (isset($data["device_name"])) {
            $deviceName = $data["device_name"];
        }
        // Formato 2: Estructura anidada de NinjaOne real
        elseif (isset($data["data"]["device"]["name"])) {
            $deviceName = $data["data"]["device"]["name"];
        }
        // Formato 3: Otros formatos posibles
        elseif (isset($data["deviceName"])) {
            $deviceName = $data["deviceName"];
        }
        elseif (isset($data["hostname"])) {
            $deviceName = $data["hostname"];
        }
        
        if (!$deviceName) {
            Log::warning("❌ No se encontró nombre del dispositivo en el payload", [
                "payload_keys" => array_keys($data),
                "data_keys" => isset($data["data"]) ? array_keys($data["data"]) : null
            ]);
            return [
                "status" => "error",
                "message" => "Device name not found in payload"
            ];
        }

        Log::info("🔍 Buscando dispositivo: " . $deviceName);

        // Buscar dispositivo en la base de datos
        $device = Device::findByName($deviceName);
        
        if (!$device) {
            Log::warning("❌ Dispositivo no encontrado en la base de datos: " . $deviceName);
            return [
                "status" => "error", 
                "message" => "Device not found: " . $deviceName
            ];
        }

        Log::info("✅ Dispositivo encontrado:", [
            "id" => $device->id,
            "name" => $device->name,
            "ninjaone_enabled" => $device->ninjaone_enabled
        ]);

        if (!$device->ninjaone_enabled) {
            Log::warning("⚠️ NinjaOne deshabilitado para este dispositivo");
            return [
                "status" => "skipped",
                "message" => "NinjaOne disabled for this device"
            ];
        }

        // Crear/actualizar alerta en la base de datos - extraer datos del formato correcto
        $alertData = $data["data"]["alert"] ?? $data; // NinjaOne format vs test format
        
        $ninjaoneAlertId = $alertData["id"] ?? "webhook_alert_" . time() . "_" . $device->id;
        
        Log::info("🔄 Creando/actualizando alerta:", [
            'ninjaone_alert_id' => $ninjaoneAlertId,
            'device_id' => $device->id,
            'title' => $alertData["title"] ?? ($alertData["message"] ?? "Alert from NinjaOne")
        ]);
        
        $alert = NinjaOneAlert::updateOrCreate(
            [
                'ninjaone_alert_id' => $ninjaoneAlertId,
                'device_id' => $device->id,
            ],
            [
                "alert_type" => $alertData["type"] ?? $alertData["alert_type"] ?? "unknown",
                "severity" => $alertData["severity"] ?? "warning", 
                "title" => $alertData["title"] ?? ($alertData["message"] ?? "Alert from NinjaOne"),
                "description" => $alertData["description"] ?? ($alertData["message"] ?? "Alert from NinjaOne device: " . $deviceName),
                "raw_data" => $data, // Store the full original payload
                "status" => "open"
            ]
        );

        Log::info("✅ Alerta creada exitosamente:", [
            "alert_id" => $alert->id,
            "device_id" => $device->id,
            "title" => $alert->title,
            "description" => $alert->description
        ]);

        // 🚀 NUEVO: Enviar notificaciones móviles automáticamente
        $this->sendMobileNotifications($alert, $device);

        return [
            "status" => "success",
            "message" => "Alert processed successfully",
            "alert_id" => $alert->id,
            "device_id" => $device->id
        ];
    }

    /**
     * Send mobile notifications for NinjaOne alert
     */
    private function sendMobileNotifications($alert, $device)
    {
        try {
            Log::info("📱 Enviando notificaciones móviles para alerta:", [
                'alert_id' => $alert->id,
                'device_id' => $device->id,
                'severity' => $alert->severity
            ]);

            // Obtener usuarios que deben recibir la notificación
            $users = $this->getDeviceUsers($device);
            
            if ($users->isEmpty()) {
                Log::warning("No se encontraron usuarios para el dispositivo", [
                    'device_id' => $device->id
                ]);
                return;
            }

            // Crear notificación para cada usuario
            foreach ($users as $user) {
                $this->createMobileNotification($user, $alert, $device);
            }

            Log::info("✅ Notificaciones móviles enviadas", [
                'alert_id' => $alert->id,
                'users_count' => $users->count()
            ]);

        } catch (\Exception $e) {
            Log::error("❌ Error enviando notificaciones móviles:", [
                'alert_id' => $alert->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get users that should receive notifications for this device
     */
    private function getDeviceUsers($device)
    {
        // Obtener usuarios relacionados con el dispositivo a través de tenants
        $users = collect();

        // Método 1: A través de tenants del dispositivo
        if (method_exists($device, 'tenants')) {
            $tenants = $device->tenants()->get();
            foreach ($tenants as $tenant) {
                if ($tenant->user) {
                    $users->push($tenant->user);
                }
            }
        }

        // Método 2: Si no hay tenants, usar usuarios con rol member
        if ($users->isEmpty()) {
            $users = \App\Models\User::whereHas('roles', function($query) {
                $query->where('name', 'member');
            })->get();
        }

        return $users->unique('id');
    }

    /**
     * Create mobile notification for user
     */
    private function createMobileNotification($user, $alert, $device)
    {
        try {
            // Determinar el tipo de alerta y configurar colores/iconos
            $config = $this->getAlertConfig($alert->severity, $alert->alert_type);

            // Crear notificación en base de datos
            $notification = $user->notifications()->create([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => 'App\\Notifications\\NinjaOneAlertNotification',
                'data' => [
                    'title' => "🚨 {$config['title']} - {$device->name}",
                    'message' => $alert->title,
                    'description' => $alert->description,
                    'alert_id' => $alert->id,
                    'device_id' => $device->id,
                    'device_name' => $device->name,
                    'severity' => $alert->severity,
                    'alert_type' => $alert->alert_type,
                    'icon' => $config['icon'],
                    'color' => $config['color'],
                    'action_url' => "/ninjaone-alerts/{$alert->id}",
                    'created_at' => now()->toISOString()
                ]
            ]);

            // Enviar push notification en tiempo real usando Pusher
            $this->sendPushNotification($user->id, $notification);

            Log::info("✅ Notificación móvil creada", [
                'user_id' => $user->id,
                'alert_id' => $alert->id,
                'notification_id' => $notification->id
            ]);

        } catch (\Exception $e) {
            Log::error("❌ Error creando notificación móvil", [
                'user_id' => $user->id,
                'alert_id' => $alert->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get alert configuration (colors, icons, titles)
     */
    private function getAlertConfig($severity, $alertType)
    {
        $configs = [
            'critical' => [
                'title' => 'ALERTA CRÍTICA',
                'icon' => 'alert-triangle',
                'color' => 'red'
            ],
            'warning' => [
                'title' => 'Advertencia',
                'icon' => 'alert-circle',
                'color' => 'yellow'
            ],
            'info' => [
                'title' => 'Información',
                'icon' => 'info',
                'color' => 'blue'
            ]
        ];

        return $configs[$severity] ?? $configs['warning'];
    }

    /**
     * Send push notification via Pusher
     */
    private function sendPushNotification($userId, $notification)
    {
        try {
            $pusher = new \Pusher\Pusher(
                config('broadcasting.connections.pusher.key'),
                config('broadcasting.connections.pusher.secret'),
                config('broadcasting.connections.pusher.app_id'),
                config('broadcasting.connections.pusher.options')
            );

            $result = $pusher->trigger(
                'notifications-public.' . $userId,
                'notification.created',
                [
                    'notification' => $notification->data,
                    'notification_id' => $notification->id,
                    'user_id' => $userId,
                    'timestamp' => now()->toISOString(),
                    'type' => 'ninjaone_alert'
                ]
            );

            Log::info("✅ Push notification enviada via Pusher", [
                'user_id' => $userId,
                'notification_id' => $notification->id,
                'pusher_result' => $result
            ]);

        } catch (\Exception $e) {
            Log::error("❌ Error enviando push notification", [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }
}