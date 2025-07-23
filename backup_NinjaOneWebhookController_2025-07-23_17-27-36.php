<?php

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
     * TEMPORARY: NO SIGNATURE VALIDATION
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        try {
            // Log incoming webhook for debugging
            Log::info('NinjaOne webhook received (NO SIGNATURE VALIDATION)', [
                'headers' => $request->headers->all(),
                'body' => $request->all()
            ]);

            // Validate required webhook data
            $validator = Validator::make($request->all(), [
                'eventType' => 'required|string',
                'data' => 'required|array',
            ]);

            if ($validator->fails()) {
                return response()->json(['error' => 'Invalid webhook data'], 400);
            }

            $eventType = $request->input('eventType');
            $data = $request->input('data');

            // Process webhook based on event type
            switch ($eventType) {
                case 'alert.created':
                case 'alert.updated':
                    return $this->handleAlertEvent($data);
                
                case 'device.online':
                case 'device.offline':
                    return $this->handleDeviceStatusEvent($data);
                
                case 'alert.resolved':
                    return $this->handleAlertResolved($data);
                
                default:
                    Log::info('Unhandled NinjaOne event type', ['eventType' => $eventType]);
                    return response()->json(['message' => 'Event type not handled'], 200);
            }

        } catch (Exception $e) {
            Log::error('Error processing NinjaOne webhook', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    protected function handleAlertEvent(array $data): JsonResponse
    {
        try {
            $alertId = $data['alert']['id'] ?? null;
            $deviceId = $data['device']['id'] ?? null;
            $deviceName = $data['device']['name'] ?? $data['device']['displayName'] ?? null;
            $alertType = $data['alert']['type'] ?? 'unknown';
            $severity = $data['alert']['severity'] ?? 'medium';
            $title = $data['alert']['title'] ?? 'NinjaOne Alert';
            $description = $data['alert']['description'] ?? '';
            $createdAt = $data['alert']['createdAt'] ?? now();

            if (!$alertId || (!$deviceId && !$deviceName)) {
                return response()->json(['error' => 'Missing required alert data'], 400);
            }

            // Find device by name
            $device = null;
            if ($deviceName) {
                $device = Device::findByName($deviceName);
            }
            
            if (!$device && $deviceId) {
                $device = Device::where('ninjaone_device_id', $deviceId)
                               ->where('ninjaone_enabled', true)
                               ->first();
            }

            if (!$device) {
                Log::warning('Device not found for NinjaOne alert', [
                    'device_name' => $deviceName,
                    'ninjaone_device_id' => $deviceId,
                    'alert_id' => $alertId
                ]);
                
                return response()->json([
                    'message' => 'Device not found', 
                    'device_name' => $deviceName
                ], 404);
            }

            // Auto-enable NinjaOne for this device
            if (!$device->ninjaone_enabled) {
                $device->update([
                    'ninjaone_enabled' => true,
                    'ninjaone_device_id' => $deviceId,
                ]);
            }

            // Create alert
            $alert = NinjaOneAlert::updateOrCreate(
                ['ninjaone_alert_id' => $alertId],
                [
                    'ninjaone_device_id' => $deviceId ?? $device->ninjaone_device_id,
                    'device_id' => $device->id,
                    'alert_type' => $alertType,
                    'severity' => $severity,
                    'title' => $title,
                    'description' => $description,
                    'metadata' => $data,
                    'ninjaone_created_at' => $createdAt,
                ]
            );

            // Send notification
            $this->notificationService->sendNinjaOneAlertNotification($alert);

            Log::info('NinjaOne alert processed successfully', [
                'alert_id' => $alertId,
                'device_id' => $device->id,
                'device_name' => $device->name
            ]);

            return response()->json([
                'message' => 'Alert processed successfully',
                'alert_id' => $alert->id,
                'device_name' => $device->name
            ]);

        } catch (Exception $e) {
            Log::error('Error processing NinjaOne alert', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);

            return response()->json(['error' => 'Failed to process alert'], 500);
        }
    }

    protected function handleDeviceStatusEvent(array $data): JsonResponse
    {
        return response()->json(['message' => 'Device status updated']);
    }

    protected function handleAlertResolved(array $data): JsonResponse
    {
        return response()->json(['message' => 'Alert resolved']);
    }
}
