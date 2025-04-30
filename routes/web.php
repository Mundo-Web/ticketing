<?php

use App\Http\Controllers\ApartmentController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\TicketController;
use App\Models\Support;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;



Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

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
    Route::resource('tickets', TicketController::class);




    Route::resource('buildings', BuildingController::class);
    Route::put('buildings/{building}/update-status', [BuildingController::class, 'updateStatus'])->name('buildings.update-status');
    Route::get('buildings/{building}/apartments', [BuildingController::class, 'apartments'])->name('buildings.apartments');
    Route::post('/buildings/{building}/apartments', [ApartmentController::class, 'storeApartment'])->name('buildings.apartments.store');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
