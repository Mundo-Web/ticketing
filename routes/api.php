<?php

use App\Http\Controllers\Api\TechnicalController;
use App\Http\Controllers\BuildingController;
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

// Technical API routes
Route::get('/technicals', [TechnicalController::class, 'index']);

// Building API routes
Route::get('/buildings', [BuildingController::class, 'apiIndex']);
