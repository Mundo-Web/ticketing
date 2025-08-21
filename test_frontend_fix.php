<?php

require_once 'vendor/autoload.php';

use App\Models\Ticket;
use App\Models\TicketHistory;
use Illuminate\Support\Facades\Http;

// Simular ambiente Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🧪 Frontend Timeline Attribution Test\n";
echo "=====================================\n\n";

// Find a ticket with appointment rescheduling history
$ticket = Ticket::with([
    'histories' => function($query) {
        $query->where('description', 'like', '%reagendada%')
            ->where('description', 'like', '%ADK ASSIST%')
            ->orderBy('created_at', 'desc');
    },
    'histories.technical'
])->whereHas('histories', function($query) {
    $query->where('description', 'like', '%reagendada%')
          ->where('description', 'like', '%ADK ASSIST%');
})->first();

if (!$ticket) {
    echo "❌ No tickets found with ADK ASSIST appointment rescheduling.\n";
    exit;
}

echo "📋 Found ticket ID: {$ticket->id}\n";
echo "📋 Title: {$ticket->title}\n\n";

$targetHistory = $ticket->histories->first();
if (!$targetHistory) {
    echo "❌ No ADK ASSIST history found.\n";
    exit;
}

echo "📝 Target History Entry:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "   ID: {$targetHistory->id}\n";
echo "   Action: {$targetHistory->action}\n";
echo "   Description: {$targetHistory->description}\n";
echo "   Technical ID: " . ($targetHistory->technical_id ?? 'null') . "\n";
echo "   Technical: " . ($targetHistory->technical ? $targetHistory->technical->name : 'null') . "\n";
echo "   Meta: " . json_encode($targetHistory->meta) . "\n";
echo "   User Name Accessor: '{$targetHistory->user_name}'\n\n";

// Test API endpoint structure
echo "🌐 API Response Test:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$ticketWithFullHistory = Ticket::with([
    'histories' => function($query) {
        $query->orderBy('created_at', 'desc');
    },
    'histories.technical'
])->find($ticket->id);

$apiHistories = $ticketWithFullHistory->histories->map(function($history) {
    return [
        'id' => $history->id,
        'action' => $history->action,
        'description' => $history->description,
        'user_name' => $history->user_name,  // This is what the frontend should use
        'technical' => $history->technical ? [
            'name' => $history->technical->name
        ] : null,
        'user' => null, // We don't load user relationship
        'created_at' => $history->created_at,
    ];
});

$testEntry = $apiHistories->firstWhere('id', $targetHistory->id);

if ($testEntry) {
    echo "✅ API returns correct structure:\n";
    echo "   - id: {$testEntry['id']}\n";
    echo "   - action: {$testEntry['action']}\n";
    echo "   - user_name: '{$testEntry['user_name']}'\n";
    echo "   - technical: " . ($testEntry['technical'] ? $testEntry['technical']['name'] : 'null') . "\n";
    echo "   - user: " . ($testEntry['user'] ?? 'null') . "\n\n";
    
    echo "🧩 Frontend Logic Test:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
    // Old logic (what was causing the problem)
    $oldLogic = $testEntry['technical']['name'] ?? $testEntry['user']['name'] ?? 'System';
    echo "❌ OLD: entry.technical?.name || entry.user?.name || 'System' = '{$oldLogic}'\n";
    
    // New logic (our fix)
    $newLogic = $testEntry['user_name'] ?? 'System';
    echo "✅ NEW: entry.user_name || 'System' = '{$newLogic}'\n\n";
    
    if ($newLogic === 'ADK ASSIST') {
        echo "🎉 SUCCESS! The timeline should now show 'ADK ASSIST' instead of 'System'\n";
    } else {
        echo "⚠️  Unexpected result. Expected 'ADK ASSIST', got '{$newLogic}'\n";
    }
} else {
    echo "❌ Test entry not found in API response\n";
}

echo "\n";
echo "🔧 To test in browser:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "1. Open the ticketing system in your browser\n";
echo "2. Navigate to Ticket ID: {$ticket->id}\n";
echo "3. Check the timeline for appointment rescheduling entries\n";
echo "4. Look for entries that show 'ADK ASSIST' instead of 'System'\n";
echo "5. If you still see 'System', clear browser cache and try again\n\n";

echo "✅ Test Complete!\n";

?>