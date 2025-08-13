<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Device;
use App\Models\Ticket;
use Illuminate\Support\Facades\Log;
use App\Notifications\TicketCreatedNotification;

echo "=== Testing Direct Notifications (No Jobs) ===\n\n";

try {
    // Clear previous logs to see new ones clearly
    file_put_contents(storage_path('logs/laravel.log'), '');
    echo "✅ Logs cleared\n";

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

    // Create test ticket (simulating the frontend creation)
    $ticketData = [
        'user_id' => $member->id,
        'device_id' => $device->id,
        'category' => 'Soporte Técnico',
        'title' => 'Test direct notifications - ' . date('Y-m-d H:i:s'),
        'description' => 'Testing direct notifications without jobs',
        'status' => 'open',
        'attachments' => []
    ];

    $ticket = Ticket::create($ticketData);
    echo "✅ Ticket created: {$ticket->code} - {$ticket->title}\n\n";

    // Send notifications directly (same logic as TicketController)
    echo "Sending notifications directly...\n";

    // 1. Notify ticket creator
    if ($ticket->user) {
        $ticket->user->notify(new TicketCreatedNotification($ticket));
        echo "• ✅ Notification sent to ticket creator: {$ticket->user->name}\n";
    }

    // 2. Notify all administrators
    $admins = User::whereHas('roles', function ($query) {
        $query->whereIn('name', ['super-admin', 'admin']);
    })->get();

    foreach ($admins as $admin) {
        $admin->notify(new TicketCreatedNotification($ticket));
        echo "• ✅ Notification sent to admin: {$admin->name}\n";
    }

    // 3. Notify default technicals
    $defaultTechnicals = User::whereHas('roles', function ($query) {
        $query->where('name', 'technical');
    })->whereHas('technical', function ($query) {
        $query->where('is_default', true);
    })->get();

    foreach ($defaultTechnicals as $technical) {
        $technical->notify(new TicketCreatedNotification($ticket));
        echo "• ✅ Notification sent to default technical: {$technical->name}\n";
    }

    echo "\nChecking notification counts:\n";
    
    // Check notification counts
    $allUsers = User::with('roles')->get();
    foreach ($allUsers as $user) {
        $count = $user->unreadNotifications()->count();
        $roles = $user->roles->pluck('name')->toArray();
        if ($count > 0) {
            echo "• {$user->name} (" . implode(', ', $roles) . "): {$count} unread notifications\n";
            
            // Show latest notification
            $latest = $user->unreadNotifications()->latest()->first();
            if ($latest && isset($latest->data['title'])) {
                echo "  → Latest: {$latest->data['title']}\n";
            }
        }
    }

    echo "\n=== Direct notifications test completed! ===\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
