<?php

require_once 'vendor/autoload.php';

use App\Models\Appointment;
use App\Models\Ticket;
use App\Models\Technical;
use Carbon\Carbon;

// Simular ambiente Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🛠️ CREATING TEST APPOINTMENT\n";
echo "============================\n\n";

// Find a ticket
$ticket = Ticket::first();
if (!$ticket) {
    echo "❌ No ticket found.\n";
    exit;
}

// Find a technical
$technical = Technical::first();
if (!$technical) {
    echo "❌ No technical found.\n";
    exit;
}

echo "📋 Using:\n";
echo "   Ticket: {$ticket->id} - {$ticket->title}\n";
echo "   Technical: {$technical->id} - {$technical->name}\n\n";

// Create a test appointment
$appointment = Appointment::create([
    'ticket_id' => $ticket->id,
    'technical_id' => $technical->id,
    'status' => 'scheduled',
    'start_time' => Carbon::now()->addHours(2),
    'end_time' => Carbon::now()->addHours(3),
    'description' => 'Test appointment for no-show timeline testing',
    'priority' => 'medium',
    'scheduled_by' => 1,
    'scheduled_date' => Carbon::now()->addHours(2)->toDateString(),
    'scheduled_time' => Carbon::now()->addHours(2)->toTimeString(),
]);

echo "✅ Test appointment created:\n";
echo "   ID: {$appointment->id}\n";
echo "   Status: {$appointment->status}\n";
echo "   Ticket ID: {$appointment->ticket_id}\n";
echo "   Technical ID: {$appointment->technical_id}\n\n";

echo "🔧 Now run: php FORCE_NO_SHOW_FIX.php\n";

?>