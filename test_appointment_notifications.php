<?php

use Illuminate\Foundation\Application;
use Illuminate\Contracts\Console\Kernel;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

echo "=== TESTING APPOINTMENT NOTIFICATIONS ===" . PHP_EOL;

// Buscar un ticket con técnico
$ticket = \App\Models\Ticket::whereNotNull('technical_id')
    ->with(['technical', 'device.name_device'])
    ->first();

if (!$ticket) {
    echo "No tickets with technical found" . PHP_EOL;
    exit;
}

$technical = $ticket->technical;
echo "Ticket: {$ticket->code}, Technical: {$technical->name}" . PHP_EOL;

// Crear una nueva cita
$appointment = \App\Models\Appointment::create([
    'ticket_id' => $ticket->id,
    'technical_id' => $technical->id,
    'scheduled_by' => 1, // Usuario admin
    'title' => 'Test Appointment Notification',
    'description' => 'Testing appointment notifications with full data',
    'scheduled_for' => now()->addDays(1),
    'estimated_duration' => 120,
    'notes' => 'These are important test notes for the appointment',
    'member_instructions' => 'Please be ready at the scheduled time'
]);

echo "Appointment created with ID: {$appointment->id}" . PHP_EOL;

// Despachar notificaciones
try {
    $service = new \App\Services\NotificationDispatcherService();
    $service->dispatchAppointmentCreated($appointment);
    echo "Notifications dispatched successfully!" . PHP_EOL;
} catch (Exception $e) {
    echo "Error dispatching notifications: " . $e->getMessage() . PHP_EOL;
    echo "Stack trace: " . $e->getTraceAsString() . PHP_EOL;
}

// Ver las últimas notificaciones
echo PHP_EOL . "=== ÚLTIMAS NOTIFICACIONES ===" . PHP_EOL;
$notifications = \Illuminate\Notifications\DatabaseNotification::latest()->take(3)->get();

foreach ($notifications as $notification) {
    $data = is_array($notification->data) ? $notification->data : json_decode($notification->data, true);
    echo "ID: {$notification->id}" . PHP_EOL;
    echo "Type: " . ($data['type'] ?? 'null') . PHP_EOL;
    echo "Technical ID: " . ($data['technical_id'] ?? 'null') . PHP_EOL;
    echo "Technical Name: " . ($data['technical_name'] ?? 'null') . PHP_EOL;
    echo "Appointment Title: " . ($data['appointment_title'] ?? 'null') . PHP_EOL;
    echo "Created By: " . ($data['created_by'] ?? 'null') . PHP_EOL;
    echo "Message: " . ($data['message'] ?? 'null') . PHP_EOL;
    echo "---" . PHP_EOL;
}