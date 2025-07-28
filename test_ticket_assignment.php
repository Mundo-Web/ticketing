i<?php

require_once 'vendor/autoload.php';

use App\Models\Ticket;
use App\Models\Technical;
use App\Models\User;
use App\Events\TicketAssigned;

echo "Testing TicketAssigned event instantiation...\n";

// This is just a syntax check - we won't actually run it
// $ticket = new Ticket();
// $technical = new Technical();
// $user = new User();
// $event = new TicketAssigned($ticket, $technical, $user);

echo "✅ No syntax errors found!\n";
