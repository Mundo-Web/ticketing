<?php

use App\Http\Controllers\ApartmentController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\DoormanController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\TechnicalController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\NinjaOneController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AuditLogController;
use App\Models\Support;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Http\Request;
use Inertia\Inertia;

// Broadcasting authentication routes (must be outside auth middleware group)
Broadcast::routes(['middleware' => ['web', 'auth']]);

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('dashboard/mark-instruction-read', [DashboardController::class, 'markInstructionAsRead'])->name('dashboard.mark-instruction-read');

    // Notification routes (web-based)
    Route::get('/notifications/api', [NotificationController::class, 'apiNotifications']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    
    // Audit Logs routes (Super Admin only)
    Route::prefix('audit-logs')->name('audit-logs.')->middleware('role:super-admin')->group(function () {
        Route::get('/', [AuditLogController::class, 'index'])->name('index');
        Route::get('/{auditLog}', [AuditLogController::class, 'show'])->name('show');
        Route::get('/api/logs', [AuditLogController::class, 'api'])->name('api');
        Route::get('/export/csv', [AuditLogController::class, 'export'])->name('export');
        Route::get('/stats/dashboard', [AuditLogController::class, 'stats'])->name('stats');
        Route::delete('/cleanup/old', [AuditLogController::class, 'cleanup'])->name('cleanup');
    });
    
    // Debug route - quitar en producción
    Route::get('/debug-user', function() {
        $user = Auth::user();
        return response()->json([
            'authenticated' => Auth::check(),
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles,
            ] : null,
            'notifications_count' => $user ? $user->notifications()->count() : 0,
            'unread_count' => $user ? $user->unreadNotifications()->count() : 0,
        ]);
    });

    // Test logging route
    Route::get('/test-log', function() {
        Log::info('Test log message working');
        return 'Log test complete. Check logs.';
    });

    // Test notification route
    Route::get('/test-notification-page', function() {
        return view('test-notification');
    });
    
    // Pusher debug page
    Route::get('/pusher-debug', function() {
        return view('pusher-debug');
    });
    
    // Ruta GET simple para enviar notificación (sin CSRF)
    Route::get('/direct-pusher-test', function () {
    return view('direct-pusher-test');
});

