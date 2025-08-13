<?php

use App\Models\Ticket;
use App\Models\Technical;
use App\Models\User;
use App\Models\Device;

echo "Creating test tickets...\n";

// Get first technical
$technical = Technical::first();
if (!$technical) {
    echo "No technical found!\n";
    exit;
}

echo "Using technical: {$technical->name} (ID: {$technical->id})\n";

// Get a device or create one
$device = Device::first();
if (!$device) {
    echo "No device found, will use device ID 1\n";
    $deviceId = 1;
} else {
    $deviceId = $device->id;
    echo "Using device: {$device->id}\n";
}

// Create test tickets (without priority field)
$testTickets = [
    [
        'title' => 'Computer not starting',
        'description' => 'The computer is not booting up properly',
        'status' => 'open',
        'category' => 'Hardware',
        'device_id' => $deviceId,
        'technical_id' => $technical->id,
    ],
    [
        'title' => 'Network connectivity issue',
        'description' => 'Unable to connect to the internet',
        'status' => 'in_progress', 
        'category' => 'Network',
        'device_id' => $deviceId,
        'technical_id' => $technical->id,
    ],
    [
        'title' => 'URGENT: Server down',
        'description' => 'Main server is not responding',
        'status' => 'open',
        'category' => 'Critical Emergency',
        'device_id' => $deviceId,
        'technical_id' => $technical->id,
    ],
    [
        'title' => 'System malfunction',
        'description' => 'System showing errors',
        'status' => 'open',
        'category' => 'Urgent',
        'device_id' => $deviceId,
        'technical_id' => $technical->id,
        'created_at' => now()->subHours(25), // Old ticket
    ]
];

foreach ($testTickets as $ticketData) {
    $ticket = Ticket::create($ticketData);
    echo "Created ticket #{$ticket->id}: {$ticket->title} (Category: {$ticket->category})\n";
}

echo "\nTest tickets created successfully!\n";

// Show summary
$assignedCount = Ticket::where('technical_id', $technical->id)->whereIn('status', ['open', 'in_progress'])->count();

// Count urgent tickets using the same logic as the controller
$urgentCount = Ticket::where('technical_id', $technical->id)
    ->where(function($query) {
        $query->whereDate('created_at', today()) // Tickets created today
              ->orWhere(function($subQuery) {
                  // Also include tickets older than 24 hours without resolution
                  $subQuery->whereIn('status', ['open', 'in_progress'])
                          ->where('created_at', '<=', now()->subHours(24));
              })
              ->orWhere('category', 'like', '%Emergency%') // Emergency categories
              ->orWhere('category', 'like', '%Critical%')  // Critical categories
              ->orWhere('category', 'like', '%Urgent%');   // Urgent categories
    })
    ->whereIn('status', ['open', 'in_progress'])
    ->count();

echo "\nSummary for {$technical->name}:\n";
echo "- Active assigned tickets: {$assignedCount}\n";
echo "- Urgent tickets: {$urgentCount}\n";
