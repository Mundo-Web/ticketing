<?php

use App\Http\Controllers\Api\TechnicalController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\NinjaOneWebhookController;
use App\Http\Controllers\Api\WebhookTestController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NinjaOneController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Tickets API endpoint - using web middleware for session-based auth
Route::middleware(['web', 'auth'])->get('/tickets', [\App\Http\Controllers\TicketController::class, 'apiTickets']);

// Technical-specific tickets API
Route::middleware(['web', 'auth'])->get('/technical-tickets', [\App\Http\Controllers\TicketController::class, 'apiTechnicalTickets']);

// Send message to technician API
Route::middleware(['web', 'auth'])->post('/tickets/{ticket}/send-message-to-technical', [\App\Http\Controllers\TicketController::class, 'sendMessageToTechnical']);

// Tenant Authentication Routes (Public)
Route::prefix('tenant')->group(function () {
    Route::post('/login', [TenantController::class, 'login']);
});

// Protected Tenant API Routes
Route::middleware(['auth:sanctum', 'tenant'])->prefix('tenant')->group(function () {
    Route::post('/logout', [TenantController::class, 'logout']);
    Route::get('/me', [TenantController::class, 'me']);
    Route::get('/devices', [TenantController::class, 'devices']);
    Route::get('/tickets', [TenantController::class, 'tickets']);
    Route::get('/tickets/{ticket}', [TenantController::class, 'ticketDetail']);
    Route::post('/tickets', [TenantController::class, 'createTicket']);
    Route::post('/tickets/android', [TenantController::class, 'createTicketAndroid']);
    Route::get('/apartment', [TenantController::class, 'apartment']);
    Route::get('/building', [TenantController::class, 'building']);
    Route::get('/doormen', [TenantController::class, 'doormen']);
    Route::get('/owner', [TenantController::class, 'owner']);
    
    // Password management routes
    Route::post('/change-password', [TenantController::class, 'changePassword']);
    Route::post('/reset-password-request', [TenantController::class, 'resetPasswordRequest']);
    
    // Mobile notifications routes
    Route::get('/notifications', [TenantController::class, 'notifications']);
    Route::post('/notifications/{notification}/read', [TenantController::class, 'markNotificationAsRead']);
    Route::post('/notifications/mark-all-read', [TenantController::class, 'markAllNotificationsAsRead']);
});

// Notification routes
Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
    Route::get('/settings', [NotificationController::class, 'getSettings']);
    Route::put('/settings', [NotificationController::class, 'updateSettings']);
});

// Notification routes for web auth (session-based)
Route::middleware(['web', 'auth'])->prefix('notifications')->group(function () {
    Route::get('/api', [NotificationController::class, 'index']);
    Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
});

// Test notification route
Route::post('/send-test-notification', function (Illuminate\Http\Request $request) {
    $userId = $request->input('user_id', 183);
    
    // Create notification data (without saving to DB for now)
    $notificationData = [
        'id' => rand(1000, 9999),
        'user_id' => $userId,
        'title' => 'Direct Test Notification',
        'message' => 'This is a direct test from API route at ' . now(),
        'type' => 'test',
        'is_read' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ];
    
    // Método 1: Laravel Broadcasting (el que no funciona)
    try {
        $event = new \App\Events\NotificationCreated($notificationData, $userId);
        broadcast($event)->toOthers();
        \Illuminate\Support\Facades\Log::info('✅ Laravel Broadcasting sent');
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('❌ Laravel Broadcasting failed: ' . $e->getMessage());
    }
    
    // Método 2: Pusher directo (el que SÍ funciona)
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
                'notification' => $notificationData,
                'user_id' => $userId,
                'timestamp' => now()
            ]
        );
        
        \Illuminate\Support\Facades\Log::info('✅ Direct Pusher sent', ['result' => $result]);
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('❌ Direct Pusher failed: ' . $e->getMessage());
    }
    
    \Illuminate\Support\Facades\Log::info('🚨 API Manual notification sent', [
        'notification_data' => $notificationData,
        'user_id' => $userId,
        'event_dispatched' => true
    ]);
    
    return response()->json([
        'success' => true,
        'notification' => $notificationData,
        'message' => 'Test notification sent via API (both methods)'
    ]);
});

// Technical API routes
Route::get('/technicals', [TechnicalController::class, 'index']);
Route::get('/technicals/{technical}/tickets', [TechnicalController::class, 'getTickets']);
Route::get('/tickets/{ticket}/detail', [TechnicalController::class, 'getTicketDetail']);

// Tenants API routes for admin/technical
Route::get('/tenants/all', [TenantController::class, 'getAllTenants']);

// Building API routes
Route::get('/buildings', [BuildingController::class, 'apiIndex']);

// NinjaOne Webhook Routes (No authentication required for webhooks)
Route::prefix('ninjaone')->group(function () {
    Route::post('/webhook', [NinjaOneWebhookController::class, 'handle']);
    Route::any('/webhook-test', [WebhookTestController::class, 'test']); // Endpoint de prueba
});

// NinjaOne API routes (authenticated with web session)
Route::middleware(['web', 'auth'])->prefix('ninjaone')->group(function () {
    Route::get('/user-device-alerts', [NinjaOneController::class, 'getUserDeviceAlerts']);
    Route::get('/user-alerts', [\App\Http\Controllers\NinjaOneAlertsController::class, 'userDeviceAlerts']);
    Route::get('/devices/{deviceId}/alerts', [NinjaOneController::class, 'getDeviceAlertsApi']);
    Route::post('/create-ticket-from-alert', [NinjaOneController::class, 'createTicketFromDeviceAlert']);
    Route::post('/devices/{deviceId}/sync', [App\Http\Controllers\NinjaOneDevicesController::class, 'sync']);
    Route::post('/devices/refresh', [App\Http\Controllers\NinjaOneDevicesController::class, 'refresh']);
});

// NinjaOne Mobile API routes (for mobile app with Sanctum auth)
Route::middleware(['auth:sanctum'])->prefix('ninjaone')->group(function () {
    Route::get('/mobile-alerts', [\App\Http\Controllers\NinjaOneAlertsController::class, 'mobileAlerts']);
    Route::post('/alerts/{alert}/acknowledge', [\App\Http\Controllers\NinjaOneAlertsController::class, 'mobileAcknowledge']);
    Route::post('/alerts/{alert}/create-ticket', [\App\Http\Controllers\NinjaOneAlertsController::class, 'mobileCreateTicket']);
});

// NinjaOne Demo API routes (public for demonstration)
Route::prefix('ninjaone')->group(function () {
    Route::get('/test-connection', [App\Http\Controllers\NinjaOneDevicesController::class, 'testConnection']);
    Route::get('/demo/device-count', [App\Http\Controllers\NinjaOneDevicesController::class, 'getDemoDeviceCount']);
    Route::get('/demo/alerts-count', [App\Http\Controllers\NinjaOneDevicesController::class, 'getDemoAlertsCount']);
});
