<?php
/**
 * Script para verificar el estado del webhook en producción
 */

// URL para verificar el endpoint
$testUrl = 'https://adkassist.xyz/api/ninjaone/webhook';

echo "🔍 VERIFICANDO WEBHOOK EN PRODUCCIÓN\n";
echo "📍 URL: $testUrl\n\n";

// Test 1: Verificar que el endpoint existe
echo "1️⃣ Test de conectividad básica...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $testUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   GET Response: HTTP $httpCode\n";
echo "   " . ($httpCode == 405 ? "✅ Endpoint exists (405 Method Not Allowed is expected)" : "❌ Unexpected response") . "\n\n";

// Test 2: Verificar POST sin datos
echo "2️⃣ Test POST básico...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $testUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{}');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   POST Response: HTTP $httpCode\n";
echo "   Response: $response\n\n";

// Test 3: Verificar con payload mínimo válido
echo "3️⃣ Test con payload mínimo...\n";
$minimalPayload = json_encode([
    'eventType' => 'test',
    'data' => []
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $testUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $minimalPayload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   POST Minimal Response: HTTP $httpCode\n";
echo "   Response: $response\n\n";

// Test 4: Verificar otros endpoints para comparar
echo "4️⃣ Test endpoint de comparación...\n";
$testEndpoint = 'https://adkassist.xyz/api';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $testEndpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "   API Root Response: HTTP $httpCode\n\n";

echo "🔍 DIAGNÓSTICO:\n";
echo "- Si GET devuelve 405: ✅ Endpoint existe\n";
echo "- Si POST devuelve 403 'Invalid signature': ❌ Código no actualizado\n";
echo "- Si POST devuelve 400 'Invalid webhook data': ✅ Código actualizado\n";
echo "- Si POST devuelve 200: ✅ Todo funcionando\n\n";

echo "💡 POSIBLES SOLUCIONES:\n";
echo "1. El servidor de producción tiene cache activo\n";
echo "2. El código no se ha desplegado correctamente\n";
echo "3. Hay un proxy/CDN que está cacheando\n";
echo "4. Necesita reiniciar servicios web (nginx/apache/php-fpm)\n";
