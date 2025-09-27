<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PushNotificationController extends Controller
{
    protected $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    /**
     * Register push token for authenticated tenant
     */
    public function registerToken(Request $request)
    {
        Log::info("📱 PUSH TOKEN REGISTRATION ATTEMPT", [
            'user_agent' => $request->header('User-Agent'),
            'ip' => $request->ip(),
            'request_data' => $request->all()
        ]);

        try {
            $validated = $request->validate([
                'push_token' => 'required|string',
                'platform' => 'required|in:ios,android',
                'device_name' => 'nullable|string|max:255',
                'device_type' => 'required|string|max:50',
                // NEW FCM FIELDS
                'token_type' => 'required|string|in:expo,fcm',
                'app_ownership' => 'nullable|string',
                'is_standalone' => 'nullable|boolean',
                'execution_environment' => 'nullable|string',
            ]);

            Log::info("✅ VALIDATION PASSED", [
                'validated_data' => $validated
            ]);

            $user = $request->user();
            
            // Verify user is tenant
            if (!$user || !$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Member role required.'
                ], 403);
            }

            $tenant = $user->tenant;
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant profile not found.'
                ], 404);
            }

            $result = $this->pushService->registerToken($tenant->id, $validated);

            Log::info("Push token registration attempt", [
                'tenant_id' => $tenant->id,
                'platform' => $validated['platform'],
                'device_type' => $validated['device_type'],
                'token_type' => $validated['token_type'],
                'is_standalone' => $validated['is_standalone'] ?? false,
                'success' => $result['success']
            ]);

            return response()->json($result, $result['success'] ? 200 : 500);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Push token registration error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to register push token'
            ], 500);
        }
    }

    /**
     * Remove push token
     */
    public function removeToken(Request $request)
    {
        try {
            $validated = $request->validate([
                'push_token' => 'required|string',
            ]);

            $user = $request->user();
            
            // Verify user is tenant
            if (!$user || !$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Member role required.'
                ], 403);
            }

            $result = $this->pushService->removeToken($validated['push_token']);

            Log::info("Push token removal attempt", [
                'user_id' => $user->id,
                'token_preview' => substr($validated['push_token'], 0, 20) . '...',
                'success' => $result['success']
            ]);

            return response()->json($result, $result['success'] ? 200 : 500);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Push token removal error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to remove push token'
            ], 500);
        }
    }

    /**
     * Send push notification manually (for testing or manual notifications)
     */
    public function sendPushNotification(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'body' => 'required|string|max:500',
                'data' => 'nullable|array',
                // NEW FIELDS FOR SINGLE TOKEN TESTING
                'token_type' => 'nullable|string|in:expo,fcm',
                'push_token' => 'nullable|string',
                'is_standalone' => 'nullable|boolean',
            ]);

            $user = $request->user();
            
            // Verify user is tenant
            if (!$user || !$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Member role required.'
                ], 403);
            }

            $tenant = $user->tenant;
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant profile not found.'
                ], 404);
            }

            // If specific token provided (for testing)
            if (!empty($validated['push_token']) && !empty($validated['token_type'])) {
                $result = $this->pushService->sendSingleNotification(
                    $validated['push_token'],
                    $validated['token_type'],
                    $validated['title'],
                    $validated['body'],
                    $validated['data'] ?? []
                );

                Log::info("Single push notification test sent", [
                    'tenant_id' => $tenant->id,
                    'token_type' => $validated['token_type'],
                    'title' => $validated['title'],
                    'success' => $result['success']
                ]);

                return response()->json($result, $result['success'] ? 200 : 500);
            }

            // Mass send to all tenant's devices
            $message = [
                'title' => $validated['title'],
                'body' => $validated['body'],
                'data' => $validated['data'] ?? []
            ];

            $result = $this->pushService->sendPushToTenant($tenant->id, $message);

            Log::info("Manual push notification sent", [
                'tenant_id' => $tenant->id,
                'title' => $validated['title'],
                'success' => $result['success'],
                'sent_to_devices' => $result['sent_to_devices']
            ]);

            return response()->json($result, $result['success'] ? 200 : 500);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Manual push notification error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send push notification'
            ], 500);
        }
    }

    /**
     * Get registered push tokens for current tenant (for debugging)
     */
    public function getTokens(Request $request)
    {
        try {
            $user = $request->user();
            
            // Verify user is tenant
            if (!$user || !$user->hasRole('member')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Member role required.'
                ], 403);
            }

            $tenant = $user->tenant;
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant profile not found.'
                ], 404);
            }

            $tokens = \App\Models\PushToken::forTenant($tenant->id)
                ->active()
                ->select('id', 'platform', 'device_name', 'device_type', 'token_type', 'app_ownership', 'is_standalone', 'created_at')
                ->get();

            return response()->json([
                'success' => true,
                'tokens' => $tokens,
                'total_devices' => $tokens->count(),
                'expo_tokens' => $tokens->where('token_type', 'expo')->count(),
                'fcm_tokens' => $tokens->where('token_type', 'fcm')->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('Get push tokens error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get push tokens'
            ], 500);
        }
    }
}
