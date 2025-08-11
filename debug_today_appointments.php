<?php

// Load Laravel app for debugging
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Appointment;
use App\Models\Technical;
use Carbon\Carbon;

// Set debug mode
DB::enableQueryLog();

echo "Debugging why today's appointments aren't showing\n";
echo "Current time: " . Carbon::now()->format('Y-m-d H:i:s') . "\n";
echo "Today's start of day: " . Carbon::today()->startOfDay()->format('Y-m-d H:i:s') . "\n\n";

// Check all appointments for today
echo "All appointments in the system:\n";
$allAppointments = Appointment::orderBy('scheduled_for')->get();
echo "Total appointments: " . $allAppointments->count() . "\n\n";

foreach ($allAppointments as $appointment) {
    $scheduledDate = Carbon::parse($appointment->scheduled_for);
    $isToday = $scheduledDate->isToday();
    $isAfterTodayStart = $scheduledDate->gte(Carbon::today()->startOfDay());
    
    echo "ID: {$appointment->id}, Title: {$appointment->title}\n";
    echo "  Technical ID: {$appointment->technical_id}\n";
    echo "  Scheduled for: {$appointment->scheduled_for} (" . $scheduledDate->format('Y-m-d H:i:s') . ")\n";
    echo "  Status: {$appointment->status}\n";
    echo "  Is Today: " . ($isToday ? 'Yes' : 'No') . "\n";
    echo "  Is After Today Start: " . ($isAfterTodayStart ? 'Yes' : 'No') . "\n";
    echo "  Raw comparison: scheduled_for >= " . Carbon::today()->startOfDay()->format('Y-m-d H:i:s') . " : " . 
        ($scheduledDate->gte(Carbon::today()->startOfDay()) ? 'TRUE' : 'FALSE') . "\n";
    echo "  ---------------------------------------------------\n";
}

// Check database format
echo "\nChecking database storage format:\n";
$rawAppointments = DB::table('appointments')->select('id', 'scheduled_for')->orderBy('id')->get();
foreach ($rawAppointments as $apt) {
    echo "ID: {$apt->id}, Raw scheduled_for: '{$apt->scheduled_for}' (Type: " . gettype($apt->scheduled_for) . ")\n";
}

// Check timezone settings
echo "\nTimezone settings:\n";
echo "PHP Default Timezone: " . date_default_timezone_get() . "\n";
echo "Laravel/Carbon Timezone: " . config('app.timezone') . "\n";
echo "Current Server Date: " . date('Y-m-d H:i:s') . "\n";

// Try different comparison methods
echo "\nTesting different appointment queries:\n";

// Standard whereDate test
echo "\nTesting Carbon::today() filter with whereDate:\n";
$todayAppointments = Appointment::whereDate('scheduled_for', Carbon::today())->get();
echo "Appointments with whereDate('scheduled_for', Carbon::today()): " . $todayAppointments->count() . "\n";
foreach ($todayAppointments as $apt) {
    echo "  ID: {$apt->id}, Title: {$apt->title}, Scheduled for: {$apt->scheduled_for}\n";
}

// Carbon::today()->startOfDay() test
echo "\nTesting new filter: scheduled_for >= Carbon::today()->startOfDay()\n";
$upcomingAppointments = Appointment::where('scheduled_for', '>=', Carbon::today()->startOfDay())
    ->orderBy('scheduled_for')
    ->get();
echo "Appointments with where('scheduled_for', '>=', Carbon::today()->startOfDay()): " . $upcomingAppointments->count() . "\n";
foreach ($upcomingAppointments as $apt) {
    echo "  ID: {$apt->id}, Title: {$apt->title}, Scheduled for: {$apt->scheduled_for}\n";
}

// Raw SQL test
echo "\nTesting with raw SQL comparison:\n";
$rawSqlAppointments = DB::select("SELECT id, title, scheduled_for FROM appointments WHERE DATE(scheduled_for) = ? ORDER BY scheduled_for", [Carbon::today()->format('Y-m-d')]);
echo "Appointments with raw SQL DATE comparison: " . count($rawSqlAppointments) . "\n";
foreach ($rawSqlAppointments as $apt) {
    echo "  ID: {$apt->id}, Title: {$apt->title}, Scheduled for: {$apt->scheduled_for}\n";
}

// Show executed queries
echo "\nExecuted queries:\n";
foreach (DB::getQueryLog() as $idx => $query) {
    echo "Query " . ($idx + 1) . ": " . $query['query'] . "\n";
    echo "  Bindings: " . implode(', ', array_map(function($binding) {
        return is_object($binding) ? get_class($binding) . '::' . $binding : (string) $binding;
    }, $query['bindings'])) . "\n";
    echo "  Time: " . $query['time'] . "ms\n\n";
}
