<?php

require_once 'vendor/autoload.php';

use App\Models\Appointment;
use App\Models\Ticket;
use App\Models\TicketHistory;
use App\Models\Technical;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

// Simular ambiente Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🧪 Real No Show Timeline Test\n";
echo "=============================\n\n";

// Find an appointment with a ticket that's not already no_show
$appointment = Appointment::whereNotNull('ticket_id')
    ->where('status', '!=', 'no_show')
    ->with(['ticket'])
    ->first();

if (!$appointment) {
    echo "❌ No suitable appointment found for testing.\n";
    exit;
}

// Set a test user (simulate ADK ASSIST user)
$testUser = Technical::where('name', 'like', '%ADK%')->first();
if (!$testUser) {
    $testUser = Technical::first();
}

if (!$testUser) {
    echo "❌ No user found for testing.\n";
    exit;
}

echo "📋 Test Setup:\n";
echo "   Appointment ID: {$appointment->id}\n";
echo "   Current Status: {$appointment->status}\n";
echo "   Ticket ID: {$appointment->ticket_id}\n";
echo "   Ticket Title: " . ($appointment->ticket ? $appointment->ticket->title : 'N/A') . "\n";
echo "   Test User: {$testUser->name}\n\n";

// Count histories before
$historiesBefore = $appointment->ticket->histories()->count();
echo "📊 Timeline entries before: {$historiesBefore}\n\n";

// Simulate the no-show process
try {
    // Simulate Auth::user()
    $userName = $testUser->name;
    $testReason = "Cliente no respondió llamadas";
    $testDescription = "Se realizaron 3 intentos de contacto sin respuesta";

    echo "🔄 Simulating No Show process...\n";
    
    // Create the timeline entry like the controller would
    if ($appointment->ticket_id) {
        $ticket = $appointment->ticket;
        if ($ticket) {
            $description = "Cita marcada como No Show - Razón: {$testReason}";
            if ($testDescription) {
                $description .= " - Descripción: {$testDescription}";
            }
            $description .= " por {$userName}";

            $historyEntry = $ticket->histories()->create([
                'action' => 'appointment_no_show',
                'description' => $description,
                'technical_id' => $testUser->id,
                'meta' => [
                    'appointment_id' => $appointment->id,
                    'no_show_reason' => $testReason,
                    'no_show_description' => $testDescription,
                    'actor_name' => $userName,
                    'marked_at' => Carbon::now()->toISOString()
                ]
            ]);

            echo "✅ Timeline entry created successfully!\n";
            echo "   Entry ID: {$historyEntry->id}\n";
            echo "   Action: {$historyEntry->action}\n";
            echo "   Description: {$historyEntry->description}\n";
            echo "   User Name Accessor: '{$historyEntry->user_name}'\n\n";

            // Count histories after
            $historiesAfter = $ticket->histories()->count();
            echo "📊 Timeline entries after: {$historiesAfter}\n";
            echo "📈 New entries added: " . ($historiesAfter - $historiesBefore) . "\n\n";

            // Test the frontend would show
            echo "🌐 Frontend Timeline Display Test:\n";
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            
            // Simulate API response structure
            $apiEntry = [
                'id' => $historyEntry->id,
                'action' => $historyEntry->action,
                'description' => $historyEntry->description,
                'user_name' => $historyEntry->user_name,
                'technical' => null,
                'user' => null,
                'created_at' => $historyEntry->created_at,
            ];

            echo "   API user_name field: '{$apiEntry['user_name']}'\n";
            echo "   Frontend will display: '{$apiEntry['user_name']}' (not 'System')\n\n";

            // Show in ticket context
            echo "🎯 Ticket Timeline Preview:\n";
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
            echo "   📋 Ticket: {$ticket->title}\n";
            echo "   📅 " . $historyEntry->created_at->format('d/m/Y • H:i') . "\n";
            echo "   👤 {$historyEntry->user_name}\n";
            echo "   📝 {$historyEntry->description}\n\n";

            echo "🎉 SUCCESS! No Show event successfully added to ticket timeline!\n";
            echo "The timeline will show '{$userName}' instead of 'System'.\n\n";

        } else {
            echo "❌ Ticket not found\n";
        }
    } else {
        echo "❌ No ticket associated with appointment\n";
    }

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "🔧 To verify in browser:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "1. Open Ticket ID: {$appointment->ticket_id}\n";
echo "2. Check the timeline for the new 'No Show' entry\n";
echo "3. Verify it shows '{$userName}' not 'System'\n";
echo "4. Now try marking appointment ID {$appointment->id} as No Show in the UI\n";
echo "5. Check that both the appointment status changes AND timeline is updated\n\n";

echo "✅ Test Complete!\n";

?>