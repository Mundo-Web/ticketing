<?php
/**
 * Script para probar el webhook de NinjaOne con datos reales
 * Simula una llamada real de NinjaOne para verificar que todo funciona
 */

// URL del webhook
$webhookUrl = 'https://adkassist.xyz/api/ninjaone/webhook';

// Secret para firmar el webhook (mismo que en .env)
$secret = 'e256e0691a9c365560b9c76817d82bf8954a86fa33467ad63df4edc781dec9b9';

// Datos de ejemplo que enviaría NinjaOne
$payload = [
    'eventType' => 'alert.created',
    'timestamp' => date('c'),
    'data' => [
        'alert' => [
            'id' => 'real_alert_' . time(),
            'type' => 'HIGH_CPU_USAGE',
            'severity' => 'high',
            'title' => 'High CPU Usage Detected',
            'description' => 'CPU usage has exceeded 90% for more than 5 minutes',
            'createdAt' => date('c'),
            'status' => 'open'
        ],
        'device' => [
            'id' => 'device_123_real',
            'name' => 'DamianPC',  // Usar un nombre de dispositivo que existe
            'displayName' => 'DamianPC',
            'type' => 'WORKSTATION',
            'os' => [
                'name' => 'Windows 11',
                'version' => '22H2'
            ]
        ],
        'organization' => [
            'id' => 1,
            'name' => 'Test Organization'
        ]
    ]
];

$jsonPayload = json_encode($payload);

// Crear firma HMAC
$signature = hash_hmac('sha256', $jsonPayload, $secret);

// Preparar headers
$headers = [
    'Content-Type: application/json',
    'X-NinjaOne-Signature: ' . $signature,
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

echo "🚀 Enviando webhook de prueba a: $webhookUrl\n";
echo "📝 Payload: " . json_encode($payload, JSON_PRETTY_PRINT) . "\n";
echo "🔐 Signature: $signature\n\n";

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
        echo "✅ ¡Webhook procesado correctamente!\n";
    } else {
        echo "⚠️  Webhook falló - Código: $httpCode\n";
    }
}

echo "\n🔍 Verificando alertas en la base de datos...\n";

// Verificar si se creó la alerta
$pdo = new PDO('mysql:host=127.0.0.1;dbname=ticketing', 'root', '');
$stmt = $pdo->query("SELECT COUNT(*) as count FROM ninja_one_alerts");
$count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

echo "📊 Alertas en la BD: $count\n";

if ($count > 0) {
    $stmt = $pdo->query("SELECT * FROM ninja_one_alerts ORDER BY id DESC LIMIT 1");
    $lastAlert = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "🆕 Última alerta creada: " . json_encode($lastAlert, JSON_PRETTY_PRINT) . "\n";
}

echo "\n✨ Prueba completada\n";
