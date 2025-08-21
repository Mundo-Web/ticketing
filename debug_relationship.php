<?php

require_once 'vendor/autoload.php';

use App\Models\Appointment;
use App\Models\User;
use App\Models\Ticket;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

// Simular ambiente Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔍 DEBUGGING APPOINTMENT-TICKET RELATIONSHIP\n";
echo "=============================================\n\n";

// Get the appointment we just tested
$appointment = Appointment::find(12);
if (!$appointment) {
    echo "❌ Appointment not found.\n";
    exit;
}

echo "📋 Appointment Details:\n";
echo "   ID: {$appointment->id}\n";
echo "   Status: {$appointment->status}\n";
echo "   ticket_id: " . ($appointment->ticket_id ?? 'NULL') . "\n\n";

// Test the relationship
if ($appointment->ticket_id) {
    echo "🔗 Testing ticket relationship...\n";
    $ticket = $appointment->ticket;
    
    if ($ticket) {
        echo "✅ Ticket found: {$ticket->id} - {$ticket->title}\n";
        echo "📊 Ticket histories count: " . $ticket->histories()->count() . "\n\n";
        
        // Get a user
        $user = User::first();
        Auth::login($user);
        
        echo "👤 Authenticated as: {$user->name}\n\n";
        
        echo "🔄 Manually creating timeline entry...\n";
        
        try {
            $userName = Auth::user()->name;
            $description = "Cita marcada como No Show - MANUAL TEST - Razón: Test directo";
            $description .= " por {$userName}";

            $historyEntry = $ticket->histories()->create([
                'action' => 'appointment_no_show',
                'description' => $description,
                'technical_id' => Auth::id(),
                'meta' => [
                    'appointment_id' => $appointment->id,
                    'no_show_reason' => 'Test directo',
                    'no_show_description' => 'Prueba manual',
                    'actor_name' => $userName,
                    'marked_at' => Carbon::now()->toISOString()
                ]
            ]);
            
            echo "✅ Timeline entry created successfully!\n";
            echo "   Entry ID: {$historyEntry->id}\n";
            echo "   Action: {$historyEntry->action}\n";
            echo "   Description: {$historyEntry->description}\n";
            echo "   User Name: '{$historyEntry->user_name}'\n\n";
            
            echo "🎯 SUCCESS! The timeline entry was created manually.\n";
            echo "This means the relationship works, but something in the controller is failing.\n\n";
            
        } catch (\Exception $e) {
            echo "❌ Error creating timeline entry: " . $e->getMessage() . "\n";
        }
        
    } else {
        echo "❌ Ticket relationship failed - ticket is null\n";
    }
} else {
    echo "❌ No ticket_id in appointment\n";
}

echo "🔧 NEXT STEP: Check if the controller code is being reached\n";
echo "The problem might be that the controller logic is not being executed.\n";

?>