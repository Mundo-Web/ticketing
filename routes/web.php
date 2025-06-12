


<?php

use App\Http\Controllers\ApartmentController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\TechnicalController;
use App\Http\Controllers\TicketController;
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
    Route::post('tickets/{ticket}/update-status', [TicketController::class, 'updateStatus'])->name('tickets.updateStatus');
    Route::get('tickets/assign-unassigned', [TicketController::class, 'assignUnassigned'])->name('tickets.assign-unassigned');
    Route::post('tickets/{ticket}/assign-technical', [TicketController::class, 'assignToTechnical'])->name('tickets.assign-technical');


    Route::get('/apartment/member/{id}/devices', [ApartmentController::class, 'apartmentMemberDevice'])
    ->name('apartment.member.devices');



    Route::resource('buildings', BuildingController::class);
    Route::put('buildings/{building}/update-status', [BuildingController::class, 'updateStatus'])->name('buildings.update-status');
    Route::get('buildings/{building}/apartments', [BuildingController::class, 'apartments'])->name('buildings.apartments');
    Route::post('/buildings/{building}/apartments', [ApartmentController::class, 'storeApartment'])->name('buildings.apartments.store');
    Route::post('/buildings/{building}/apartments/bulk-upload', [ApartmentController::class, 'bulkUpload'])->name('buildings.apartments.bulk-upload');

    Route::resource('technicals', TechnicalController::class);
    Route::put('technicals/{technical}/update-status', [TechnicalController::class, 'updateStatus'])
        ->name('technicals.update-status');
    Route::put('technicals/{technical}/set-default', [TechnicalController::class, 'setDefault'])
        ->name('technicals.set-default');



    Route::post('/devices/{device}/share', [DeviceController::class, 'share'])
        ->name('devices.share');
        
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
    
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
