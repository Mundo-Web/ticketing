<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Appointment;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

echo "🔧 Test Corregido: Notificaciones de Reagendamiento (Sin Duplicados)\n";
echo "==================================================================\n\n";

try {
    // Buscar una cita que se pueda reagendar
    $appointment = Appointment::with(['ticket.user', 'technical'])
        ->whereNotNull('technical_id')
        ->where('status', 'scheduled')
        ->first();

    if (!$appointment) {
        echo "❌ No hay citas programadas disponibles para probar\n";
        exit(1);
    }

    $technicalUser = User::where('email', $appointment->technical->email)->first();
    $memberUser = $appointment->ticket->user;

    echo "📋 Preparando test:\n";
    echo "   🎫 Ticket: {$appointment->ticket->code}\n";
    echo "   👨‍🔧 Técnico: {$appointment->technical->name} (user_id: {$technicalUser->id})\n";
    echo "   👤 Cliente: {$memberUser->name} (user_id: {$memberUser->id})\n";
    echo "   📅 Fecha actual: " . Carbon::parse($appointment->scheduled_for)->format('d/m/Y H:i') . "\n\n";

    // Contar notificaciones antes del test
    $techNotificationsBefore = $technicalUser->notifications()->count();
    $memberNotificationsBefore = $memberUser->notifications()->count();
    
    echo "📊 Notificaciones ANTES del test:\n";
    echo "   👨‍🔧 Técnico: {$techNotificationsBefore} notificaciones\n";
    echo "   👤 Cliente: {$memberNotificationsBefore} notificaciones\n\n";

    // Nueva fecha para el test
    $newDate = Carbon::now()->addHours(3);
    
    echo "🔄 REAGENDANDO CITA...\n";
    echo "   📅 Nueva fecha: " . $newDate->format('d/m/Y H:i') . "\n";
    echo "   📝 Razón: Test de corrección de duplicados\n\n";

    Log::info("🧪 INICIANDO TEST CORREGIDO DE REAGENDAMIENTO");
    
    // Reagendar la cita
    $appointment->reschedule($newDate->format('Y-m-d H:i:s'), 'Test de corrección de duplicados');
    
    // Esperar un momento para que se procesen las notificaciones
    sleep(1);
    
    // Contar notificaciones después del test
    $techNotificationsAfter = $technicalUser->fresh()->notifications()->count();
    $memberNotificationsAfter = $memberUser->fresh()->notifications()->count();
    
    echo "📊 Notificaciones DESPUÉS del test:\n";
    echo "   👨‍🔧 Técnico: {$techNotificationsAfter} notificaciones (+". ($techNotificationsAfter - $techNotificationsBefore) .")\n";
    echo "   👤 Cliente: {$memberNotificationsAfter} notificaciones (+". ($memberNotificationsAfter - $memberNotificationsBefore) .")\n\n";

    // Verificar las últimas notificaciones específicas
    $lastTechNotification = $technicalUser->fresh()->notifications()
        ->where('type', 'App\\Notifications\\AppointmentRescheduledNotification')
        ->latest()
        ->first();
        
    $lastMemberNotification = $memberUser->fresh()->notifications()
        ->where('type', 'App\\Notifications\\AppointmentRescheduledNotification')
        ->latest()
        ->first();

    echo "✅ RESULTADOS:\n";
    if ($lastTechNotification) {
        echo "   👨‍🔧 Última notificación técnico: {$lastTechNotification->data['title']}\n";
        echo "      💬 {$lastTechNotification->data['message']}\n";
    }
    
    if ($lastMemberNotification) {
        echo "   👤 Última notificación cliente: {$lastMemberNotification->data['title']}\n";
        echo "      💬 {$lastMemberNotification->data['message']}\n";
    }

    echo "\n🎯 ESPERADO:\n";
    echo "   ✅ Cada usuario debe tener exactamente 1 nueva notificación\n";
    echo "   ✅ No debe haber duplicados en la interfaz\n";
    echo "   ✅ Las notificaciones deben llegar en tiempo real\n\n";
    
    if (($techNotificationsAfter - $techNotificationsBefore) === 1 && 
        ($memberNotificationsAfter - $memberNotificationsBefore) === 1) {
        echo "🎉 ¡PERFECTO! Se creó exactamente 1 notificación por usuario\n";
        echo "✅ El problema de duplicados debería estar resuelto\n";
    } else {
        echo "⚠️  Verificar: Se esperaba 1 notificación nueva por usuario\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}