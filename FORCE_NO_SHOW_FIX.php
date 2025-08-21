<?php

require_once 'vendor/autoload.php';

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\AppointmentController;

// Simular ambiente Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🚨 FIXING NO SHOW TIMELINE - DIRECT ACTION\n";
echo "==========================================\n\n";

// Find an appointment with a ticket that's not already no_show
$appointment = Appointment::whereNotNull('ticket_id')
    ->where('status', '!=', 'no_show')
    ->with(['ticket'])
    ->first();

if (!$appointment) {
    echo "❌ No appointment found for testing.\n";
    exit;
}

// Get a user to simulate authentication
$user = User::first();
if (!$user) {
    echo "❌ No user found.\n";
    exit;
}

echo "📋 Testing Appointment:\n";
echo "   ID: {$appointment->id}\n";
echo "   Status: {$appointment->status}\n";
echo "   Ticket: {$appointment->ticket_id} - " . ($appointment->ticket ? $appointment->ticket->title : 'N/A') . "\n\n";

// Count timeline entries before
$timelineBefore = $appointment->ticket->histories()->count();
echo "📊 Timeline entries BEFORE: {$timelineBefore}\n\n";

try {
    // Simulate authentication
    Auth::login($user);
    
    // Create a mock request
    $request = new Request([
        'reason' => 'Cliente no se presentó - PRUEBA DIRECTA',
        'description' => 'Test directo para verificar que funciona la timeline'
    ]);
    
    echo "🔄 Executing AppointmentController::noShow()...\n";
    
    // Call the controller method directly
    $controller = new AppointmentController();
    $response = $controller->noShow($request, $appointment);
    
    echo "✅ Controller executed successfully!\n\n";
    
    // Refresh the appointment and ticket
    $appointment->refresh();
    $ticket = $appointment->ticket->fresh();
    
    // Count timeline entries after
    $timelineAfter = $ticket->histories()->count();
    echo "📊 Timeline entries AFTER: {$timelineAfter}\n";
    echo "📈 New entries: " . ($timelineAfter - $timelineBefore) . "\n\n";
    
    // Check the appointment status
    echo "📅 Appointment Status: {$appointment->status}\n";
    echo "📝 No Show Reason: {$appointment->no_show_reason}\n\n";
    
    // Get the latest timeline entry
    $latestEntry = $ticket->histories()->latest()->first();
    if ($latestEntry && $latestEntry->action === 'appointment_no_show') {
        echo "🎯 LATEST TIMELINE ENTRY:\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "   ID: {$latestEntry->id}\n";
        echo "   Action: {$latestEntry->action}\n";
        echo "   Description: {$latestEntry->description}\n";
        echo "   User Name: '{$latestEntry->user_name}'\n";
        echo "   Created: " . $latestEntry->created_at->format('d/m/Y H:i:s') . "\n\n";
        
        echo "🎉 SUCCESS! No Show was added to ticket timeline!\n";
        echo "The ticket now has the appointment no-show event in its timeline.\n";
    } else {
        echo "❌ No timeline entry was created.\n";
    }
    
    echo "\n";
    echo "🔧 NOW GO TEST IN BROWSER:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "1. Open Ticket ID: {$appointment->ticket_id}\n";
    echo "2. Check the timeline for the new No Show entry\n";
    echo "3. It should show: 'Cita marcada como No Show'\n";
    echo "4. User attribution should show: '{$user->name}'\n\n";
    
} catch (\Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "✅ Direct test complete!\n";

?>