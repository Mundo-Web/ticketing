<?php

// This script creates a test appointment for the current time to verify our fix

// Load Laravel app
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Appointment;
use App\Models\Technical;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

// Debug information
echo "Current server time: " . date('Y-m-d H:i:s') . "\n";
echo "Current Carbon time: " . Carbon::now()->format('Y-m-d H:i:s') . "\n";
echo "Yesterday date: " . Carbon::yesterday()->format('Y-m-d') . "\n";
echo "Yesterday 18:00: " . Carbon::yesterday()->setHour(18)->setMinute(0)->setSecond(0)->format('Y-m-d H:i:s') . "\n";
echo "Today date: " . Carbon::today()->format('Y-m-d') . "\n\n";

// Verify the SQL that will be used
DB::enableQueryLog();

// Get some existing data to use
$ticket = Ticket::first();
$technical = Technical::where('is_default', false)->first();

if (!$ticket || !$technical) {
    echo "Error: Couldn't find a ticket or technical to use for testing.\n";
    exit;
}

echo "Using Ticket #{$ticket->id} and Technical #{$technical->id} ({$technical->name})\n\n";

// Find if there's already a test appointment for today at 23:59
$existingLateAppointment = Appointment::whereDate('scheduled_for', Carbon::yesterday())
    ->where('scheduled_for', '>=', Carbon::yesterday()->setHour(23)->setMinute(55)->setSecond(0))
    ->first();

echo "Test 1: Looking for existing appointment from yesterday late night\n";
echo "  Query: " . DB::getQueryLog()[0]['query'] . "\n";
echo "  Bindings: " . json_encode(DB::getQueryLog()[0]['bindings']) . "\n";
echo "  Result: " . ($existingLateAppointment ? "Found appointment #{$existingLateAppointment->id}" : "No late appointment found") . "\n\n";

// Test the new query that should include yesterday's late appointments
echo "Test 2: Testing our new query to see if it includes yesterday's late appointments\n";
$testQuery = Appointment::where(function($query) {
    $query->where('scheduled_for', '>=', Carbon::today()->startOfDay())
          ->orWhere(function($subQuery) {
              $subQuery->whereDate('scheduled_for', Carbon::yesterday())
                      ->where('scheduled_for', '>=', Carbon::yesterday()->setHour(18)->setMinute(0)->setSecond(0));
          });
})
->where('status', '!=', 'cancelled')
->orderBy('scheduled_for')
->get();

echo "  Query: " . DB::getQueryLog()[1]['query'] . "\n";
echo "  Bindings: " . json_encode(DB::getQueryLog()[1]['bindings']) . "\n";
echo "  Result found " . $testQuery->count() . " appointments\n";

foreach ($testQuery as $idx => $apt) {
    $scheduledDate = Carbon::parse($apt->scheduled_for);
    echo "  {$idx}. ID: {$apt->id}, Title: {$apt->title}\n";
    echo "     Scheduled for: {$apt->scheduled_for}\n";
    echo "     Is from yesterday: " . ($scheduledDate->format('Y-m-d') == Carbon::yesterday()->format('Y-m-d') ? 'Yes' : 'No') . "\n";
    echo "     Is from today: " . ($scheduledDate->format('Y-m-d') == Carbon::today()->format('Y-m-d') ? 'Yes' : 'No') . "\n";
}

echo "\nOur fix should now properly include yesterday's late appointments (after 18:00) in the list of today's appointments.";
