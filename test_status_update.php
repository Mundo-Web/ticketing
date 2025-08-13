<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Ticket;
use App\Notifications\TicketStatusUpdatedNotification;

echo "=== Testing Status Update Notifications ===\n\n";

try {
    // Find the latest ticket
    $ticket = Ticket::latest()->first();
    if (!$ticket) {
        echo '❌ No tickets found';
        exit;
    }

    echo "Found ticket: {$ticket->code} - {$ticket->title}\n";
    echo "Current status: {$ticket->status}\n";
    echo "Ticket owner: {$ticket->user->name}\n\n";

    // Find an admin to update the ticket
    $admin = User::whereHas('roles', function($q) { 
        $q->where('name', 'super-admin'); 
    })->first();
    
    if (!$admin) {
        echo '❌ No admin found';
        exit;
    }

    echo "Admin updating status: {$admin->name}\n\n";

    // Test different status changes
    $statusChanges = [
        ['from' => 'open', 'to' => 'in_progress'],
        ['from' => 'in_progress', 'to' => 'resolved'],
        ['from' => 'resolved', 'to' => 'closed']
    ];

    foreach ($statusChanges as $change) {
        if ($ticket->status === $change['from']) {
            $oldStatus = $ticket->status;
            $newStatus = $change['to'];
            
            echo "Updating status from '{$oldStatus}' to '{$newStatus}'...\n";
            
            // Update ticket status
            $ticket->status = $newStatus;
            $ticket->save();
            
            // Send notification to ticket owner
            $ticket->user->notify(new TicketStatusUpdatedNotification($ticket, $oldStatus, $newStatus, $admin));
            
            echo "✅ Status update notification sent!\n\n";
            
            // Only do one status change for this test
            break;
        }
    }

    // Show updated notification counts
    echo "Updated notification counts:\n";
    $users = User::with('roles')->get();
    foreach ($users as $user) {
        $count = $user->unreadNotifications()->count();
        $roles = $user->roles->pluck('name')->toArray();
        if ($count > 0) {
            echo "• {$user->name} (" . implode(', ', $roles) . "): {$count} unread notifications\n";
            
            // Show latest notification details
            $latestNotification = $user->unreadNotifications()->latest()->first();
            if ($latestNotification) {
                $data = $latestNotification->data;
                echo "  Latest: {$data['title']} - {$data['message']}\n";
            }
        }
    }

    echo "\n=== Status update test completed! ===\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
