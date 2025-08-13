<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Device;
use App\Models\Ticket;
use App\Jobs\SendTicketCreatedNotificationsJob;

echo "=== Creating Test Ticket and Notifications ===\n\n";

try {
    // Find member user
    $member = User::whereHas('roles', function($q) { 
        $q->where('name', 'member'); 
    })->first();
    
    if (!$member) { 
        echo '❌ No member found'; 
        exit; 
    }

    echo "Found member: {$member->name} ({$member->email})\n";

    // Find a device
    $device = Device::first();
    if (!$device) { 
        echo '❌ No device found'; 
        exit; 
    }

    echo "Found device: {$device->id}\n";

    // Create test ticket
    $ticket = Ticket::create([
        'user_id' => $member->id,
        'device_id' => $device->id,
        'category' => 'Soporte Técnico',
        'title' => 'Test notification ticket - ' . date('Y-m-d H:i:s'),
        'description' => 'This is a test ticket to demonstrate the notification system',
        'status' => 'open',
        'attachments' => []
    ]);

    echo "✅ Ticket created: {$ticket->code} - {$ticket->title}\n\n";

    // Send notifications
    SendTicketCreatedNotificationsJob::dispatch($ticket);
    echo "✅ Notifications dispatched!\n\n";

    // Show notification counts
    echo "Checking notification counts:\n";
    $users = User::with('roles')->get();
    foreach ($users as $user) {
        $count = $user->unreadNotifications()->count();
        $roles = $user->roles->pluck('name')->toArray();
        if ($count > 0 || in_array('super-admin', $roles) || in_array('technical', $roles)) {
            echo "• {$user->name} (" . implode(', ', $roles) . "): {$count} unread notifications\n";
        }
    }

    echo "\n=== Test completed successfully! ===\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
