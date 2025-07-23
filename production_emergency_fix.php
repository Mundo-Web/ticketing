<?php
/**
 * SOLUCIÓN DE EMERGENCIA - CONFIGURAR WEBHOOK SIN FIRMA
 * Subir este archivo al servidor y ejecutarlo para desactivar validación de firma
 */

// Este script debe ejecutarse en el servidor de producción

echo "🚨 CONFIGURACIÓN DE EMERGENCIA PARA PRODUCCIÓN\n";
echo "📍 Desactivando validación de firma temporalmente\n\n";

// Configurar para no requerir firma
if (file_exists('.env')) {
    $envContent = file_get_contents('.env');
    
    // Si ya existe NINJAONE_WEBHOOK_SECRET, comentarlo
    if (strpos($envContent, 'NINJAONE_WEBHOOK_SECRET=') !== false) {
        $envContent = str_replace('NINJAONE_WEBHOOK_SECRET=', '#NINJAONE_WEBHOOK_SECRET=', $envContent);
    } else {
        // Agregar configuración comentada
        $envContent .= "\n# NINJAONE_WEBHOOK_SECRET=Laravel";
    }
    
    file_put_contents('.env', $envContent);
    echo "✅ Configuración .env actualizada - firma desactivada\n";
} else {
    echo "❌ Archivo .env no encontrado\n";
}

// Limpiar cache si es posible
if (file_exists('artisan')) {
    echo "🔄 Intentando limpiar cache...\n";
    exec('php artisan config:clear 2>&1', $output, $return);
    if ($return === 0) {
        echo "✅ Cache de configuración limpiado\n";
    } else {
        echo "⚠️ No se pudo limpiar cache automáticamente\n";
    }
}

echo "\n📋 PASOS MANUALES NECESARIOS:\n";
echo "1. Ejecutar: php artisan config:clear\n";
echo "2. Reiniciar servidor web (nginx/apache)\n";
echo "3. Reiniciar PHP-FPM si aplica\n";
echo "4. Probar webhook nuevamente\n\n";

echo "⚠️ IMPORTANTE: Esta es una solución temporal\n";
echo "💡 Se recomienda subir el código actualizado del controlador\n";

// Crear archivo de verificación
file_put_contents('webhook_emergency_applied.txt', date('Y-m-d H:i:s') . " - Emergency webhook fix applied\n");
echo "✅ Archivo de verificación creado: webhook_emergency_applied.txt\n";
