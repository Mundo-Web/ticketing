<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

use App\Models\User;
use App\Models\Ticket;
use App\Models\Device;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;
use App\Notifications\TicketCreatedNotification;

// Test ticket creation and notifications
echo "Testing final ticket creation and notifications...\n";

try {
    // Find a member user
    $memberUser = User::whereHas('roles', function ($query) {
        $query->where('name', 'member');
    })->first();

    if (!$memberUser) {
        echo "No member user found!\n";
        exit;
    }

    echo "Found member user: {$memberUser->name} ({$memberUser->email})\n";

    // Find a device for this member
    $tenant = Tenant::where('email', $memberUser->email)->first();
    if (!$tenant) {
        echo "No tenant found for member!\n";
        exit;
    }

    $device = $tenant->devices()->first();
    if (!$device) {
        echo "No device found for member!\n";
        exit;
    }

    echo "Found device: {$device->id}\n";

    // Create ticket data
    $ticketData = [
        'device_id' => $device->id,
        'category' => 'Technical Support',
        'title' => 'Test Notification Ticket - ' . date('Y-m-d H:i:s'),
        'description' => 'This is a test ticket to verify notifications work correctly',
        'status' => Ticket::STATUS_OPEN,
        'user_id' => $memberUser->id,
        'technical_id' => null,
        'attachments' => []
    ];

    // Create the ticket
    $ticket = Ticket::create($ticketData);
    echo "Created ticket #{$ticket->id}: {$ticket->title}\n";

    // Add history
    $ticket->addHistory(
        'created',
        "Ticket created by {$memberUser->name}",
        null,
        null
    );

    // Send notifications directly (like in the controller)
    echo "\nSending notifications...\n";

    // 1. Notify ticket creator
    $memberUser->notify(new TicketCreatedNotification($ticket));
    echo "✓ Notification sent to ticket creator: {$memberUser->name}\n";

    // 2. Notify all admins
    $admins = User::whereHas('roles', function ($query) {
        $query->whereIn('name', ['super-admin', 'admin']);
    })->get();

    foreach ($admins as $admin) {
        $admin->notify(new TicketCreatedNotification($ticket));
        echo "✓ Notification sent to admin: {$admin->name}\n";
    }

    // 3. Notify default technicals
    $defaultTechnicals = User::whereHas('roles', function ($query) {
        $query->where('name', 'technical');
    })->whereHas('technical', function ($query) {
        $query->where('is_default', true);
    })->get();

    foreach ($defaultTechnicals as $technical) {
        $technical->notify(new TicketCreatedNotification($ticket));
        echo "✓ Notification sent to default technical: {$technical->name}\n";
    }

    echo "\nAll notifications sent successfully!\n";
    echo "Admins notified: " . $admins->count() . "\n";
    echo "Technicals notified: " . $defaultTechnicals->count() . "\n";

    // Check notifications in database
    echo "\nChecking notifications in database...\n";
    
    $notifications = \Illuminate\Notifications\DatabaseNotification::where('data->ticket_id', $ticket->id)->get();
    echo "Total notifications created: " . $notifications->count() . "\n";

    foreach ($notifications as $notification) {
        $userData = User::find($notification->notifiable_id);
        $data = json_decode($notification->data, true);
        echo "- User: {$userData->name} ({$userData->email}) - Type: {$data['type']} - Message: {$data['message']}\n";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\nTest completed!\n";
