<?php

use App\Models\Appointment;
use App\Models\Technical;
use Carbon\Carbon;

echo "=== DEBUGGING APPOINTMENT FILTERING ISSUE ===\n\n";

// Mostrar información de fechas y horas actuales
echo "Current DateTime: " . Carbon::now()->format('Y-m-d H:i:s') . "\n";
echo "Current Date: " . Carbon::today()->format('Y-m-d') . "\n";
echo "Today Start: " . Carbon::today()->startOfDay()->format('Y-m-d H:i:s') . "\n";
echo "Today End: " . Carbon::today()->endOfDay()->format('Y-m-d H:i:s') . "\n";
echo "Tomorrow: " . Carbon::tomorrow()->format('Y-m-d H:i:s') . "\n\n";

// Buscar appointments de hoy específicamente
echo "=== APPOINTMENTS FOR TODAY (2025-08-10) ===\n";
$todayAppointments = Appointment::whereDate('scheduled_for', '2025-08-10')->get();
echo "Found {$todayAppointments->count()} appointments for today:\n\n";

foreach ($todayAppointments as $apt) {
    echo "ID: {$apt->id}\n";
    echo "Title: {$apt->title}\n";
    echo "Scheduled: {$apt->scheduled_for}\n";
    echo "Status: {$apt->status}\n";
    echo "Technical ID: {$apt->technical_id}\n";
    
    // Verificar si cumple los criterios del filtro
    $scheduledTime = Carbon::parse($apt->scheduled_for);
    $isAfterTodayStart = $scheduledTime->gte(Carbon::today()->startOfDay());
    $isNotCancelled = $apt->status !== 'cancelled';
    
    echo "Is after today start: " . ($isAfterTodayStart ? 'YES' : 'NO') . "\n";
    echo "Is not cancelled: " . ($isNotCancelled ? 'YES' : 'NO') . "\n";
    echo "Should appear in list: " . ($isAfterTodayStart && $isNotCancelled ? 'YES' : 'NO') . "\n";
    echo "---\n\n";
}

// Buscar appointments con el filtro actual
echo "=== TESTING CURRENT FILTER ===\n";
echo "Filter: scheduled_for >= " . Carbon::today()->startOfDay()->format('Y-m-d H:i:s') . " AND status != 'cancelled'\n\n";

$filteredAppointments = Appointment::where('scheduled_for', '>=', Carbon::today()->startOfDay())
    ->where('status', '!=', 'cancelled')
    ->orderBy('scheduled_for')
    ->get();

echo "Found {$filteredAppointments->count()} appointments with current filter:\n\n";

foreach ($filteredAppointments as $apt) {
    $scheduledTime = Carbon::parse($apt->scheduled_for);
    echo "ID: {$apt->id}\n";
    echo "Title: {$apt->title}\n";
    echo "Scheduled: {$apt->scheduled_for}\n";
    echo "Status: {$apt->status}\n";
    echo "Technical ID: {$apt->technical_id}\n";
    echo "Is today: " . ($scheduledTime->isToday() ? 'YES' : 'NO') . "\n";
    echo "Is tomorrow: " . ($scheduledTime->isTomorrow() ? 'YES' : 'NO') . "\n";
    echo "---\n\n";
}

// Buscar appointments específicamente a las 11:59 de hoy
echo "=== SEARCHING FOR 11:59 APPOINTMENT ===\n";
$elevenFiftyNineAppointments = Appointment::where('scheduled_for', 'LIKE', '2025-08-10 11:59%')->get();
echo "Found {$elevenFiftyNineAppointments->count()} appointments at 11:59 today:\n\n";

foreach ($elevenFiftyNineAppointments as $apt) {
    echo "ID: {$apt->id}\n";
    echo "Title: {$apt->title}\n";
    echo "Scheduled: {$apt->scheduled_for}\n";
    echo "Status: {$apt->status}\n";
    echo "Technical ID: {$apt->technical_id}\n";
    
    // Verificar el filtro paso a paso
    $scheduledTime = Carbon::parse($apt->scheduled_for);
    $todayStart = Carbon::today()->startOfDay();
    
    echo "Scheduled time: " . $scheduledTime->format('Y-m-d H:i:s') . "\n";
    echo "Today start: " . $todayStart->format('Y-m-d H:i:s') . "\n";
    echo "Is scheduled >= today start: " . ($scheduledTime->gte($todayStart) ? 'YES' : 'NO') . "\n";
    echo "Status check (not cancelled): " . ($apt->status !== 'cancelled' ? 'YES' : 'NO') . "\n";
    echo "---\n\n";
}

echo "=== DEBUGGING COMPLETE ===\n";
