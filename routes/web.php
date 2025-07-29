<?php

use App\Http\Controllers\ApartmentController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\TechnicalController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\NinjaOneController;
use App\Models\Support;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;



Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

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
    Route::post('tickets/{ticket}/add-history', [TicketController::class, 'addHistory'])->name('tickets.addHistory');
    Route::post('tickets/{ticket}/add-member-feedback', [TicketController::class, 'addMemberFeedback'])->name('tickets.addMemberFeedback');
    Route::post('tickets/{ticket}/update-status', [TicketController::class, 'updateStatus'])->name('tickets.updateStatus');
    Route::get('tickets/assign-unassigned', [TicketController::class, 'assignUnassigned'])->name('tickets.assign-unassigned');

    // Appointment Routes
    Route::get('appointments', [\App\Http\Controllers\AppointmentController::class, 'index'])->name('appointments.index');
    Route::get('appointments/{appointment}', [\App\Http\Controllers\AppointmentController::class, 'show'])->name('appointments.show');
    Route::post('appointments', [\App\Http\Controllers\AppointmentController::class, 'store'])->name('appointments.store');
    Route::put('appointments/{appointment}', [\App\Http\Controllers\AppointmentController::class, 'update'])->name('appointments.update');
    Route::post('appointments/{appointment}/start', [\App\Http\Controllers\AppointmentController::class, 'start'])->name('appointments.start');
    Route::post('appointments/{appointment}/complete', [\App\Http\Controllers\AppointmentController::class, 'complete'])->name('appointments.complete');
    Route::post('appointments/{appointment}/member-feedback', [\App\Http\Controllers\AppointmentController::class, 'memberFeedback'])->name('appointments.member-feedback');
    Route::post('appointments/{appointment}/cancel', [\App\Http\Controllers\AppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::post('appointments/{appointment}/reschedule', [\App\Http\Controllers\AppointmentController::class, 'reschedule'])->name('appointments.reschedule');
    Route::get('technicals/{technical}/availability', [\App\Http\Controllers\AppointmentController::class, 'getTechnicalAvailability'])->name('technicals.availability');


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

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
