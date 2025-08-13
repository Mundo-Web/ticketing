<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Bootstrap the Laravel application
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Create a test request for the API
$request = Request::create('/api/technical-tickets?type=today', 'GET');
$request->headers->set('Content-Type', 'application/json');
$request->headers->set('Accept', 'application/json');
$request->headers->set('X-Requested-With', 'XMLHttpRequest');

try {
    echo "🔍 Testing Technical Tickets API\n";
    echo "================================\n\n";
    
    // Check if we have technical users
    $technicals = \App\Models\Technical::all();
    echo "Technical users found: " . $technicals->count() . "\n";
    
    foreach ($technicals as $tech) {
        echo "- {$tech->name} ({$tech->email}) - Default: " . ($tech->is_default ? 'Yes' : 'No') . "\n";
        
        // Check if there's a user with this email
        $user = \App\Models\User::where('email', $tech->email)->first();
        if ($user) {
            echo "  User found: {$user->name}\n";
            echo "  Roles: " . $user->roles->pluck('name')->implode(', ') . "\n";
            echo "  Has technical role: " . ($user->hasRole('technical') ? 'Yes' : 'No') . "\n";
        } else {
            echo "  ❌ No user found with email {$tech->email}\n";
        }
        echo "\n";
    }
    
    // Check tickets assigned to technicals
    echo "\n📋 Checking tickets...\n";
    $todayTickets = \App\Models\Ticket::whereDate('created_at', today())
                                     ->whereIn('status', ['open', 'in_progress'])
                                     ->get();
    
    echo "Today's tickets: " . $todayTickets->count() . "\n";
    
    foreach ($todayTickets as $ticket) {
        echo "- Ticket #{$ticket->id} - Status: {$ticket->status} - Technical ID: " . ($ticket->technical_id ?? 'Unassigned') . "\n";
    }
    
    echo "\n✅ Test completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
