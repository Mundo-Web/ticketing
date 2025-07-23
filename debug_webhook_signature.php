<?php

require_once 'vendor/autoload.php';

// Cargar la configuración de Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Obtener el secreto de configuración
$secret = config('services.ninjaone.webhook_secret');

echo "=== DEBUG WEBHOOK SIGNATURE ===\n";
echo "Secret configurado: " . ($secret ? "SÍ (longitud: " . strlen($secret) . ")" : "NO") . "\n";
echo "Secret valor: " . $secret . "\n\n";

// Datos de prueba exactos del test
$testData = [
    'eventType' => 'alert.created',
    'data' => [
        'alert' => [
            'id' => 'test-alert-123',
            'type' => 'DISK_SPACE',
            'severity' => 'high',
            'title' => 'Disk Space Low',
            'description' => 'Disk space is running low on device',
            'createdAt' => '2025-07-23T10:00:00Z'
        ],
        'device' => [
            'id' => 'ninjaone-device-456',
            'name' => 'DamianPC',
            'displayName' => 'DamianPC'
        ]
    ]
];

$payload = json_encode($testData);
echo "Payload para firmar:\n" . $payload . "\n\n";

// Calcular la firma esperada
$expectedSignature = hash_hmac('sha256', $payload, $secret);
echo "Firma esperada: " . $expectedSignature . "\n";

// La firma que enviamos en el test
$testSignature = '46ecf857dcb697c213030669d8df2b26d3af150a15a81a71fef5a0eef121d5b1';
echo "Firma del test: " . $testSignature . "\n";

echo "¿Coinciden? " . ($expectedSignature === $testSignature ? "SÍ" : "NO") . "\n\n";

// Probar con diferentes variaciones del payload
echo "=== PROBANDO VARIACIONES ===\n";

// Sin espacios
$payloadNoSpaces = json_encode($testData, JSON_UNESCAPED_SLASHES);
$signatureNoSpaces = hash_hmac('sha256', $payloadNoSpaces, $secret);
echo "Sin espacios: " . $signatureNoSpaces . "\n";
echo "¿Coincide? " . ($signatureNoSpaces === $testSignature ? "SÍ" : "NO") . "\n\n";

// Pretty print
$payloadPretty = json_encode($testData, JSON_PRETTY_PRINT);
$signaturePretty = hash_hmac('sha256', $payloadPretty, $secret);
echo "Pretty print: " . $signaturePretty . "\n";
echo "¿Coincide? " . ($signaturePretty === $testSignature ? "SÍ" : "NO") . "\n\n";

// Vamos a probar qué payload genera la firma que tenemos
echo "=== INGENIERÍA INVERSA ===\n";
echo "Intentando diferentes payloads para generar la firma: " . $testSignature . "\n";

// Probar payload simple
$simplePayload = '{"eventType":"alert.created","data":{"alert":{"id":"test-alert-123","type":"DISK_SPACE","severity":"high","title":"Disk Space Low","description":"Disk space is running low on device","createdAt":"2025-07-23T10:00:00Z"},"device":{"id":"ninjaone-device-456","name":"DamianPC","displayName":"DamianPC"}}}';
$simpleSignature = hash_hmac('sha256', $simplePayload, $secret);
echo "Payload compacto: " . $simpleSignature . "\n";
echo "¿Coincide? " . ($simpleSignature === $testSignature ? "SÍ" : "NO") . "\n\n";
