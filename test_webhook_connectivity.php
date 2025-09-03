<?php

/**
 * Test Webhook Endpoint - Verificar que esté funcionando
 */

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🌐 VERIFICANDO WEBHOOK ENDPOINT\n";
echo "================================\n\n";

$webhookUrl = "https://adkassist.com/api/ninjaone/webhook";

echo "📍 URL del webhook: {$webhookUrl}\n\n";

// Test 1: Verificar que la URL esté accesible
echo "1️⃣ Probando conectividad del webhook...\n";

$testData = [
    "event" => "test.webhook",
    "device_name" => "DAMIANPC",
    "data" => [
        "alert" => [
            "id" => "test-webhook-" . time(),
            "type" => "system",
            "severity" => "warning",
            "title" => "PRUEBA WEBHOOK - Tiempo Real",
            "description" => "Esta es una prueba de webhook para verificar la conectividad en tiempo real"
        ]
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'User-Agent: NinjaRMM-Webhook-Test'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Para pruebas

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    echo "❌ Error de conectividad: {$error}\n";
} else {
    echo "✅ Respuesta HTTP: {$httpCode}\n";
    echo "📄 Respuesta del servidor: {$response}\n";
    
    if ($httpCode == 200) {
        echo "🎉 ¡WEBHOOK FUNCIONANDO CORRECTAMENTE!\n";
    } else {
        echo "⚠️ Webhook respondió pero con código de error: {$httpCode}\n";
    }
}

echo "\n📋 Datos enviados al webhook:\n";
echo json_encode($testData, JSON_PRETTY_PRINT) . "\n";

// Test 2: Verificar que se creó la alerta en la base de datos
echo "\n2️⃣ Verificando si se creó la alerta en la base de datos...\n";

$alertId = "test-webhook-" . (time() - 10); // Buscar alertas de los últimos 10 segundos

use App\Models\NinjaOneAlert;

$recentAlerts = NinjaOneAlert::where('ninjaone_alert_id', 'LIKE', 'test-webhook-%')
                            ->where('created_at', '>=', now()->subMinutes(1))
                            ->orderBy('created_at', 'desc')
                            ->limit(5)
                            ->get();

if ($recentAlerts->count() > 0) {
    echo "✅ Se encontraron {$recentAlerts->count()} alertas recientes del webhook:\n";
    foreach ($recentAlerts as $alert) {
        echo "   - {$alert->title} (ID: {$alert->id}, Creada: {$alert->created_at})\n";
    }
} else {
    echo "⚠️ No se encontraron alertas recientes del webhook\n";
    echo "   Esto puede indicar que el webhook no está procesando correctamente\n";
}

echo "\n📊 CONFIGURACIÓN RECOMENDADA PARA NINJAONE:\n";
echo "============================================\n";
echo "URL: https://adkassist.com/api/ninjaone/webhook\n";
echo "Method: POST\n";
echo "Content-Type: application/json\n";
echo "Events to subscribe:\n";
echo "  ✅ Alert Created\n";
echo "  ✅ Alert Updated\n";
echo "  ✅ Alert Resolved\n";
echo "  ✅ Device Status Changed\n";
echo "  ✅ Device Offline\n";
echo "  ✅ Device Online\n";

echo "\n🔧 SIGUIENTES PASOS:\n";
echo "1. Configura estos eventos en NinjaOne Dashboard\n";
echo "2. Haz una prueba real generando una alerta en NinjaOne\n";
echo "3. Verifica que aparezca instantáneamente en tu web\n";

echo "\n✅ PRUEBA COMPLETADA\n";