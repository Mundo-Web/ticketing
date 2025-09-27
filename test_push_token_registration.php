<?php

/**
 * Script para probar el registro de tokens push
 * Simula lo que debería hacer la app móvil
 */

echo "🧪 TESTING: Push Token Registration\n";
echo "===================================\n\n";

$baseUrl = 'http://localhost/api/tenant';

// Simular tokens de prueba
$testTokens = [
    [
        'name' => '📱 EXPO GO Token',
        'data' => [
            'push_token' => 'ExponentPushToken[TEST-EXPO-TOKEN-123456789]',
            'token_type' => 'expo',
            'platform' => 'android',
            'device_type' => 'phone',
            'device_name' => 'Test Device Expo Go',
            'app_ownership' => 'expo',
            'is_standalone' => false,
            'execution_environment' => 'expo'
        ]
    ],
    [
        'name' => '🤖 APK FCM Token',
        'data' => [
            'push_token' => 'fGzKj5TvSUmoABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890TEST',
            'token_type' => 'fcm',
            'platform' => 'android',
            'device_type' => 'phone', 
            'device_name' => 'Test Device APK',
            'app_ownership' => 'standalone',
            'is_standalone' => true,
            'execution_environment' => 'standalone'
        ]
    ]
];

foreach ($testTokens as $test) {
    echo "🔄 Probando: {$test['name']}\n";
    echo "================================\n";
    
    // Preparar request
    $jsonData = json_encode($test['data']);
    echo "📤 Request JSON:\n" . $jsonData . "\n\n";
    
    // Simular cURL request (necesitarás un token de auth válido)
    echo "📝 cURL Command:\n";
    echo "curl -X POST '$baseUrl/register-push-token' \\\n";
    echo "  -H 'Content-Type: application/json' \\\n";
    echo "  -H 'Authorization: Bearer YOUR_AUTH_TOKEN_HERE' \\\n";
    echo "  -d '$jsonData'\n\n";
    
    echo "⚠️  NOTA: Necesitas reemplazar YOUR_AUTH_TOKEN_HERE con un token válido\n";
    echo "   1. Hacer login desde la app móvil o Postman\n";
    echo "   2. Obtener el Bearer token\n";
    echo "   3. Usar ese token en el comando cURL\n\n";
    
    echo "───────────────────────────────────────────────────\n\n";
}

// Instrucciones para obtener token de auth
echo "🔐 CÓMO OBTENER TOKEN DE AUTH:\n";
echo "==============================\n";
echo "1. POST $baseUrl/../auth/login\n";
echo "   {\n";
echo "     \"email\": \"tu-email@test.com\",\n";
echo "     \"password\": \"tu-password\"\n";
echo "   }\n\n";
echo "2. De la respuesta, copiar el 'token' o 'access_token'\n";
echo "3. Usar como: Authorization: Bearer TOKEN_AQUI\n\n";

// Test de endpoint sin auth (para ver si funciona)
echo "🌐 TEST BÁSICO DE ENDPOINT:\n";
echo "===========================\n";
echo "curl -X POST '$baseUrl/register-push-token' \\\n";
echo "  -H 'Content-Type: application/json' \\\n";
echo "  -d '{\"test\":\"basic\"}'\n\n";
echo "📋 Si devuelve 'Unauthenticated' → El endpoint funciona\n";
echo "📋 Si devuelve error de conexión → Verificar servidor\n\n";

echo "🎯 PRÓXIMO PASO:\n";
echo "================\n";
echo "1. Hacer login y obtener token\n";
echo "2. Ejecutar los cURL commands de arriba\n";
echo "3. Verificar que aparezcan tokens con: php artisan push:debug\n";
echo "4. Enviar notificación de prueba\n\n";