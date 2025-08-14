<?php

require_once 'vendor/autoload.php';

use App\Models\Ticket;
use App\Models\User;
use App\Services\NotificationDispatcherService;
use Illuminate\Support\Facades\Log;

// Configurar la aplicación Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Testing Ticket Resolved Notifications ===\n";

try {
    // 1. Buscar un ticket existente
    $ticket = Ticket::with([
        'user.tenant.apartment.building',
        'device.tenants.apartment.building',
        'device.name_device'
    ])->first();
    
    if (!$ticket) {
        echo "❌ No tickets found in database\n";
        exit(1);
    }
    
    echo "✅ Found ticket: #{$ticket->code} - {$ticket->title}\n";
    
    // 2. Obtener información del building
    $building = null;
    if ($ticket->user && $ticket->user->tenant && $ticket->user->tenant->apartment) {
        $building = $ticket->user->tenant->apartment->building;
        echo "✅ Building found via user: {$building->name} (ID: {$building->id})\n";
    } elseif ($ticket->device && $ticket->device->tenants && $ticket->device->tenants->count() > 0) {
        $building = $ticket->device->tenants->first()->apartment->building ?? null;
        echo "✅ Building found via device: {$building->name} (ID: {$building->id})\n";
    }
    
    if (!$building) {
        echo "❌ No building found for this ticket\n";
        exit(1);
    }
    
    // 3. Buscar doormen del building
    $doormen = User::role('doorman')
        ->whereHas('doorman', function($query) use ($building) {
            $query->where('building_id', $building->id);
        })
        ->get();
    
    echo "📋 Found " . $doormen->count() . " doormen for building {$building->name}:\n";
    foreach ($doormen as $doorman) {
        echo "  - {$doorman->name} ({$doorman->email})\n";
    }
    
    // 4. Buscar owners del building
    $owners = User::role('owner')
        ->whereHas('owner', function($query) use ($building) {
            $query->where('building_id', $building->id);
        })
        ->get();
    
    echo "🏢 Found " . $owners->count() . " owners for building {$building->name}:\n";
    foreach ($owners as $owner) {
        echo "  - {$owner->name} ({$owner->email})\n";
    }
    
    // 5. Simular usuario que cambia el estado
    $user = User::role(['super-admin', 'technical'])->first();
    if (!$user) {
        echo "❌ No admin or technical user found\n";
        exit(1);
    }
    
    echo "👤 Using user for simulation: {$user->name} ({$user->email})\n";
    
    // 6. Probar el servicio de notificaciones
    echo "\n🔄 Testing notification service...\n";
    
    $notificationService = new NotificationDispatcherService();
    $oldStatus = $ticket->status;
    $newStatus = 'resolved';
    
    echo "📧 Dispatching notifications for status change: {$oldStatus} → {$newStatus}\n";
    
    $notificationService->dispatchTicketStatusChanged($ticket, $oldStatus, $newStatus, $user);
    
    echo "✅ Notification dispatch completed!\n";
    
    // 7. Verificar notificaciones en la base de datos
    echo "\n📊 Checking database notifications...\n";
    
    $notifications = \Illuminate\Notifications\DatabaseNotification::where('data->ticket_id', $ticket->id)
        ->where('created_at', '>=', now()->subMinutes(1))
        ->get();
    
    echo "📬 Found " . $notifications->count() . " recent notifications for this ticket:\n";
    
    foreach ($notifications as $notification) {
        $data = $notification->data;
        $user = User::find($notification->notifiable_id);
        echo "  - To: {$user->name} ({$user->email})\n";
        echo "    Type: {$data['type']}\n";
        echo "    Message: {$data['message']}\n";
        echo "    Role Context: " . ($data['role_context'] ?? 'N/A') . "\n";
        echo "    Created: {$notification->created_at}\n\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Test completed ===\n";
