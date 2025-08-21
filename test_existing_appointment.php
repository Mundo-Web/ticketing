<?php

require_once 'vendor/autoload.php';

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\AppointmentController;
use Carbon\Carbon;

// Simular ambiente Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🚨 TESTING WITH EXISTING APPOINTMENT AT 00:50\n";
echo "==============================================\n\n";

// Find any appointment with ticket
$appointment = Appointment::whereNotNull('ticket_id')
    ->where('status', '!=', 'no_show')
    ->with(['ticket'])
    ->first();

if (!$appointment) {
    echo "❌ No appointment found for testing.\n";
    exit;
}

echo "📋 Using Appointment:\n";
echo "   ID: {$appointment->id}\n";
echo "   Status: {$appointment->status}\n";
echo "   Ticket: {$appointment->ticket_id} - " . ($appointment->ticket ? $appointment->ticket->title : 'N/A') . "\n";
echo "   Start Time: " . ($appointment->scheduled_time ?? 'N/A') . "\n";

// Count timeline entries before
$timelineBefore = $appointment->ticket->histories()->count();
echo "📊 Timeline entries BEFORE: {$timelineBefore}\n\n";

// Get user
$user = User::first();
if (!$user) {
    echo "❌ No user found.\n";
    exit;
}

try {
    // Simulate authentication
    Auth::login($user);
    
    echo "👤 Authenticated as: {$user->name} (ID: {$user->id})\n\n";
    
    // Create a mock request
    $request = new Request([
        'reason' => 'PRUEBA FINAL - Cliente no se presentó',
        'description' => 'Testing timeline integration - DEBE APARECER EN TIMELINE'
    ]);
    
    echo "🔄 Executing AppointmentController::noShow()...\n";
    
    // Call the controller method directly
    $controller = new AppointmentController();
    $response = $controller->noShow($request, $appointment);
    
    echo "✅ Controller executed!\n\n";
    
    // Refresh data
    $appointment->refresh();
    $ticket = $appointment->ticket->fresh();
    
    // Count timeline entries after
    $timelineAfter = $ticket->histories()->count();
    echo "📊 Timeline entries AFTER: {$timelineAfter}\n";
    echo "📈 New entries: " . ($timelineAfter - $timelineBefore) . "\n\n";
    
    // Check appointment status
    echo "📅 Appointment Status: {$appointment->status}\n";
    echo "📝 No Show Reason: {$appointment->no_show_reason}\n\n";
    
    // Get the latest timeline entry
    $latestEntry = $ticket->histories()->latest()->first();
    if ($latestEntry && $latestEntry->action === 'appointment_no_show') {
        echo "🎯 SUCCESS! TIMELINE ENTRY CREATED:\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "   Entry ID: {$latestEntry->id}\n";
        echo "   Action: {$latestEntry->action}\n";
        echo "   Description: {$latestEntry->description}\n";
        echo "   User Name: '{$latestEntry->user_name}'\n";
        echo "   Created: " . $latestEntry->created_at->format('d/m/Y H:i:s') . "\n";
        echo "   Meta: " . json_encode($latestEntry->meta, JSON_PRETTY_PRINT) . "\n\n";
        
        echo "🎉 PERFECT! The No Show is now in the ticket timeline!\n";
        echo "Go check Ticket ID: {$appointment->ticket_id} in the browser!\n";
    } else {
        echo "❌ Timeline entry was NOT created.\n";
        echo "Latest entry action: " . ($latestEntry ? $latestEntry->action : 'none') . "\n";
    }
    
} catch (\Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n✅ Test complete!\n";

?>