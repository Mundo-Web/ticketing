<?php
/**
 * SCRIPT PARA ACTUALIZAR EL CONTROLADOR EN PRODUCCIÓN
 * Ejecutar este archivo en el servidor de producción
 */

echo "🚀 ACTUALIZANDO CONTROLADOR NINJAONE EN PRODUCCIÓN\n";
echo "📍 Esto solucionará el problema 404 'Device not found'\n\n";

// Ruta del controlador
$controllerPath = 'app/Http/Controllers/Api/Ninja// Crear registro de actualización
file_put_contents('webhook_controller_updated.txt', date('Y-m-d H:i:s') . " - NinjaOne controller updated successfully
");neWebhookController.php';

// Verificar que el directorio existe
$directory = dirname($controllerPath);
if (!is_dir($directory)) {
    mkdir($directory, 0755, true);
    echo "✅ Directorio creado: $directory\n";
}

// Hacer backup del archivo actual
$backupPath = $controllerPath . '.backup.' . date('Y-m-d-H-i-s');
if (file_exists($controllerPath)) {
    copy($controllerPath, $backupPath);
    echo "✅ Backup creado: $backupPath\n";
}

// Contenido actualizado del controlador
$controllerContent = '<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\NinjaOneAlert;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Exception;

class NinjaOneWebhookController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle incoming webhook from NinjaOne
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        try {
            // Log incoming webhook for debugging
            Log::info(\'NinjaOne webhook received\', [
                \'headers\' => $request->headers->all(),
                \'body\' => $request->all()
            ]);

            // NO SIGNATURE VALIDATION - NinjaOne config doesn\'t support it
            
            // Validate required webhook data
            $validator = Validator::make($request->all(), [
                \'eventType\' => \'required|string\',
                \'data\' => \'required|array\',
            ]);

            if ($validator->fails()) {
                return response()->json([\'error\' => \'Invalid webhook data\'], 400);
            }

            $eventType = $request->input(\'eventType\');
            $data = $request->input(\'data\');

            // Process webhook based on event type
            switch ($eventType) {
                case \'alert.created\':
                case \'alert.updated\':
                    return $this->handleAlertEvent($data);
                
                case \'device.online\':
                case \'device.offline\':
                    return $this->handleDeviceStatusEvent($data);
                
                case \'alert.resolved\':
                    return $this->handleAlertResolved($data);
                
                default:
                    Log::info(\'Unhandled NinjaOne event type\', [\'eventType\' => $eventType]);
                    return response()->json([\'message\' => \'Event type not handled\'], 200);
            }

        } catch (Exception $e) {
            Log::error(\'Error processing NinjaOne webhook\', [
                \'error\' => $e->getMessage(),
                \'trace\' => $e->getTraceAsString()
            ]);

            return response()->json([\'error\' => \'Internal server error\'], 500);
        }
    }

    /**
     * Handle alert creation/update events
     */
    protected function handleAlertEvent(array $data): JsonResponse
    {
        try {
            // Extract alert information
            $alertId = $data[\'alert\'][\'id\'] ?? null;
            $deviceId = $data[\'device\'][\'id\'] ?? null;
            $deviceName = $data[\'device\'][\'name\'] ?? $data[\'device\'][\'displayName\'] ?? null;
            $alertType = $data[\'alert\'][\'type\'] ?? \'unknown\';
            $severity = $data[\'alert\'][\'severity\'] ?? \'medium\';
            $title = $data[\'alert\'][\'title\'] ?? \'NinjaOne Alert\';
            $description = $data[\'alert\'][\'description\'] ?? \'\';
            $createdAt = $data[\'alert\'][\'createdAt\'] ?? now();

            if (!$alertId || (!$deviceId && !$deviceName)) {
                return response()->json([\'error\' => \'Missing required alert data (alertId and deviceName or deviceId)\'], 400);
            }

            // Find the local device by name (primary method)
            $device = null;
            
            if ($deviceName) {
                Log::info(\'Searching for device by name\', [\'device_name\' => $deviceName]);
                $device = Device::findByName($deviceName);
                
                if ($device) {
                    Log::info(\'Device found by name matching\', [
                        \'searched_name\' => $deviceName,
                        \'found_device\' => $device->name,
                        \'device_id\' => $device->id
                    ]);
                }
            }
            
            // Fallback: try to find by ninjaone_device_id if provided and no name match
            if (!$device && $deviceId) {
                Log::info(\'Fallback: searching by NinjaOne device ID\', [\'ninjaone_device_id\' => $deviceId]);
                $device = Device::where(\'ninjaone_device_id\', $deviceId)
                               ->where(\'ninjaone_enabled\', true)
                               ->first();
            }

            if (!$device) {
                Log::warning(\'Device not found for NinjaOne alert\', [
                    \'device_name\' => $deviceName,
                    \'ninjaone_device_id\' => $deviceId,
                    \'alert_id\' => $alertId,
                    \'suggestion\' => \'Create device with exact name: \' . $deviceName
                ]);
                
                // Return helpful error with device name for manual verification
                return response()->json([
                    \'message\' => \'Device not found in system\', 
                    \'device_name\' => $deviceName,
                    \'device_id\' => $deviceId,
                    \'suggestion\' => \'Please create a device with name: \' . $deviceName
                ], 404);
            }

            // Auto-enable NinjaOne for this device if not already enabled
            if (!$device->ninjaone_enabled) {
                $device->update([
                    \'ninjaone_enabled\' => true,
                    \'ninjaone_device_id\' => $deviceId,
                ]);
                Log::info(\'Auto-enabled NinjaOne for device\', [
                    \'device_id\' => $device->id,
                    \'device_name\' => $device->name
                ]);
            }

            // Create or update alert
            $alert = NinjaOneAlert::updateOrCreate(
                [\'ninjaone_alert_id\' => $alertId],
                [
                    \'ninjaone_device_id\' => $deviceId ?? $device->ninjaone_device_id,
                    \'device_id\' => $device->id,
                    \'alert_type\' => $alertType,
                    \'severity\' => $severity,
                    \'title\' => $title,
                    \'description\' => $description,
                    \'metadata\' => $data,
                    \'ninjaone_created_at\' => $createdAt,
                ]
            );

            // Send notification to device owners
            $this->notificationService->sendNinjaOneAlertNotification($alert);

            Log::info(\'NinjaOne alert processed successfully\', [
                \'alert_id\' => $alertId,
                \'device_id\' => $device->id,
                \'device_name\' => $device->name,
                \'severity\' => $severity
            ]);

            return response()->json([
                \'message\' => \'Alert processed successfully\',
                \'alert_id\' => $alert->id,
                \'device_name\' => $device->name
            ]);

        } catch (Exception $e) {
            Log::error(\'Error processing NinjaOne alert\', [
                \'error\' => $e->getMessage(),
                \'data\' => $data
            ]);

            return response()->json([\'error\' => \'Failed to process alert\'], 500);
        }
    }

    /**
     * Handle device status events
     */
    protected function handleDeviceStatusEvent(array $data): JsonResponse
    {
        try {
            $deviceId = $data[\'device\'][\'id\'] ?? null;
            $status = $data[\'status\'] ?? \'unknown\';

            if (!$deviceId) {
                return response()->json([\'error\' => \'Missing device ID\'], 400);
            }

            // Update device last seen timestamp
            $device = Device::where(\'ninjaone_device_id\', $deviceId)
                           ->where(\'ninjaone_enabled\', true)
                           ->first();

            if ($device) {
                $device->update([
                    \'ninjaone_last_seen\' => now(),
                    \'ninjaone_metadata\' => array_merge(
                        $device->ninjaone_metadata ?? [],
                        [\'last_status\' => $status]
                    )
                ]);

                Log::info(\'Device status updated\', [
                    \'device_id\' => $device->id,
                    \'ninjaone_device_id\' => $deviceId,
                    \'status\' => $status
                ]);
            }

            return response()->json([\'message\' => \'Device status updated\']);

        } catch (Exception $e) {
            Log::error(\'Error processing device status event\', [
                \'error\' => $e->getMessage(),
                \'data\' => $data
            ]);

            return response()->json([\'error\' => \'Failed to process device status\'], 500);
        }
    }

    /**
     * Handle alert resolved events
     */
    protected function handleAlertResolved(array $data): JsonResponse
    {
        try {
            $alertId = $data[\'alert\'][\'id\'] ?? null;

            if (!$alertId) {
                return response()->json([\'error\' => \'Missing alert ID\'], 400);
            }

            $alert = NinjaOneAlert::where(\'ninjaone_alert_id\', $alertId)->first();

            if ($alert) {
                $alert->resolve();

                Log::info(\'NinjaOne alert resolved\', [
                    \'alert_id\' => $alert->id,
                    \'ninjaone_alert_id\' => $alertId
                ]);
            }

            return response()->json([\'message\' => \'Alert resolved\']);

        } catch (Exception $e) {
            Log::error(\'Error resolving NinjaOne alert\', [
                \'error\' => $e->getMessage(),
                \'data\' => $data
            ]);

            return response()->json([\'error\' => \'Failed to resolve alert\'], 500);
        }
    }
}
';

// Escribir el archivo actualizado
file_put_contents($controllerPath, $controllerContent);
echo "✅ Controlador actualizado exitosamente\n";

// Limpiar cache
echo "🔄 Limpiando cache...\n";
if (function_exists('exec')) {
    exec('php artisan config:clear 2>&1', $output1, $return1);
    exec('php artisan route:clear 2>&1', $output2, $return2);
    exec('php artisan cache:clear 2>&1', $output3, $return3);
    
    echo "   Config clear: " . ($return1 === 0 ? "✅" : "❌") . "\n";
    echo "   Route clear: " . ($return2 === 0 ? "✅" : "❌") . "\n";  
    echo "   Cache clear: " . ($return3 === 0 ? "✅" : "❌") . "\n";
} else {
    echo "   ⚠️ No se puede ejecutar artisan automáticamente\n";
}

echo "\n🎯 ACTUALIZACIÓN COMPLETADA\n";
echo "📋 Cambios aplicados:\n";
echo "   ✅ Removida validación de firma HMAC\n";
echo "   ✅ Mejorada búsqueda de dispositivos\n";
echo "   ✅ Agregado logging detallado\n";
echo "   ✅ Manejo de errores mejorado\n\n";

echo "🔄 PASOS MANUALES (si es necesario):\n";
echo "1. php artisan config:clear\n";
echo "2. php artisan route:clear\n";
echo "3. php artisan cache:clear\n";
echo "4. Reiniciar servidor web\n\n";

echo "✨ El webhook ahora debería funcionar correctamente con JULIOPC\n";

// Crear archivo de verificación
file_put_contents(\'webhook_controller_updated.txt\', date(\'Y-m-d H:i:s\') . " - NinjaOne controller updated successfully\n");
echo "📝 Verificación creada: webhook_controller_updated.txt\n";
