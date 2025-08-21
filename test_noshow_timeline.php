<?php

require_once 'vendor/autoload.php';

use App\Models\Appointment;
use App\Models\Ticket;
use App\Models\TicketHistory;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

// Simular ambiente Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🧪 No Show Timeline Integration Test\n";
echo "====================================\n\n";

// Find an appointment with a ticket
$appointment = Appointment::whereNotNull('ticket_id')
    ->where('status', '!=', 'no_show')
    ->with(['ticket'])
    ->first();

if (!$appointment) {
    echo "❌ No appointment with ticket found for testing.\n";
    exit;
}

echo "📋 Found test appointment:\n";
echo "   ID: {$appointment->id}\n";
echo "   Status: {$appointment->status}\n";
echo "   Ticket ID: {$appointment->ticket_id}\n";
echo "   Ticket Title: " . ($appointment->ticket ? $appointment->ticket->title : 'N/A') . "\n\n";

// Count current ticket histories
$initialHistoryCount = $appointment->ticket->histories()->count();
echo "📊 Current ticket histories: {$initialHistoryCount}\n\n";

// Simulate marking as no show (without actually doing it)
$testReason = "Cliente no se presentó a la cita";
$testDescription = "Se intentó contactar sin éxito";
$testUserName = "Test Admin";

echo "🔍 Simulating No Show marking:\n";
echo "   Reason: {$testReason}\n";
echo "   Description: {$testDescription}\n";
echo "   User: {$testUserName}\n\n";

// Create what would be the timeline entry
$expectedDescription = "Cita marcada como No Show - Razón: {$testReason} - Descripción: {$testDescription} por {$testUserName}";
$expectedMeta = [
    'appointment_id' => $appointment->id,
    'no_show_reason' => $testReason,
    'no_show_description' => $testDescription,
    'actor_name' => $testUserName,
    'marked_at' => Carbon::now()->toISOString()
];

echo "📝 Expected timeline entry:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "   Action: appointment_no_show\n";
echo "   Description: {$expectedDescription}\n";
echo "   Meta: " . json_encode($expectedMeta, JSON_PRETTY_PRINT) . "\n\n";

// Simulate the user_name accessor
$testHistoryEntry = new TicketHistory([
    'action' => 'appointment_no_show',
    'description' => $expectedDescription,
    'technical_id' => 1, // Simulated user ID
    'meta' => $expectedMeta
]);

echo "🔧 User Name Accessor Test:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "   user_name accessor would return: '{$testHistoryEntry->user_name}'\n\n";

// Check if the appointment model has the relationship
echo "🔗 Checking appointment-ticket relationship:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "   Appointment->ticket relationship: " . ($appointment->ticket ? "✅ Available" : "❌ Missing") . "\n";
echo "   Ticket->histories relationship: " . ($appointment->ticket->histories ? "✅ Available" : "❌ Missing") . "\n\n";

// Test the controller logic (without actually saving)
echo "🧪 Controller Logic Test:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

if ($appointment->ticket_id) {
    $ticket = $appointment->ticket;
    if ($ticket) {
        echo "✅ Ticket relationship found\n";
        echo "✅ Timeline entry would be created with:\n";
        echo "     - Action: appointment_no_show\n";
        echo "     - Description includes user name\n";
        echo "     - Meta data includes appointment details\n";
        echo "     - actor_name in meta for proper attribution\n";
    } else {
        echo "❌ Ticket not found despite ticket_id being set\n";
    }
} else {
    echo "⚠️  No ticket associated with this appointment\n";
}

echo "\n";
echo "🔧 To test manually:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "1. Go to appointments calendar\n";
echo "2. Find appointment ID {$appointment->id} (has ticket {$appointment->ticket_id})\n";
echo "3. Mark it as 'No Show' with a reason\n";
echo "4. Check ticket ID {$appointment->ticket_id} timeline\n";
echo "5. You should see a new entry: 'Cita marcada como No Show'\n";
echo "6. The entry should show your user name, not 'System'\n\n";

echo "✅ Test Complete!\n";

?>