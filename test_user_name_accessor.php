<?php

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/bootstrap/app.php';

use App\Models\TicketHistory;

// Test the accessor with different scenarios
$history1 = new TicketHistory();
$history1->description = "Cita reagendada de 20/08/2025 23:46 a 20/08/2025 23:48 por SuperAdmin - test reason";
$history1->meta = ['actor_name' => 'SuperAdmin'];

echo "Test 1 - With meta actor_name: " . $history1->user_name . "\n";

$history2 = new TicketHistory();
$history2->description = "Cita reagendada de 20/08/2025 23:46 a 20/08/2025 23:48 por TechUser";

echo "Test 2 - From description without reason: " . $history2->user_name . "\n";

$history3 = new TicketHistory();
$history3->description = "Private note by AdminUser: This is a test note";

echo "Test 3 - Private note: " . $history3->user_name . "\n";

$history4 = new TicketHistory();
$history4->description = "Some other description";

echo "Test 4 - Default fallback: " . $history4->user_name . "\n";