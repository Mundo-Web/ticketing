<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Appointment;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Technical;
use Illuminate\Support\Facades\Log;

echo "🧪 Test Appointment Rescheduling Notifications\n";
echo "====================================================\n\n";

try {
    // Obtener una cita de prueba
    $appointment = Appointment::with(['ticket.user', 'technical'])
        ->whereNotNull('technical_id')
        ->where('status', 'scheduled')
        ->first();

    if (!$appointment) {
        echo "❌ No se encontró una cita programada con técnico para probar\n";
        exit(1);
    }

    echo "📋 Cita encontrada:\n";
    echo "   - ID: {$appointment->id}\n";
    echo "   - Ticket: {$appointment->ticket->code}\n";
    echo "   - Técnico: {$appointment->technical->name}\n";
    echo "   - Cliente: {$appointment->ticket->user->name}\n";
    echo "   - Fecha actual: {$appointment->scheduled_for}\n\n";

    // Guardamos la fecha original
    $originalDate = $appointment->scheduled_for;
    
    // Nueva fecha (agregar 2 horas)
    $newDate = now()->addHours(2)->format('Y-m-d H:i:s');
    
    echo "🔄 Reagendando cita a: {$newDate}\n";
    echo "====================================================\n\n";

    // Capturar logs durante el proceso
    Log::info("🧪 INICIANDO TEST DE REAGENDAMIENTO");
    
    // Reagendar la cita (esto debería disparar el evento)
    $appointment->reschedule($newDate, "Test de notificaciones de reagendamiento");
    
    echo "✅ Cita reagendada exitosamente!\n";
    echo "📧 Verifica los logs para confirmar que se enviaron las notificaciones\n\n";
    
    // Verificar notificaciones en la base de datos
    $technicalUser = User::where('email', $appointment->technical->email)->first();
    $memberUser = $appointment->ticket->user;
    
    if ($technicalUser) {
        $techNotifications = $technicalUser->notifications()
            ->where('type', 'App\\Notifications\\AppointmentRescheduledNotification')
            ->latest()
            ->take(1)
            ->get();
        
        echo "👤 Notificaciones del técnico: " . $techNotifications->count() . "\n";
        if ($techNotifications->count() > 0) {
            $data = $techNotifications->first()->data;
            echo "   - Título: {$data['title']}\n";
            echo "   - Mensaje: {$data['message']}\n";
        }
    }
    
    $memberNotifications = $memberUser->notifications()
        ->where('type', 'App\\Notifications\\AppointmentRescheduledNotification')
        ->latest()
        ->take(1)
        ->get();
    
    echo "👥 Notificaciones del cliente: " . $memberNotifications->count() . "\n";
    if ($memberNotifications->count() > 0) {
        $data = $memberNotifications->first()->data;
        echo "   - Título: {$data['title']}\n";
        echo "   - Mensaje: {$data['message']}\n";
    }
    
    echo "\n🎉 Test completado! Las notificaciones de reagendamiento deberían aparecer en tiempo real.\n";
    echo "💡 Tip: Abre el navegador y verifica que las notificaciones aparezcan automáticamente.\n";

} catch (Exception $e) {
    echo "❌ Error durante el test: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}