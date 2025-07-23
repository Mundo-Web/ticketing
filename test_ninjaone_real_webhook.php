<?php
/**
 * Test específico para simular exactamente como NinjaOne envía webhooks
 * NinjaOne NO envía firma HMAC en muchas configuraciones
 */

$webhookUrl = 'https://adkassist.xyz/api/ninjaone/webhook';

// Payload exacto como lo enviaría NinjaOne
$payload = [
    'eventType' => 'alert.created',
    'timestamp' => '2025-07-23T15:15:00Z',
    'data' => [
        'alert' => [
            'id' => 'ninjaone_real_alert_' . time(),
            'type' => 'AGENT_OFFLINE',
            'severity' => 'critical',
            'title' => 'Device Offline Alert',
            'description' => 'Device DamianPC has gone offline and is no longer responding',
            'createdAt' => '2025-07-23T15:15:00Z',
            'status' => 'open'
        ],
        'device' => [
            'id' => 'ninjaone_device_real_123',
            'name' => 'DamianPC',  
            'displayName' => 'DamianPC',
            'type' => 'WORKSTATION',
            'organizationId' => 1
        ],
        'organization' => [
            'id' => 1,
            'name' => 'Your Organization'
        ]
    ]
];

$jsonPayload = json_encode($payload);

// Headers como los envía NinjaOne (SIN X-NinjaOne-Signature)
$headers = [
    'Content-Type: application/json',
    'User-Agent: NinjaRMM-Webhook/1.0',
    'Accept: application/json'
];

echo "🎯 SIMULANDO WEBHOOK REAL DE NINJAONE\n";
echo "📍 URL: $webhookUrl\n";
echo "📦 Payload como lo enviaría NinjaOne:\n";
echo json_encode($payload, JSON_PRETTY_PRINT) . "\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Para testing

echo "📡 Enviando webhook...\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

echo "📊 RESULTADOS:\n";
echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($error) {
    echo "❌ cURL Error: $error\n";
} else {
    if ($httpCode == 200) {
        echo "✅ ¡SUCCESS! Webhook procesado correctamente\n";
        echo "🎉 NinjaOne integration is working!\n";
    } elseif ($httpCode == 403) {
        echo "⚠️  403 Forbidden - Posible problema de firma\n";
        echo "💡 NinjaOne puede que no esté enviando firma correctamente\n";
    } elseif ($httpCode == 405) {
        echo "ℹ️  405 Method Not Allowed - Solo para GET, esto es normal\n";
    } else {
        echo "❌ Error HTTP $httpCode\n";
    }
}

echo "\n🔍 Verificando base de datos...\n";

try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=ticketing', 'root', '');
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM ninja_one_alerts WHERE created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
    $recentCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo "📈 Alertas creadas en últimos 5 min: $recentCount\n";
    
    if ($recentCount > 0) {
        echo "✅ ¡Webhook está creando alertas en la base de datos!\n";
    }
} catch (Exception $e) {
    echo "❌ Error DB: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "CONCLUSIÓN:\n";
if ($httpCode == 200) {
    echo "🎯 Todo funcionando correctamente\n";
    echo "📋 Próximo paso: Configurar webhook en NinjaOne dashboard\n";
} else {
    echo "⚠️  Necesita ajustes en el servidor\n";
    echo "📋 Revisar configuración del webhook en producción\n";
}
echo str_repeat("=", 60) . "\n";
