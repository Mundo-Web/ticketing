<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;

echo "🔍 Debug: Verificar listeners registrados para AppointmentRescheduled\n";
echo "====================================================================\n\n";

// Obtener todos los listeners registrados para el evento
$listeners = Event::getListeners(\App\Events\AppointmentRescheduled::class);

echo "📋 Total de listeners registrados: " . count($listeners) . "\n\n";

foreach ($listeners as $index => $listener) {
    echo "Listener #{$index}:\n";
    
    if (is_object($listener)) {
        echo "  - Tipo: " . get_class($listener) . "\n";
    } elseif (is_callable($listener)) {
        if (is_array($listener)) {
            echo "  - Tipo: Array callable\n";
            echo "  - Clase: " . (is_object($listener[0]) ? get_class($listener[0]) : $listener[0]) . "\n";
            echo "  - Método: " . $listener[1] . "\n";
        } else {
            echo "  - Tipo: Callable\n";
            echo "  - Detalle: " . (is_string($listener) ? $listener : 'Closure') . "\n";
        }
    } else {
        echo "  - Tipo: " . gettype($listener) . "\n";
        echo "  - Valor: " . print_r($listener, true) . "\n";
    }
    echo "\n";
}

// Verificar si HandleAppointmentRescheduled aparece múltiples veces
$handleAppointmentRescheduledCount = 0;
foreach ($listeners as $listener) {
    if (is_array($listener) && 
        isset($listener[0]) && 
        (is_string($listener[0]) && $listener[0] === 'App\\Listeners\\HandleAppointmentRescheduled' ||
         is_object($listener[0]) && get_class($listener[0]) === 'App\\Listeners\\HandleAppointmentRescheduled')) {
        $handleAppointmentRescheduledCount++;
    }
}

echo "🎯 HandleAppointmentRescheduled registrado: {$handleAppointmentRescheduledCount} veces\n";

if ($handleAppointmentRescheduledCount > 1) {
    echo "🚨 PROBLEMA ENCONTRADO: El listener está registrado múltiples veces!\n";
} else {
    echo "✅ El listener HandleAppointmentRescheduled está registrado correctamente 1 vez\n";
    echo "❓ Los otros listeners podrían ser internos de Laravel o del broadcasting\n";
}