<?php

echo "🧪 Test LOCAL con formato NinjaOne REAL...\n\n";

// Usar el mismo payload que enviaría NinjaOne (formato anidado)
$webhookData = [
    "eventType" => "alert.created",
    "timestamp" => date('c'),
    "data" => [
        "alert" => [
            "id" => "juliopc_offline_alert_" . time(),
            "type" => "AGENT_OFFLINE",
            "severity" => "critical",
            "title" => "Device Offline - JULIOPC",
            "description" => "Device JULIOPC (DESKTOP-6VEP452) has been offline for 17 days and requires attention",
            "createdAt" => date('c'),
            "status" => "open"
        ],
        "device" => [
            "id" => "ninjaone_juliopc_real_id",
            "name" => "JULIOPC",  // ← Aquí está el nombre del dispositivo
            "displayName" => "JULIOPC",
            "systemName" => "DESKTOP-6VEP452",
            "type" => "WORKSTATION",
            "organizationId" => 1
        ],
        "organization" => [
            "id" => 1,
            "name" => "Virtual Lab"
        ]
    ]
];

echo "📡 Enviando webhook FORMATO NINJAONE para dispositivo JULIOPC...\n";
echo "URL: http://localhost/projects/ticketing/public/api/ninjaone/webhook\n";
echo "Formato: data.device.name = 'JULIOPC'\n\n";

// Enviar request al webhook LOCAL
$url = 'http://localhost/projects/ticketing/public/api/ninjaone/webhook';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($webhookData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'User-Agent: NinjaOne-Webhook/1.0'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "📊 Resultado del webhook FORMATO NINJAONE:\n";
echo "   HTTP Code: $httpCode\n";

if ($error) {
    echo "   ❌ Error: $error\n";
} else {
    echo "   ✅ Response: $response\n";
    
    $responseData = json_decode($response, true);
    if ($responseData) {
        echo "\n📋 Respuesta decodificada:\n";
        foreach ($responseData as $key => $value) {
            echo "   $key: $value\n";
        }
    }
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "🎯 TEST FORMATO NINJAONE REAL:\n";
if ($httpCode == 200) {
    echo "✅ El webhook puede procesar el formato real de NinjaOne\n";
} else {
    echo "❌ El webhook NO puede procesar el formato real de NinjaOne\n";
}

?>