Route::get('/test-send-notification-simple', function () {
        $user = Auth::user();
        
        if (!$user) {
            return '<h1>❌ Not authenticated</h1><p><a href="/login">Login first</a></p>';
        }
        
        $notification = \Illuminate\Notifications\DatabaseNotification::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => 'App\Notifications\TicketNotification',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => $user->id,
            'data' => [
                'title' => 'Simple Test Notification',
                'message' => 'This notification was sent via GET at ' . now()->format('H:i:s') . ' for user ' . $user->id,
                'type' => 'test',
                'color' => 'blue',
                'ticket_code' => 'GET-' . time(),
                'priority' => 'high'
            ],
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Emit socket event
        event(new \App\Events\NotificationCreated($notification, $user->id));
        
        \Illuminate\Support\Facades\Log::info('Manual notification sent', [
            'user_id' => $user->id,
            'notification_id' => $notification->id
        ]);
        
        return '<h1>✅ Notification sent!</h1><p>User ID: ' . $user->id . '</p><p>Notification ID: ' . $notification->id . '</p><p><a href="/dashboard">Go to Dashboard</a></p>';
    });
    
    Route::post('/test-send-notification', function() {
        $user = Auth::user();
        
        $notification = \Illuminate\Notifications\DatabaseNotification::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => 'App\Notifications\TicketNotification',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id' => $user->id,
            'data' => [
                'title' => 'Manual Test Notification',
                'message' => 'This notification was sent manually at ' . now()->format('H:i:s'),
                'type' => 'test',
                'color' => 'green',
                'ticket_code' => 'MANUAL-' . time(),
                'priority' => 'high'
            ],
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Emit socket event
        event(new \App\Events\NotificationCreated($notification, $user->id));
        
        return response()->json([
            'success' => true,
            'notification_id' => $notification->id,
            'message' => 'Notification sent successfully!'
        ]);
    });

    // Test upload route - simple version
    Route::post('/test-upload', function(Request $request) {
        Log::info('Test upload called', [
            'has_file' => $request->hasFile('evidence'),
            'all_files' => $request->allFiles(),
            'all_input' => $request->all(),
            'headers' => $request->headers->all()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Test upload received',
            'has_file' => $request->hasFile('evidence'),
            'files' => $request->allFiles()
        ]);
    });

    // Test private note route
    Route::post('/test-private-note', function(Request $request) {
        Log::info('Test private note called', [
            'all_input' => $request->all(),
            'user_id' => Auth::id(),
            'headers' => $request->headers->all()
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Test private note received',
            'data' => $request->all()
        ]);
    });

    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
    Route::put('/customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
    Route::put('/customers/{customer}/update-status', [CustomerController::class, 'updateStatus'])
        ->name('customers.update-status');
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
    Route::get('customers/{customer}/apartments', [CustomerController::class, 'apartments'])->name('customers.apartments');
    //Route::post('/customers/{customer}/apartments', [ApartmentController::class, 'storeApartment'])->name('customers.apartments.store');
    Route::put('/apartments/{apartment}', [ApartmentController::class, 'updateApartment'])->name('apartments.update');
    Route::put('/apartments/{apartment}/update-status', [ApartmentController::class, 'updateStatus'])
        ->name('apartments.update-status');
    Route::delete('/apartments/{apartment}', [ApartmentController::class, 'destroy'])->name('apartments.destroy');
    Route::resource('devices', DeviceController::class);
    Route::delete('/devices/{device}', [DeviceController::class, 'destroy'])->name('devices.destroy');





    Route::resource('supports', SupportController::class);
    // Tickets: solo index, store, update, destroy (no create/edit/show)
    Route::get('tickets', [TicketController::class, 'index'])->name('tickets.index');
    Route::post('tickets', [TicketController::class, 'store'])->name('tickets.store');
    Route::get('tickets/{ticket}', [TicketController::class, 'show'])->name('tickets.show');
    Route::put('tickets/{ticket}', [TicketController::class, 'update'])->name('tickets.update');
    Route::delete('tickets/{ticket}', [TicketController::class, 'destroy'])->name('tickets.destroy');
    // Nuevas rutas para historial, asignación de técnico y cambio de estado (Kanban)
    Route::post('tickets/{ticket}/assign-technical', [TicketController::class, 'assignTechnical'])->name('tickets.assignTechnical');
    Route::post('tickets/{ticket}/unassign', [TicketController::class, 'unassignTechnical'])->name('tickets.unassign');
    Route::post('tickets/{ticket}/unassign', [TicketController::class, 'unassignTechnical'])->name('tickets.unassign');
    Route::post('tickets/{ticket}/add-history', [TicketController::class, 'addHistory'])->name('tickets.addHistory');
    Route::post('tickets/{ticket}/add-member-feedback', [TicketController::class, 'addMemberFeedback'])->name('tickets.addMemberFeedback');
    Route::post('tickets/{ticket}/update-status', [TicketController::class, 'updateStatus'])->name('tickets.updateStatus');
    Route::post('tickets/{ticket}/upload-evidence', [TicketController::class, 'uploadEvidence'])->name('tickets.uploadEvidence');
    Route::post('tickets/{ticket}/add-private-note', [TicketController::class, 'addPrivateNote'])->name('tickets.addPrivateNote');
    Route::post('tickets/{ticket}/send-message-to-technical', [TicketController::class, 'sendMessageToTechnical'])->name('tickets.sendMessageToTechnical');
    Route::get('tickets/assign-unassigned', [TicketController::class, 'assignUnassigned'])->name('tickets.assign-unassigned');

    // Appointment Routes
    Route::get('appointments', [\App\Http\Controllers\AppointmentController::class, 'index'])->name('appointments.index');
    Route::get('appointments/{appointment}', [\App\Http\Controllers\AppointmentController::class, 'show'])->name('appointments.show');
    Route::get('appointments/{id}/details', [\App\Http\Controllers\AppointmentController::class, 'getDetails'])->name('appointments.details');
    Route::post('appointments', [\App\Http\Controllers\AppointmentController::class, 'store'])->name('appointments.store');
    Route::put('appointments/{appointment}', [\App\Http\Controllers\AppointmentController::class, 'update'])->name('appointments.update');
    Route::post('appointments/{appointment}/start', [\App\Http\Controllers\AppointmentController::class, 'start'])->name('appointments.start');
    Route::post('appointments/{appointment}/complete', [\App\Http\Controllers\AppointmentController::class, 'complete'])->name('appointments.complete');
    Route::post('appointments/{appointment}/member-feedback', [\App\Http\Controllers\AppointmentController::class, 'memberFeedback'])->name('appointments.member-feedback');
    Route::post('appointments/{appointment}/cancel', [\App\Http\Controllers\AppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::post('appointments/{appointment}/reschedule', [\App\Http\Controllers\AppointmentController::class, 'reschedule'])->name('appointments.reschedule');
    Route::post('appointments/{appointment}/no-show', [\App\Http\Controllers\AppointmentController::class, 'noShow'])->name('appointments.no-show');
    Route::get('technicals/{technical}/availability', [\App\Http\Controllers\AppointmentController::class, 'getTechnicalAvailability'])->name('technicals.availability');
    
    // Ruta para verificar recordatorios automáticamente
    Route::get('appointments/check-reminders', function() {
        try {
            // Consultar todas las citas programadas para hoy y próximas
            $upcomingAppointments = \App\Models\Appointment::where('status', \App\Models\Appointment::STATUS_SCHEDULED)
                ->where('scheduled_for', '>=', \Carbon\Carbon::now())
                ->where('scheduled_for', '<=', \Carbon\Carbon::now()->addHours(2))
                ->get();

            $checkedCount = $upcomingAppointments->count();
            
            Log::info("🔍 Checked {$checkedCount} upcoming appointments for reminders");
            
            return response()->json([
                'success' => true,
                'checked_appointments' => $checkedCount,
                'timestamp' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            Log::error("Error checking appointment reminders: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    })->name('appointments.check-reminders');


    Route::get('/apartment/member/{id}/devices', [ApartmentController::class, 'apartmentMemberDevice'])
    ->name('apartment.member.devices');



    Route::resource('buildings', BuildingController::class);
    Route::put('buildings/{building}/update-status', [BuildingController::class, 'updateStatus'])->name('buildings.update-status');
    Route::get('buildings/{building}/apartments', [BuildingController::class, 'apartments'])->name('buildings.apartments');
    Route::post('/buildings/{building}/apartments', [ApartmentController::class, 'storeApartment'])->name('buildings.apartments.store');
    Route::post('/buildings/{building}/apartments/bulk-upload', [ApartmentController::class, 'bulkUpload'])->name('buildings.apartments.bulk-upload');
    Route::get('/tenants/{tenantId}/tickets', [BuildingController::class, 'tenantTickets'])->name('tenants.tickets');
    Route::put('buildings/{building}/owner', [BuildingController::class, 'updateOwner'])->name('buildings.update-owner');
    
    // Password reset routes for web interface
    Route::post('/tenants/{tenantId}/reset-password', [BuildingController::class, 'resetTenantPassword'])->name('tenants.reset-password');
    Route::post('/bulk-reset-passwords', [BuildingController::class, 'bulkResetPasswords'])->name('tenants.bulk-reset-passwords');
    Route::post('/apartments/{apartmentId}/reset-passwords', [BuildingController::class, 'resetApartmentPasswords'])->name('apartments.reset-passwords');
    Route::post('/buildings/{buildingId}/reset-passwords', [BuildingController::class, 'resetBuildingPasswords'])->name('buildings.reset-passwords');

    Route::resource('technicals', TechnicalController::class);
    Route::put('technicals/{technical}/update-status', [TechnicalController::class, 'updateStatus'])
        ->name('technicals.update-status');
    Route::put('technicals/{technical}/set-default', [TechnicalController::class, 'setDefault'])
        ->name('technicals.set-default');
    Route::put('technicals/{technical}/reset-password', [TechnicalController::class, 'resetPassword'])
        ->name('technicals.reset-password');
    Route::post('technicals/{technical}/send-instruction', [TechnicalController::class, 'sendInstruction'])
        ->name('technicals.send-instruction');

    // Chief Tech Routes - Protected by chief_tech middleware
    Route::prefix('chief-tech')->name('chief-tech.')->middleware('chief_tech')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\ChiefTechController::class, 'dashboard'])->name('dashboard');
        Route::post('/assign-ticket', [\App\Http\Controllers\ChiefTechController::class, 'assignTicket'])->name('assign-ticket');
        Route::post('/bulk-assign-tickets', [\App\Http\Controllers\ChiefTechController::class, 'bulkAssignTickets'])->name('bulk-assign-tickets');
        Route::get('/unassigned-tickets', [\App\Http\Controllers\ChiefTechController::class, 'getUnassignedTickets'])->name('unassigned-tickets');
        Route::get('/available-technicians', [\App\Http\Controllers\ChiefTechController::class, 'getAvailableTechnicians'])->name('available-technicians');
        Route::put('/technician/{technical}/status', [\App\Http\Controllers\ChiefTechController::class, 'updateTechnicianStatus'])->name('technician.status');
        Route::post('/technician/{technical}/instructions', [\App\Http\Controllers\ChiefTechController::class, 'sendInstructions'])->name('technician.instructions');
        Route::post('/schedule-appointment', [\App\Http\Controllers\ChiefTechController::class, 'scheduleAppointment'])->name('schedule-appointment');
        Route::get('/team-analytics', [\App\Http\Controllers\ChiefTechController::class, 'getTeamAnalytics'])->name('team-analytics');
    });



    Route::post('/devices/{device}/share', [DeviceController::class, 'share'])
        ->name('devices.share');
        
    Route::delete('/devices/{device}/remove-from-tenant', [DeviceController::class, 'removeFromTenant'])
        ->name('devices.removeFromTenant');
        
    // NinjaOne export routes
    Route::post('/devices/export/ninjaone', [DeviceController::class, 'exportNinjaOneDevices'])
        ->name('devices.export.ninjaone');
        
    Route::post('/devices/export/ninjaone/building', [DeviceController::class, 'exportNinjaOneDevicesByBuilding'])
        ->name('devices.export.ninjaone.building');
        
    Route::post('/devices/export/ninjaone/apartment', [DeviceController::class, 'exportNinjaOneDevicesByApartment'])
        ->name('devices.export.ninjaone.apartment');
        
    Route::delete('/delete/brand/{id}', [DeviceController::class, 'destroyBrand'])
        ->name('brands.destroy');

    Route::delete('/delete/model/{id}', [DeviceController::class, 'destroyModel'])
        ->name('models.destroy');

    Route::delete('/delete/system/{id}', [DeviceController::class, 'destroySystem'])
        ->name('systems.destroy');
    Route::delete('/delete/name_device/{id}', [DeviceController::class, 'destroyNameDevice'])
        ->name('name_devices.destroy');

    Route::put('/brands/{brand}', [DeviceController::class, 'updateBrand'])->name('brands.update');
    Route::put('/models/{model}', [DeviceController::class, 'updateModel'])->name('models.update');
    Route::put('/systems/{system}', [DeviceController::class, 'updateSystem'])->name('systems.update');
    Route::put('/name_devices/{name_device}', [DeviceController::class, 'updateNameDevice'])->name('name_devices.update');

    Route::get('technicals-list', [TicketController::class, 'technicalsList'])->name('tickets.technicalsList');
    
    // Rutas para owner y doorman para gestionar devices de members
    Route::get('/owner-doorman/devices', [\App\Http\Controllers\OwnerDoormanDeviceController::class, 'index'])
        ->name('owner-doorman.devices')
        ->middleware('role:owner|doorman');
    
    // Doorman-specific API routes
    Route::prefix('doorman')->name('doorman.')->middleware('role:doorman')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\DoormanController::class, 'dashboard'])->name('dashboard');
        Route::get('/residents', [\App\Http\Controllers\DoormanController::class, 'getResidents'])->name('residents');
        Route::get('/residents/search', [\App\Http\Controllers\DoormanController::class, 'searchResidents'])->name('residents.search');
        Route::post('/tickets/quick-create', [\App\Http\Controllers\DoormanController::class, 'createQuickTicket'])->name('tickets.quick-create');
        Route::get('/notifications/resolved', [\App\Http\Controllers\DoormanController::class, 'getResolvedTicketNotifications'])->name('notifications.resolved');
        Route::get('/building/stats', [\App\Http\Controllers\DoormanController::class, 'getBuildingStats'])->name('building.stats');
    });
    
    // NinjaOne Routes
    Route::prefix('ninjaone')->name('ninjaone.')->group(function () {
        Route::get('/demo', [App\Http\Controllers\NinjaOneDevicesController::class, 'demo'])->name('demo');
        Route::get('/devices', [App\Http\Controllers\NinjaOneDevicesController::class, 'index'])->name('devices.index');
        Route::get('/devices/{deviceId}', [App\Http\Controllers\NinjaOneDevicesController::class, 'show'])->name('devices.show');
        Route::get('/alerts', [NinjaOneController::class, 'alerts'])->name('alerts');
        Route::post('/alerts/{alert}/acknowledge', [NinjaOneController::class, 'acknowledgeAlert'])->name('alerts.acknowledge');
        Route::post('/alerts/{alert}/resolve', [NinjaOneController::class, 'resolveAlert'])->name('alerts.resolve');
        Route::post('/devices/{device}/sync', [NinjaOneController::class, 'syncDevice'])->name('devices.sync');
        Route::get('/devices/{device}/alerts', [NinjaOneController::class, 'getDeviceAlerts'])->name('devices.alerts');
    });
    
    // NinjaOne Alerts Management Routes
    Route::prefix('ninjaone-alerts')->name('ninjaone-alerts.')->group(function () {
        Route::get('/', [\App\Http\Controllers\NinjaOneAlertsController::class, 'index'])->name('index');
        Route::get('/{alert}', [\App\Http\Controllers\NinjaOneAlertsController::class, 'show'])->name('show');
        Route::post('/{alert}/acknowledge', [\App\Http\Controllers\NinjaOneAlertsController::class, 'acknowledge'])->name('acknowledge');
        Route::post('/{alert}/create-ticket', [\App\Http\Controllers\NinjaOneAlertsController::class, 'createTicket'])->name('create-ticket');
    });
    
    // Ticket creation from NinjaOne alerts
    Route::get('/tickets/create-from-alert/{alert}', [NinjaOneController::class, 'createTicketFromAlert'])->name('tickets.create-from-alert');
    Route::post('/tickets/create-from-alert/{alert}', [NinjaOneController::class, 'storeTicketFromAlert'])->name('tickets.store-from-alert');
    
});

