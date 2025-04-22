<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\TicketController;
use App\Models\Support;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

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

    Route::resource('supports', SupportController::class);
    Route::resource('tickets', TicketController::class);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
