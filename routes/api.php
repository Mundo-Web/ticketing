<?php

use App\Http\Controllers\Api\TechnicalController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\NinjaOneWebhookController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\NotificationController;
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
    Route::get('/apartment', [TenantController::class, 'apartment']);
    Route::get('/building', [TenantController::class, 'building']);
    Route::get('/doormen', [TenantController::class, 'doormen']);
    Route::get('/owner', [TenantController::class, 'owner']);
    
    // Password management routes
    Route::post('/change-password', [TenantController::class, 'changePassword']);
    Route::post('/reset-password-request', [TenantController::class, 'resetPasswordRequest']);
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
    Route::post('/webhook', [NinjaOneWebhookController::class, 'handleWebhook']);
});
