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
        Log::info("=== NINJAONE WEBHOOK RECIBIDO ===", [
            "timestamp" => now(),
            "method" => $request->method(),
            "headers" => $request->headers->all(),
            "body" => $request->all(),
            "raw_body" => $request->getContent()
        ]);

        try {
            // NOTA: Validación de firma HMAC deshabilitada temporalmente
            // debido a incompatibilidad con la configuración de NinjaOne
            
            $payload = $request->all();
            
            if (empty($payload)) {
                Log::warning("Webhook payload vacío");
                return response()->json(["error" => "Empty payload"], 400);
            }

            // Procesar alerta
            $result = $this->handleAlertEvent($payload);
            
            Log::info("Resultado del procesamiento:", $result);
            
            return response()->json($result, 200);

        } catch (\Exception $e) {
            Log::error("Error en webhook NinjaOne: " . $e->getMessage(), [
                "exception" => $e,
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

        // Crear alerta en la base de datos - extraer datos del formato correcto
        $alertData = $data["data"]["alert"] ?? $data; // NinjaOne format vs test format
        
        $alert = NinjaOneAlert::create([
            "ninjaone_alert_id" => $alertData["id"] ?? "alert_" . time() . "_" . $device->id,
            "device_id" => $device->id,
            "alert_type" => $alertData["type"] ?? $alertData["alert_type"] ?? "unknown",
            "severity" => $alertData["severity"] ?? "warning", 
            "title" => $alertData["title"] ?? ($alertData["message"] ?? "Alert from NinjaOne"),
            "description" => $alertData["description"] ?? ($alertData["message"] ?? "Alert from NinjaOne device: " . $deviceName),
            "raw_data" => $data, // Store the full original payload
            "status" => "open"
        ]);

        Log::info("✅ Alerta creada exitosamente:", [
            "alert_id" => $alert->id,
            "device_id" => $device->id,
            "title" => $alert->title,
            "description" => $alert->description
        ]);

        return [
            "status" => "success",
            "message" => "Alert processed successfully",
            "alert_id" => $alert->id,
            "device_id" => $device->id
        ];
    }
}