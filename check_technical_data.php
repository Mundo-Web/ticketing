<?php

use App\Models\Technical;
use App\Models\User;

echo "Checking technicals and users...\n";

$technicals = Technical::all();

foreach($technicals as $tech) {
    echo "- {$tech->name} ({$tech->email})\n";
    
    $user = User::where('email', $tech->email)->first();
    if($user) {
        echo "  User roles: " . $user->roles->pluck('name')->implode(', ') . "\n";
        echo "  Has technical role: " . ($user->hasRole('technical') ? 'Yes' : 'No') . "\n";
    } else {
        echo "  No user found\n";
    }
}

// Check today's tickets
echo "\nToday's tickets:\n";
$todayTickets = \App\Models\Ticket::whereDate('created_at', today())
                                 ->whereIn('status', ['open', 'in_progress'])
                                 ->get();

echo "Count: " . $todayTickets->count() . "\n";

foreach($todayTickets as $ticket) {
    echo "- Ticket #{$ticket->id} - Status: {$ticket->status} - Technical ID: " . ($ticket->technical_id ?? 'Unassigned') . "\n";
}
