<?php

echo "🧪 Test LOCAL del webhook para JULIOPC...\n\n";

// Simular webhook de NinjaOne para JULIOPC
$webhookData = [
    "device_name" => "JULIOPC",
    "alert_type" => "device_offline", 
    "severity" => "critical",
    "message" => "Device JULIOPC has been offline for 17 days",
    "timestamp" => date('c'),
    "ninjaone_device_id" => "ninjaone_juliopc_desktop",
    "offline_duration" => "17 days"
];

echo "📡 Enviando webhook LOCAL para dispositivo JULIOPC...\n";
echo "URL: http://localhost/projects/ticketing/public/api/ninjaone/webhook\n";
echo "Datos: " . json_encode($webhookData, JSON_PRETTY_PRINT) . "\n\n";

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

echo "📊 Resultado del webhook LOCAL:\n";
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
echo "🎯 COMPARACIÓN LOCAL vs PRODUCCIÓN:\n";
echo "   LOCAL: Controlador actualizado con Device::findByName()\n";
echo "   PRODUCCIÓN: Necesita sincronización del controlador\n";
echo str_repeat("=", 60) . "\n";

?>
