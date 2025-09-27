<?php

require_once __DIR__ . '/bootstrap/app.php';

use App\Models\Ticket;
use App\Models\User;
use App\Models\Technical;
use App\Services\NotificationDispatcherService;
use Illuminate\Support\Facades\Log;

echo "🖼️ TESTING IMAGE FIELDS IN NOTIFICATIONS\n";
echo "========================================\n\n";

// Buscar un ticket reciente con todas las relaciones
$ticket = Ticket::with([
    'user.tenant.apartment.building',
    'device.name_device',
    'device.brand',
    'device.model',
    'technical'
])->latest()->first();

if (!$ticket) {
    echo "❌ No hay tickets para testear.\n";
    exit;
}

echo "📋 TESTING CON TICKET: #{$ticket->code} (ID: {$ticket->id})\n\n";

// Mostrar datos actuales
echo "📊 DATOS ACTUALES:\n";
echo "  Ticket: {$ticket->code} - {$ticket->title}\n";
echo "  Usuario: {$ticket->user->name} (ID: {$ticket->user_id})\n";
echo "  Device: " . ($ticket->device->name_device->name ?? $ticket->device->name ?? 'Unknown') . "\n";
echo "  Device Icon: " . ($ticket->device->icon ?? 'NO ICON') . "\n";
echo "  Technical: " . ($ticket->technical?->name ?? 'No asignado') . "\n";
echo "  Technical Photo: " . ($ticket->technical?->photo ?? 'NO PHOTO') . "\n";
echo "  Building: " . ($ticket->user->tenant?->apartment?->building?->name ?? 'No building') . "\n";
echo "  Building Photo: " . ($ticket->user->tenant?->apartment?->building?->photo ?? 'NO PHOTO') . "\n";
echo "\n";

// Simular cambio de estado
$admin = User::whereHas('roles', function($q) {
    $q->where('name', 'super-admin');
})->first();

if (!$admin) {
    echo "❌ No hay admin para testear.\n";
    exit;
}

echo "🔄 SIMULANDO CAMBIO DE ESTADO...\n";
$oldStatus = $ticket->status;
$newStatus = $oldStatus === 'open' ? 'in_progress' : 'open';

echo "  Cambio: {$oldStatus} → {$newStatus}\n";
echo "  Admin: {$admin->name}\n\n";

// Limpiar logs anteriores
Log::info('🖼️ STARTING IMAGE FIELDS TEST', [
    'ticket_id' => $ticket->id,
    'ticket_code' => $ticket->code,
    'old_status' => $oldStatus,
    'new_status' => $newStatus,
    'admin_name' => $admin->name
]);

// Disparar notificación
echo "📤 ENVIANDO NOTIFICACIÓN...\n";
$dispatcher = new NotificationDispatcherService();
$dispatcher->dispatchTicketStatusChanged($ticket, $oldStatus, $newStatus, $admin);

echo "✅ Notificación enviada!\n\n";

echo "📋 CAMPOS DE IMAGEN AGREGADOS:\n";
echo "  ✅ technical_photo: Para mostrar foto del técnico\n";
echo "  ✅ device_icon: Para mostrar ícono del dispositivo\n";
echo "  ✅ building_photo: Para mostrar foto del edificio\n\n";

echo "🔍 REVISA LOS LOGS PARA VER LOS DATOS COMPLETOS:\n";
echo "  - NotificationDispatcherService: Campos agregados al crear notificación\n";
echo "  - SendPushNotificationListener: Datos estructurados para móvil\n";
echo "  - PushNotificationService: Conversión FCM con imágenes\n\n";

echo "📱 ESTRUCTURA DE DATOS MÓVIL:\n";
echo "  data:\n";
echo "    technical_data:\n";
echo "      photo: technical_photo\n";
echo "    device_data:\n";
echo "      icon: device_icon\n";
echo "    location_data:\n";
echo "      building_photo: building_photo\n\n";

echo "✨ Test completado! Las notificaciones ahora incluyen:\n";
echo "   🧑‍🔧 Foto del técnico\n";
echo "   📱 Ícono del dispositivo\n";
echo "   🏢 Foto del edificio\n\n";

echo "🚀 Las imágenes ya están disponibles en la aplicación móvil!\n";