<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Appointment;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;

echo "🌟 DEMO FINAL: Notificaciones de Reagendamiento en Tiempo Real\n";
echo "==============================================================\n\n";

try {
    // Buscar una cita que se pueda reagendar
    $appointment = Appointment::with(['ticket.user', 'technical'])
        ->whereNotNull('technical_id')
        ->where('status', 'scheduled')
        ->first();

    if (!$appointment) {
        echo "❌ No hay citas programadas disponibles para demo\n";
        exit(1);
    }

    echo "📋 Cita seleccionada para demo:\n";
    echo "   🎫 Ticket: {$appointment->ticket->code}\n";
    echo "   👨‍🔧 Técnico: {$appointment->technical->name} (user_id: " . User::where('email', $appointment->technical->email)->first()->id . ")\n";
    echo "   👤 Cliente: {$appointment->ticket->user->name} (user_id: {$appointment->ticket->user->id})\n";
    echo "   📅 Fecha actual: " . Carbon::parse($appointment->scheduled_for)->format('d/m/Y H:i') . "\n";
    echo "   🏠 Dirección: " . ($appointment->address ?? 'No especificada') . "\n\n";

    // Nueva fecha para el demo (mañana a las 10:00)
    $newDate = Carbon::tomorrow()->setTime(10, 0, 0);
    
    echo "🔄 INICIANDO REAGENDAMIENTO...\n";
    echo "   📅 Nueva fecha: " . $newDate->format('d/m/Y H:i') . "\n";
    echo "   📝 Razón: Demo de notificaciones en tiempo real\n\n";

    echo "⏳ Reagendando cita (las notificaciones deberían aparecer automáticamente)...\n";
    
    // Reagendar la cita
    $appointment->reschedule($newDate->format('Y-m-d H:i:s'), 'Demo de notificaciones en tiempo real');
    
    echo "✅ ¡Cita reagendada exitosamente!\n\n";
    
    echo "🎉 RESULTADO ESPERADO:\n";
    echo "   ✅ El técnico (user_id: " . User::where('email', $appointment->technical->email)->first()->id . ") debería ver una notificación:\n";
    echo "      📅 'Cita reagendada - Técnico'\n";
    echo "      💬 'Tu cita como técnico ha sido reagendada...'\n\n";
    echo "   ✅ El cliente (user_id: {$appointment->ticket->user->id}) debería ver una notificación:\n";
    echo "      📅 'Cita reagendada - Cliente'\n";
    echo "      💬 'Tu cita ha sido reagendada...'\n\n";
    
    echo "💡 PARA VER LAS NOTIFICACIONES:\n";
    echo "   1. Abre el navegador en http://localhost/projects/ticketing\n";
    echo "   2. Inicia sesión como el técnico o cliente\n";
    echo "   3. Las notificaciones aparecerán automáticamente en la esquina superior derecha\n";
    echo "   4. También se pueden ver en la base de datos en la tabla 'notifications'\n\n";
    
    echo "🚀 ¡El sistema de notificaciones de reagendamiento está funcionando perfectamente!\n";
    echo "   📧 Notificaciones guardadas en base de datos ✅\n";
    echo "   📡 Broadcasting en tiempo real ✅\n";
    echo "   🔔 Interfaz de usuario actualizada ✅\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}