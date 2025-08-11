<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Technical;
use App\Models\Appointment;
use Carbon\Carbon;

// Find the technical user with email tex@gmail.com
$user = User::where('email', 'tex@gmail.com')->first();

if (!$user) {
    echo "User with email tex@gmail.com not found\n";
    exit;
}

echo "=== USER DEBUG ===\n";
echo "User ID: " . $user->id . "\n";
echo "User Email: " . $user->email . "\n";
echo "User Roles: " . $user->roles->pluck('name')->join(', ') . "\n";

// Find the technical record
$technical = Technical::where('email', $user->email)->first();

if (!$technical) {
    echo "Technical record not found for this email\n";
    exit;
}

echo "\n=== TECHNICAL DEBUG ===\n";
echo "Technical ID: " . $technical->id . "\n";
echo "Technical Name: " . $technical->name . "\n";
echo "Technical Email: " . $technical->email . "\n";
echo "Is Default: " . ($technical->is_default ? 'Yes' : 'No') . "\n";

// Check all appointments
echo "\n=== ALL APPOINTMENTS ===\n";
$allAppointments = Appointment::with(['technical', 'ticket'])->get();
echo "Total appointments in system: " . $allAppointments->count() . "\n";

foreach ($allAppointments as $appointment) {
    echo "ID: {$appointment->id}, Technical: {$appointment->technical_id}, Scheduled: {$appointment->scheduled_for}, Status: {$appointment->status}\n";
}

// Check appointments for this technical
echo "\n=== APPOINTMENTS FOR THIS TECHNICAL ===\n";
$technicalAppointments = Appointment::where('technical_id', $technical->id)->get();
echo "Total appointments for technical: " . $technicalAppointments->count() . "\n";

foreach ($technicalAppointments as $appointment) {
    echo "ID: {$appointment->id}, Scheduled: {$appointment->scheduled_for}, Status: {$appointment->status}\n";
}

// Check upcoming appointments (like in controller)
echo "\n=== UPCOMING APPOINTMENTS (CONTROLLER LOGIC) ===\n";
$upcomingAppointments = Appointment::with([
    'ticket' => function($query) {
        $query->select('id', 'title', 'code', 'user_id', 'device_id');
    },
    'ticket.user' => function($query) {
        $query->select('id', 'name', 'email');
    },
    'ticket.device' => function($query) {
        $query->select('id', 'name');
    },
    'ticket.device.tenants' => function($query) {
        $query->select('tenants.id', 'tenants.apartment_id')->distinct();
    },
    'ticket.device.tenants.apartment' => function($query) {
        $query->select('id', 'buildings_id', 'name');
    },
    'ticket.device.tenants.apartment.building' => function($query) {
        $query->select('id', 'name', 'address', 'location_link');
    },
    'technical' => function($query) {
        $query->select('id', 'name', 'email');
    }
])
->where('technical_id', $technical->id)
->where('scheduled_for', '>=', Carbon::now())
->where('status', '!=', 'cancelled')
->orderBy('scheduled_for')
->limit(10)
->get();

echo "Upcoming appointments count: " . $upcomingAppointments->count() . "\n";

foreach ($upcomingAppointments as $appointment) {
    echo "ID: {$appointment->id}, Title: {$appointment->title}, Scheduled: {$appointment->scheduled_for}, Status: {$appointment->status}\n";
    echo "  Technical: {$appointment->technical->name} (ID: {$appointment->technical->id})\n";
}

// Check what date range we're looking at
echo "\n=== DATE RANGE DEBUG ===\n";
$now = Carbon::now();
echo "Current time: " . $now->toDateTimeString() . "\n";
echo "Looking for appointments >= " . $now->toDateTimeString() . "\n";

// Check next 3 days
$today = Carbon::today();
$threeDaysLater = $today->copy()->addDays(2)->endOfDay();
echo "Today: " . $today->toDateTimeString() . "\n";
echo "Three days later: " . $threeDaysLater->toDateTimeString() . "\n";

$next3DaysAppointments = Appointment::where('technical_id', $technical->id)
    ->whereBetween('scheduled_for', [$today, $threeDaysLater])
    ->where('status', '!=', 'cancelled')
    ->get();

echo "Appointments in next 3 days: " . $next3DaysAppointments->count() . "\n";

foreach ($next3DaysAppointments as $appointment) {
    echo "ID: {$appointment->id}, Scheduled: {$appointment->scheduled_for}, Status: {$appointment->status}\n";
}

echo "\n=== DEBUG COMPLETED ===\n";
