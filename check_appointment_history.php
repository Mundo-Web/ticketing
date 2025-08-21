<?php

require_once 'vendor/autoload.php';

use App\Models\Ticket;

// Simular ambiente Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔍 Checking Existing Appointment Rescheduling History\n";
echo "=====================================================\n\n";

$tickets = Ticket::with(['histories.technical'])->get();
$found = false;

foreach($tickets as $ticket) {
    foreach($ticket->histories as $history) {
        if(stripos($history->description, 'reagendada') !== false) {
            $found = true;
            echo "📋 Ticket ID: {$ticket->id}\n";
            echo "📝 History ID: {$history->id}\n";
            echo "🎯 Action: {$history->action}\n";
            echo "📄 Description: {$history->description}\n";
            echo "👤 Technical ID: " . ($history->technical_id ?? 'null') . "\n";
            echo "🔧 Technical: " . ($history->technical ? $history->technical->name : 'null') . "\n";
            echo "📊 Meta: " . json_encode($history->meta) . "\n";
            echo "🏷️  User Name Accessor: '{$history->user_name}'\n";
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
        }
    }
}

if (!$found) {
    echo "❌ No appointment rescheduling history entries found.\n";
    echo "The timeline issue may be with other types of entries.\n\n";
    
    echo "📋 Recent history entries (last 10):\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
    $recentHistories = App\Models\TicketHistory::with('technical')
        ->orderBy('created_at', 'desc')
        ->limit(10)
        ->get();
    
    foreach($recentHistories as $history) {
        echo "📝 ID: {$history->id} | Action: {$history->action}\n";
        echo "   Description: {$history->description}\n";
        echo "   Technical: " . ($history->technical ? $history->technical->name : 'null') . "\n";
        echo "   User Name: '{$history->user_name}'\n";
        echo "   ──────────────────────────────────────────\n";
    }
}

?>