// Temporal debug route
Route::get('/debug-appointments', function() {
    $now = \Carbon\Carbon::now();
    $todayStart = \Carbon\Carbon::today()->startOfDay();
    
    echo "<h2>Debug Appointments</h2>";
    echo "<p>Current time: " . $now->format('Y-m-d H:i:s') . "</p>";
    echo "<p>Today start: " . $todayStart->format('Y-m-d H:i:s') . "</p>";
    
    // Buscar appointments de hoy
    $todayAppointments = \App\Models\Appointment::whereDate('scheduled_for', '2025-08-10')->get();
    echo "<h3>Appointments for today (2025-08-10): " . $todayAppointments->count() . "</h3>";
    
    foreach ($todayAppointments as $apt) {
        $scheduledTime = \Carbon\Carbon::parse($apt->scheduled_for);
        $isAfterTodayStart = $scheduledTime->gte($todayStart);
        
        echo "<div style='border: 1px solid #ccc; margin: 10px; padding: 10px;'>";
        echo "<strong>ID:</strong> {$apt->id}<br>";
        echo "<strong>Title:</strong> {$apt->title}<br>";
        echo "<strong>Scheduled:</strong> {$apt->scheduled_for}<br>";
        echo "<strong>Status:</strong> {$apt->status}<br>";
        echo "<strong>Technical ID:</strong> {$apt->technical_id}<br>";
        echo "<strong>Is after today start:</strong> " . ($isAfterTodayStart ? 'YES' : 'NO') . "<br>";
        echo "<strong>Is not cancelled:</strong> " . ($apt->status !== 'cancelled' ? 'YES' : 'NO') . "<br>";
        echo "<strong>Should appear:</strong> " . ($isAfterTodayStart && $apt->status !== 'cancelled' ? 'YES' : 'NO') . "<br>";
        echo "</div>";
    }
    
    // Buscar con el filtro actual
    echo "<h3>With current filter (>= today start AND not cancelled):</h3>";
    $filteredAppointments = \App\Models\Appointment::where('scheduled_for', '>=', $todayStart)
        ->where('status', '!=', 'cancelled')
        ->orderBy('scheduled_for')
        ->get();
    
    echo "<p>Found: " . $filteredAppointments->count() . " appointments</p>";
    foreach ($filteredAppointments as $apt) {
        $scheduledTime = \Carbon\Carbon::parse($apt->scheduled_for);
        echo "<div style='border: 1px solid green; margin: 10px; padding: 10px;'>";
        echo "<strong>ID:</strong> {$apt->id}<br>";
        echo "<strong>Title:</strong> {$apt->title}<br>";
        echo "<strong>Scheduled:</strong> {$apt->scheduled_for}<br>";
        echo "<strong>Status:</strong> {$apt->status}<br>";
        echo "<strong>Technical ID:</strong> {$apt->technical_id}<br>";
        echo "<strong>Is today:</strong> " . ($scheduledTime->isToday() ? 'YES' : 'NO') . "<br>";
        echo "<strong>Is tomorrow:</strong> " . ($scheduledTime->isTomorrow() ? 'YES' : 'NO') . "<br>";
        echo "</div>";
    }
});

