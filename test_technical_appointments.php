<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use App\Models\Technical;
use App\Models\Appointment;
use Illuminate\Support\Facades\Log;

// Simular una solicitud de dashboard para un técnico no predeterminado
echo "Testing Technical Appointments Filtering...\n\n";

// Buscar un técnico no predeterminado
$technical = Technical::where('is_default', false)->first();

if (!$technical) {
    echo "No non-default technical found. Please create one for testing.\n";
    exit;
}

echo "Testing with Technical: {$technical->name} (ID: {$technical->id}, is_default: " . ($technical->is_default ? 'true' : 'false') . ")\n\n";

// Buscar appointments asignados a este técnico
$appointments = Appointment::with([
    'ticket' => function($query) {
        $query->select('id', 'title', 'code', 'user_id', 'device_id');
    },
    'ticket.user' => function($query) {
        $query->select('id', 'name', 'email');
    },
    'technical' => function($query) {
        $query->select('id', 'name', 'email');
    }
])
->where('technical_id', $technical->id)
->where('status', '!=', 'cancelled')
->orderBy('scheduled_for')
->get();

echo "Found {$appointments->count()} appointments for this technical:\n";

foreach ($appointments as $appointment) {
    $isToday = \Carbon\Carbon::parse($appointment->scheduled_for)->isToday();
    echo "- ID: {$appointment->id}\n";
    echo "  Title: {$appointment->title}\n";
    echo "  Scheduled: {$appointment->scheduled_for}\n";
    echo "  Technical: {$appointment->technical->name}\n";
    echo "  Status: {$appointment->status}\n";
    echo "  Is Today: " . ($isToday ? 'YES' : 'NO') . "\n";
    echo "  Member: " . ($appointment->ticket->user->name ?? 'N/A') . "\n";
    echo "\n";
}

// Verificar appointments de hoy
$todayAppointments = $appointments->filter(function($appointment) {
    return \Carbon\Carbon::parse($appointment->scheduled_for)->isToday();
});

echo "Appointments for TODAY: {$todayAppointments->count()}\n";
foreach ($todayAppointments as $appointment) {
    echo "- {$appointment->title} at {$appointment->scheduled_for}\n";
}

echo "\nTest completed.\n";
