<?php
/**
 * Script para probar webhook SIN validación de firma (solo para debug)
 */

// URL del webhook  
$webhookUrl = 'https://www.adkassist.xyz/api/ninjaone/webhook';

// Datos de ejemplo que enviaría NinjaOne
$payload = [
    'eventType' => 'alert.created',
    'timestamp' => date('c'),
    'data' => [
        'alert' => [
            'id' => 'debug_alert_' . time(),
            'type' => 'DEBUG_TEST',
            'severity' => 'high',
            'title' => 'Debug Test Alert',
            'description' => 'This is a debug test to verify webhook processing',
            'createdAt' => date('c'),
            'status' => 'open'
        ],
        'device' => [
            'id' => 'device_debug_test',
            'name' => 'DamianPC',
            'displayName' => 'DamianPC',
            'type' => 'WORKSTATION'
        ]
    ]
];

$jsonPayload = json_encode($payload);

// NO enviar firma para probar si es problema de validación
$headers = [
    'Content-Type: application/json',
    'User-Agent: NinjaOne-Webhook/1.0'
];

// Enviar request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

echo "🚀 Enviando webhook SIN FIRMA a: $webhookUrl\n";
echo "📝 Payload: " . json_encode($payload, JSON_PRETTY_PRINT) . "\n\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

if ($error) {
    echo "❌ Error cURL: $error\n";
} else {
    echo "📡 Respuesta HTTP: $httpCode\n";
    echo "📄 Respuesta: $response\n";
    
    if ($httpCode == 200) {
        echo "✅ ¡Webhook procesado sin firma!\n";
        echo "💡 Esto significa que el problema es la validación de firma\n";
    } else {
        echo "⚠️  Webhook falló sin firma - Código: $httpCode\n";
    }
}

echo "\n✨ Debug completado\n";
