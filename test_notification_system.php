<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Artisan;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Ticket;
use App\Jobs\SendTicketCreatedNotificationsJob;
use App\Notifications\TicketStatusUpdatedNotification;

echo "=== Testing Ticket Notifications System ===\n\n";

// Test 1: Create a ticket and send creation notifications
echo "Test 1: Creating ticket and sending notifications...\n";

try {
    // Find a member user to create a ticket
    $memberUser = User::whereHas('roles', function ($query) {
        $query->where('name', 'member');
    })->first();

    if (!$memberUser) {
        echo "❌ No member user found for testing\n";
        exit;
    }

    echo "Found member user: {$memberUser->name} ({$memberUser->email})\n";

    // Find a ticket to use for testing (or create one if needed)
    $ticket = Ticket::where('user_id', $memberUser->id)->latest()->first();

    if (!$ticket) {
        echo "❌ No ticket found for member. Please create a ticket first.\n";
        exit;
    }

    echo "Using ticket: {$ticket->code} - {$ticket->title}\n";

    // Test ticket creation notifications
    echo "Dispatching SendTicketCreatedNotificationsJob...\n";
    SendTicketCreatedNotificationsJob::dispatch($ticket);

    echo "✅ Ticket creation notifications dispatched\n\n";

    // Test 2: Status update notification
    echo "Test 2: Testing status update notification...\n";

    $oldStatus = $ticket->status;
    $newStatus = 'in_progress';

    if ($oldStatus !== $newStatus) {
        $adminUser = User::whereHas('roles', function ($query) {
            $query->where('name', 'super-admin');
        })->first();

        if ($adminUser) {
            // Send status update notification to ticket owner
            $ticket->user->notify(new TicketStatusUpdatedNotification($ticket, $oldStatus, $newStatus, $adminUser));
            echo "✅ Status update notification sent to ticket owner\n";
        } else {
            echo "❌ No admin user found for status update test\n";
        }
    } else {
        echo "ℹ️ Ticket already in 'in_progress' status\n";
    }

    echo "\nTest 3: Checking notification counts...\n";

    // Check notification counts for different users
    $users = User::with('roles')->get();

    foreach ($users as $user) {
        $roles = $user->roles->pluck('name')->toArray();
        $unreadCount = $user->unreadNotifications()->count();
        $totalCount = $user->notifications()->count();
        
        echo "User: {$user->name} ({$user->email})\n";
        echo "  Roles: " . implode(', ', $roles) . "\n";
        echo "  Total notifications: {$totalCount}\n";
        echo "  Unread notifications: {$unreadCount}\n\n";
    }

    echo "=== Test completed successfully! ===\n";

} catch (\Exception $e) {
    echo "❌ Error during testing: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
