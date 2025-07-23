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

        // Extraer información del dispositivo
        $deviceName = $data["device_name"] ?? $data["deviceName"] ?? $data["hostname"] ?? null;
        
        if (!$deviceName) {
            Log::warning("❌ No se encontró nombre del dispositivo en el payload");
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

        // Crear alerta en la base de datos
        $alert = NinjaOneAlert::create([
            "ninjaone_alert_id" => $data["id"] ?? "alert_" . time() . "_" . $device->id,
            "device_id" => $device->id,
            "alert_type" => $data["alert_type"] ?? "unknown",
            "severity" => $data["severity"] ?? "warning", 
            "title" => $data["title"] ?? ($data["message"] ?? "Alert from NinjaOne"),
            "description" => $data["description"] ?? ($data["message"] ?? "Alert from NinjaOne device: " . $deviceName),
            "raw_data" => $data,
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