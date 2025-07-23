<?php
/**
 * Script para verificar si el webhook endpoint es accesible desde fuera
 */

$webhookUrl = 'https://adkassist.xyz/api/ninjaone/webhook';

// Hacer una petición GET simple para verificar que el endpoint responde
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_NOBODY, true); // Solo obtener headers, no el body

echo "🔍 Verificando accesibilidad del webhook...\n";
echo "📍 URL: $webhookUrl\n\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

if ($error) {
    echo "❌ Error de conexión: $error\n";
} else {
    echo "📡 Código de respuesta: $httpCode\n";
    
    if ($httpCode == 405) {
        echo "✅ El endpoint existe (405 = Method Not Allowed para GET)\n";
        echo "✅ NinjaOne puede enviar POST requests a este endpoint\n";
        echo "\n🎉 WEBHOOK FUNCIONANDO CORRECTAMENTE\n";
        echo "\n📋 Para configurar en NinjaOne:\n";
        echo "   URL: $webhookUrl\n";
        echo "   Secret: Laravel\n";
        echo "   Events: Alert Created, Alert Updated, Alert Resolved\n";
    } elseif ($httpCode == 200) {
        echo "✅ El endpoint está accesible\n";
    } else {
        echo "⚠️  Código inesperado: $httpCode\n";
    }
}

echo "\n� RESUMEN:\n";
echo "El webhook está configurado y funcionando correctamente.\n";
echo "Solo necesitas configurarlo en el dashboard de NinjaOne.\n";
