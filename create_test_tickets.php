<?php

require 'vendor/autoload.php';
require 'bootstrap/app.php';

use App\Models\Ticket;

// Crear ticket cerrado
$ticket1 = Ticket::create([
    'user_id' => 1,
    'device_id' => 1,
    'category' => 'Testing',
    'title' => 'Test Closed Ticket',
    'description' => 'This is a test closed ticket',
    'status' => 'closed',
    'closed_at' => now()
]);

// Crear otro ticket cancelado
$ticket2 = Ticket::create([
    'user_id' => 1,
    'device_id' => 1,
    'category' => 'Testing',
    'title' => 'Test Cancelled Ticket 2',
    'description' => 'This is another test cancelled ticket',
    'status' => 'cancelled'
]);

echo "Created ticket #{$ticket1->id} with status: {$ticket1->status}\n";
echo "Created ticket #{$ticket2->id} with status: {$ticket2->status}\n";

// Verificar totales
$total = Ticket::count();
$closedCancelled = Ticket::whereIn('status', ['closed', 'cancelled'])->count();
echo "Total tickets: {$total}\n";
echo "Closed+Cancelled tickets: {$closedCancelled}\n";
