<?php

require_once 'vendor/autoload.php';

use App\Models\Appointment;

// Simular ambiente Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔄 RESETTING APPOINTMENT STATUS\n";
echo "===============================\n\n";

// Find a no_show appointment with ticket
$appointment = Appointment::whereNotNull('ticket_id')
    ->where('status', 'no_show')
    ->with(['ticket'])
    ->first();

if (!$appointment) {
    echo "❌ No no_show appointment found.\n";
    exit;
}

echo "📋 Found Appointment:\n";
echo "   ID: {$appointment->id}\n";
echo "   Current Status: {$appointment->status}\n";
echo "   Ticket: {$appointment->ticket_id} - " . ($appointment->ticket ? $appointment->ticket->title : 'N/A') . "\n\n";

// Reset to scheduled
$appointment->status = 'scheduled';
$appointment->no_show_reason = null;
$appointment->no_show_description = null;
$appointment->marked_no_show_at = null;
$appointment->marked_no_show_by = null;
$appointment->save();

echo "✅ Appointment reset to scheduled status!\n";
echo "   ID: {$appointment->id}\n";
echo "   New Status: {$appointment->status}\n\n";

echo "🔧 Now run: php test_existing_appointment.php\n";

?>