require __DIR__ . '/settings.php';

// Ruta temporal para probar recordatorios (sin autenticación)
Route::get('/test-appointment-reminders', function() {
    try {
        // Consultar todas las citas programadas para hoy y próximas
        $upcomingAppointments = \App\Models\Appointment::where('status', \App\Models\Appointment::STATUS_SCHEDULED)
            ->where('scheduled_for', '>=', \Carbon\Carbon::now())
            ->where('scheduled_for', '<=', \Carbon\Carbon::now()->addHours(2))
            ->get();

        $checkedCount = $upcomingAppointments->count();
        
        Log::info("🔍 Checked {$checkedCount} upcoming appointments for reminders");
        
        return response()->json([
            'success' => true,
            'checked_appointments' => $checkedCount,
            'appointments' => $upcomingAppointments->map(function($apt) {
                return [
                    'id' => $apt->id,
                    'title' => $apt->title,
                    'scheduled_for' => $apt->scheduled_for,
                    'status' => $apt->status,
                    'minutes_until' => \Carbon\Carbon::now()->diffInMinutes(\Carbon\Carbon::parse($apt->scheduled_for))
                ];
            }),
            'timestamp' => now()->toISOString()
        ]);
    } catch (\Exception $e) {
        Log::error("Error checking appointment reminders: " . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

require __DIR__.'/auth.php';
