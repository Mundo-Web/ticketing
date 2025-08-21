<?php

require_once 'vendor/autoload.php';

use App\Models\Appointment;
use App\Models\TicketHistory;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

// Simular ambiente Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔍 Timeline Attribution Test\n";
echo "============================\n\n";

// Get a ticket to test with
$ticket = Ticket::with(['histories.technical'])->first();

if (!$ticket) {
    echo "❌ No tickets found. Please create a ticket first.\n";
    exit;
}

echo "📋 Testing with Ticket ID: {$ticket->id}\n";
echo "📋 Ticket Title: {$ticket->title}\n\n";

// Get a superadmin user
$superadmin = User::whereHas('roles', function($query) {
    $query->where('name', 'super-admin');
})->first();

if (!$superadmin) {
    echo "❌ No superadmin user found. Please create one first.\n";
    exit;
}

echo "👤 Found superadmin: {$superadmin->name} (ID: {$superadmin->id})\n\n";

// Create a test history entry with superadmin attribution
$history = new TicketHistory();
$history->ticket_id = $ticket->id;
$history->action = 'test_superadmin_action';
$history->description = 'Test action performed by superadmin user to verify timeline attribution';
$history->user_id = $superadmin->id;
$history->meta = json_encode([
    'actor_name' => $superadmin->name,
    'actor_type' => 'superadmin',
    'test_entry' => true
]);
$history->save();

echo "✅ Created test history entry with ID: {$history->id}\n\n";

// Test the user_name accessor
echo "🧪 Testing user_name accessor:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$freshHistory = TicketHistory::with('technical')->find($history->id);
echo "📊 Raw data check:\n";
echo "   - user_id: {$freshHistory->user_id}\n";
echo "   - technical_id: " . ($freshHistory->technical_id ?? 'null') . "\n";
echo "   - technical relation: " . ($freshHistory->technical ? $freshHistory->technical->name : 'null') . "\n";
echo "   - meta: " . json_encode($freshHistory->meta) . "\n\n";

echo "📊 Accessor result:\n";
echo "   - user_name accessor: '{$freshHistory->user_name}'\n\n";

// Test API endpoint behavior
echo "🌐 Testing API endpoint:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

try {
    $ticketWithHistories = Ticket::with([
        'histories' => function($query) {
            $query->orderBy('created_at', 'desc');
        },
        'histories.technical'
    ])->find($ticket->id);

    $apiResponse = $ticketWithHistories->histories->map(function($h) {
        return [
            'id' => $h->id,
            'action' => $h->action,
            'description' => $h->description,
            'user_name' => $h->user_name,
            'created_at' => $h->created_at,
        ];
    });

    echo "📡 API response structure for our test entry:\n";
    $testEntry = $apiResponse->firstWhere('id', $history->id);
    if ($testEntry) {
        echo "   - id: {$testEntry['id']}\n";
        echo "   - action: {$testEntry['action']}\n";
        echo "   - user_name: '{$testEntry['user_name']}'\n";
        echo "   - description: {$testEntry['description']}\n";
    } else {
        echo "   ❌ Test entry not found in API response\n";
    }

} catch (Exception $e) {
    echo "❌ API test failed: {$e->getMessage()}\n";
}

echo "\n";

// Clean up the test entry
echo "🧹 Cleaning up test data...\n";
$history->delete();
echo "✅ Test history entry deleted\n\n";

echo "✅ Timeline Attribution Test Complete!\n";
echo "\nIf you see the superadmin's name in the user_name accessor output above,\n";
echo "then the backend fix is working correctly.\n\n";
echo "Next: Check the frontend by viewing a ticket timeline in the browser.\n";
echo "The timeline should now show actual user names instead of 'System'.\n";

?>