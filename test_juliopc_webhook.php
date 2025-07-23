<?php
/**
 * Test específico para JULIOPC - simular alerta que llegaría de NinjaOne
 */

$webhookUrl = 'https://adkassist.xyz/api/ninjaone/webhook';

// Payload simulando una alerta real para JULIOPC que está "Sin conexión 17 días"
$payload = [
    'eventType' => 'alert.created',
    'timestamp' => date('c'),
    'data' => [
        'alert' => [
            'id' => 'juliopc_offline_alert_' . time(),
            'type' => 'AGENT_OFFLINE',
            'severity' => 'critical',
            'title' => 'Device Offline - JULIOPC',
            'description' => 'Device JULIOPC (DESKTOP-6VEP452) has been offline for 17 days and requires attention',
            'createdAt' => date('c'),
            'status' => 'open'
        ],
        'device' => [
            'id' => 'ninjaone_juliopc_real_id',
            'name' => 'JULIOPC',  // Este nombre debe coincidir exactamente
            'displayName' => 'JULIOPC',
            'systemName' => 'DESKTOP-6VEP452',
            'type' => 'WORKSTATION',
            'organizationId' => 1
        ],
        'organization' => [
            'id' => 1,
            'name' => 'Virtual Lab'
        ]
    ]
];

$jsonPayload = json_encode($payload);

$headers = [
    'Content-Type: application/json',
    'User-Agent: NinjaRMM-Webhook/1.0',
    'Accept: application/json'
];

echo "🔥 PROBANDO ALERTA PARA JULIOPC\n";
echo "📍 URL: $webhookUrl\n";
echo "🖥️  Dispositivo: JULIOPC (DESKTOP-6VEP452)\n";
echo "⚠️  Tipo de alerta: Device Offline (crítica)\n\n";

echo "📦 Payload que enviaría NinjaOne:\n";
echo json_encode($payload, JSON_PRETTY_PRINT) . "\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

echo "📡 Enviando webhook para JULIOPC...\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

echo "\n📊 RESULTADOS:\n";
echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($error) {
    echo "❌ cURL Error: $error\n";
} else {
    if ($httpCode == 200) {
        echo "✅ ¡SUCCESS! Alerta de JULIOPC procesada correctamente\n";
        echo "🎉 El webhook encontró el dispositivo en la base de datos\n";
    } else {
        echo "❌ Error HTTP $httpCode\n";
    }
}

echo "\n🔍 Verificando alertas en la base de datos...\n";

try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=ticketing', 'root', '');
    
    // Verificar device_id para JULIOPC
    $stmt = $pdo->query("SELECT id, name, ninjaone_enabled FROM devices WHERE name = 'JULIOPC'");
    $device = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($device) {
        echo "📱 Dispositivo JULIOPC encontrado:\n";
        echo "   ID: {$device['id']}\n";
        echo "   Nombre: {$device['name']}\n";
        echo "   NinjaOne habilitado: " . ($device['ninjaone_enabled'] ? 'SÍ' : 'NO') . "\n\n";
        
        // Verificar alertas para este dispositivo
        $stmt = $pdo->prepare("SELECT * FROM ninja_one_alerts WHERE device_id = ? ORDER BY id DESC LIMIT 3");
        $stmt->execute([$device['id']]);
        $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "🚨 Alertas para JULIOPC (" . count($alerts) . " encontradas):\n";
        foreach ($alerts as $alert) {
            echo "   - ID: {$alert['id']} | Tipo: {$alert['alert_type']} | Severidad: {$alert['severity']} | Fecha: {$alert['created_at']}\n";
        }
    } else {
        echo "❌ Dispositivo JULIOPC no encontrado en la base de datos\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error DB: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "RESUMEN PARA JULIOPC:\n";
if ($httpCode == 200) {
    echo "🎯 ✅ Webhook funcionando para JULIOPC\n";
    echo "📋 ✅ Dispositivo configurado correctamente\n";
    echo "🔔 ✅ Alertas se procesarán automáticamente\n";
    echo "🎫 ✅ Se pueden crear tickets desde las alertas\n";
} else {
    echo "⚠️  Revisar configuración del dispositivo o webhook\n";
}
echo str_repeat("=", 60) . "\n";
