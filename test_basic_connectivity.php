<?php
/**
 * Script simple para verificar conectividad básica del webhook
 */

$webhookUrl = 'https://www.adkassist.xyz/api/ninjaone/webhook';

// Payload mínimo para prueba
$payload = json_encode([
    'eventType' => 'test',
    'data' => []
]);

$headers = [
    'Content-Type: application/json',
    'User-Agent: SimpleTest/1.0'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_VERBOSE, true);

echo "🔗 Probando conectividad básica a: $webhookUrl\n";

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

echo "📡 HTTP Code: $httpCode\n";
echo "📄 Response: $response\n";

if ($error) {
    echo "❌ cURL Error: $error\n";
}

// Ahora probemos con GET para ver la respuesta
echo "\n🔍 Probando con GET request...\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $webhookUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$getResponse = curl_exec($ch);
$getHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "📡 GET HTTP Code: $getHttpCode\n";
echo "📄 GET Response: $getResponse\n";

echo "\nℹ️  Si GET devuelve 405 (Method Not Allowed), el endpoint existe y funciona\n";
