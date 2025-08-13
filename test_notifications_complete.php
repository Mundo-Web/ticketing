<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

use App\Models\User;
use App\Models\Ticket;
use App\Models\Device;
use App\Models\Tenant;
use App\Notifications\TicketCreatedNotification;
use Illuminate\Support\Facades\Log;

echo "Testing ticket creation with direct notifications...\n\n";

try {
    // 1. Verificar los usuarios objetivo
    echo "=== CHECKING TARGET USERS ===\n";
    
    $admins = User::whereHas('roles', function ($query) {
        $query->whereIn('name', ['super-admin', 'admin']);
    })->get();
    
    echo "Admins found: " . $admins->count() . "\n";
    foreach ($admins as $admin) {
        echo "- {$admin->name} ({$admin->email})\n";
    }
    
    $defaultTechnicals = User::whereHas('roles', function ($query) {
        $query->where('name', 'technical');
    })->whereHas('technical', function ($query) {
        $query->where('is_default', true);
    })->get();
    
    echo "\nDefault technicals found: " . $defaultTechnicals->count() . "\n";
    foreach ($defaultTechnicals as $technical) {
        echo "- {$technical->name} ({$technical->email})\n";
    }
    
    // 2. Encontrar un usuario member para crear el ticket
    echo "\n=== FINDING MEMBER USER ===\n";
    $memberUser = User::whereHas('roles', function ($query) {
        $query->where('name', 'member');
    })->first();
    
    if (!$memberUser) {
        echo "No member user found!\n";
        exit;
    }
    
    echo "Member user: {$memberUser->name} ({$memberUser->email})\n";
    
    // 3. Encontrar un device para este member
    $tenant = Tenant::where('email', $memberUser->email)->first();
    if (!$tenant) {
        echo "No tenant found for member!\n";
        exit;
    }
    
    $device = $tenant->devices()->first();
    if (!$device) {
        echo "No device found for member!\n";
        exit;
    }
    
    echo "Device found: {$device->id}\n";
    
    // 4. Crear el ticket
    echo "\n=== CREATING TICKET ===\n";
    $ticketData = [
        'device_id' => $device->id,
        'category' => 'Test Notification',
        'title' => 'Test Direct Notifications - ' . date('Y-m-d H:i:s'),
        'description' => 'This is a test ticket to verify direct notifications to admins and default technicals',
        'status' => Ticket::STATUS_OPEN,
        'user_id' => $memberUser->id,
        'technical_id' => null,
        'attachments' => []
    ];
    
    $ticket = Ticket::create($ticketData);
    echo "Ticket created successfully!\n";
    echo "- ID: {$ticket->id}\n";
    echo "- Code: {$ticket->code}\n";
    echo "- Title: {$ticket->title}\n";
    
    // 5. Enviar notificaciones directamente
    echo "\n=== SENDING NOTIFICATIONS ===\n";
    
    // Limpiar notificaciones anteriores para esta prueba
    \Illuminate\Notifications\DatabaseNotification::where('data->ticket_id', $ticket->id)->delete();
    
    $totalNotifications = 0;
    
    // Admins
    foreach ($admins as $admin) {
        $admin->notify(new TicketCreatedNotification($ticket));
        $totalNotifications++;
        echo "✓ Notification sent to admin: {$admin->name}\n";
    }
    
    // Default technicals
    foreach ($defaultTechnicals as $technical) {
        $technical->notify(new TicketCreatedNotification($ticket));
        $totalNotifications++;
        echo "✓ Notification sent to default technical: {$technical->name}\n";
    }
    
    echo "\nTotal notifications sent: {$totalNotifications}\n";
    
    // 6. Verificar las notificaciones en la base de datos
    echo "\n=== VERIFYING NOTIFICATIONS IN DATABASE ===\n";
    
    $dbNotifications = \Illuminate\Notifications\DatabaseNotification::where('data->ticket_id', $ticket->id)->get();
    echo "Notifications found in database: " . $dbNotifications->count() . "\n\n";
    
    foreach ($dbNotifications as $notification) {
        $user = User::find($notification->notifiable_id);
        $data = json_decode($notification->data, true);
        echo "- User: {$user->name} ({$user->email})\n";
        echo "  Type: {$data['type']}\n";
        echo "  Message: {$data['message']}\n";
        echo "  Action URL: {$data['action_url']}\n";
        echo "  Created: {$notification->created_at}\n\n";
    }
    
    echo "✅ Test completed successfully!\n";
    echo "All admins and default technicals should now have notifications in their dashboard.\n";
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
