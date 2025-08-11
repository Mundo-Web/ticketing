<?php

use App\Models\Appointment;
use App\Models\Technical;
use Carbon\Carbon;

echo "Testing Today's Appointments Filtering...\n\n";

// Mostrar la fecha actual
echo "Current date and time: " . Carbon::now()->format('Y-m-d H:i:s') . "\n";
echo "Today start of day: " . Carbon::today()->startOfDay()->format('Y-m-d H:i:s') . "\n";
echo "Today end of day: " . Carbon::today()->endOfDay()->format('Y-m-d H:i:s') . "\n\n";

// Buscar appointments de hoy
$todayAppointments = Appointment::whereDate('scheduled_for', Carbon::today())->get();
echo "Total appointments for today: " . $todayAppointments->count() . "\n\n";

foreach ($todayAppointments as $appointment) {
    echo "- ID: {$appointment->id}\n";
    echo "  Title: {$appointment->title}\n";
    echo "  Scheduled: {$appointment->scheduled_for}\n";
    echo "  Technical ID: {$appointment->technical_id}\n";
    echo "  Status: {$appointment->status}\n";
    echo "\n";
}

// Buscar appointments con el nuevo filtro
echo "Testing new filter: scheduled_for >= Carbon::today()->startOfDay()\n";
$upcomingAppointments = Appointment::where('scheduled_for', '>=', Carbon::today()->startOfDay())
    ->where('status', '!=', 'cancelled')
    ->orderBy('scheduled_for')
    ->limit(5)
    ->get();

echo "Found {$upcomingAppointments->count()} upcoming appointments:\n\n";

foreach ($upcomingAppointments as $appointment) {
    echo "- ID: {$appointment->id}\n";
    echo "  Title: {$appointment->title}\n";
    echo "  Scheduled: {$appointment->scheduled_for}\n";
    echo "  Is today: " . (Carbon::parse($appointment->scheduled_for)->isToday() ? 'YES' : 'NO') . "\n";
    echo "\n";
}

echo "Test completed.\n";
