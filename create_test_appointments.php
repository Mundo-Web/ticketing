<?php

use App\Models\Appointment;
use App\Models\Technical;
use App\Models\Ticket;
use Carbon\Carbon;

echo "Creating a test appointment for today...\n\n";

// Buscar un technical
$technical = Technical::first();
if (!$technical) {
    echo "No technical found. Please create one first.\n";
    return;
}

// Buscar un ticket
$ticket = Ticket::first();
if (!$ticket) {
    echo "No ticket found. Please create one first.\n";
    return;
}

// Crear appointment para hoy a las 2:00 PM
$todayAppointment = Appointment::create([
    'title' => 'Test Appointment for Today',
    'description' => 'This is a test appointment created for today to verify the filtering.',
    'scheduled_for' => Carbon::today()->setHour(14)->setMinute(0), // 2:00 PM today
    'estimated_duration' => 60,
    'address' => 'Test Address 123',
    'status' => 'scheduled',
    'technical_id' => $technical->id,
    'ticket_id' => $ticket->id,
]);

echo "Created appointment:\n";
echo "- ID: {$todayAppointment->id}\n";
echo "- Title: {$todayAppointment->title}\n";
echo "- Scheduled: {$todayAppointment->scheduled_for}\n";
echo "- Technical: {$technical->name}\n";
echo "- Status: {$todayAppointment->status}\n\n";

// Crear appointment para mañana
$tomorrowAppointment = Appointment::create([
    'title' => 'Test Appointment for Tomorrow',
    'description' => 'This is a test appointment created for tomorrow.',
    'scheduled_for' => Carbon::tomorrow()->setHour(10)->setMinute(0), // 10:00 AM tomorrow
    'estimated_duration' => 90,
    'address' => 'Test Address 456',
    'status' => 'scheduled',
    'technical_id' => $technical->id,
    'ticket_id' => $ticket->id,
]);

echo "Created appointment:\n";
echo "- ID: {$tomorrowAppointment->id}\n";
echo "- Title: {$tomorrowAppointment->title}\n";
echo "- Scheduled: {$tomorrowAppointment->scheduled_for}\n";
echo "- Technical: {$technical->name}\n";
echo "- Status: {$tomorrowAppointment->status}\n\n";

echo "Test appointments created successfully.\n";
echo "Now you can test the dashboard to see if today's appointments appear with red borders.\n";
