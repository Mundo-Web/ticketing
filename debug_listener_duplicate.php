<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Appointment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Event;

echo "🔍 Debug: Investigar por qué el listener se ejecuta dos veces\n";
echo "===========================================================\n\n";

// Agregar un contador en memoria para el listener
$listenerCount = 0;

// Registrar un listener temporal para contar las ejecuciones
Event::listen(\App\Events\AppointmentRescheduled::class, function($event) use (&$listenerCount) {
    $listenerCount++;
    Log::info("🔢 DEBUG: Listener ejecutado #{$listenerCount} para appointment {$event->appointment->id}");
});

try {
    $appointment = Appointment::with(['ticket.user', 'technical'])
        ->whereNotNull('technical_id')
        ->where('status', 'scheduled')
        ->first();

    if (!$appointment) {
        echo "❌ No hay citas disponibles\n";
        exit(1);
    }

    echo "📋 Appointment: {$appointment->id}\n";
    echo "🔄 Preparando para reagendar...\n\n";

    Log::info("🧪 DEBUG: INICIANDO TEST DE CONTEO");

    // Solo disparar el evento una vez
    $oldDate = $appointment->scheduled_for;
    $newDate = now()->addHours(2)->format('Y-m-d H:i:s');
    
    echo "⚡ Disparando evento AppointmentRescheduled una sola vez...\n";
    
    // Disparar directamente el evento (sin usar el método reschedule para evitar complicaciones)
    event(new \App\Events\AppointmentRescheduled($appointment, $oldDate, $newDate));
    
    // Esperar a que se procese
    sleep(2);
    
    echo "📊 Resultado:\n";
    echo "   🔢 Listener ejecutado: {$listenerCount} veces\n\n";
    
    if ($listenerCount === 1) {
        echo "✅ NORMAL: El listener se ejecutó 1 vez como esperado\n";
        echo "❓ El problema podría estar en el método reschedule() del modelo\n";
    } else {
        echo "🚨 PROBLEMA: El listener se ejecutó {$listenerCount} veces\n";
        echo "❓ Hay múltiples registros del listener\n";
    }

    echo "\n🔍 Verificando registros del listener...\n";
    
    // Contar cuántos listeners hay registrados para este evento
    $listeners = Event::getListeners(\App\Events\AppointmentRescheduled::class);
    echo "📋 Listeners registrados: " . count($listeners) . "\n";
    
    foreach ($listeners as $index => $listener) {
        echo "   - Listener #{$index}: " . get_class($listener) . "\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}