<?php

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/bootstrap/app.php';

use App\Models\PushToken;
use Illuminate\Support\Facades\Log;

echo "🔍 DIAGNÓSTICO: Push Notifications Debug\n";
echo "=====================================\n\n";

// 1. Ver todos los tokens registrados
echo "📊 TOKENS REGISTRADOS:\n";
echo "=====================\n";

$tokens = PushToken::with('tenant')->get();

if ($tokens->isEmpty()) {
    echo "❌ NO HAY TOKENS REGISTRADOS\n";
    echo "   - La app móvil no está registrando tokens\n";
    echo "   - Verificar que la app esté llamando a register-push-token\n\n";
} else {
    foreach ($tokens as $token) {
        echo "🎯 Token ID: {$token->id}\n";
        echo "   Tenant: {$token->tenant_id}\n";
        echo "   Tipo: {$token->token_type}\n";
        echo "   Platform: {$token->platform}\n";
        echo "   Device: {$token->device_name}\n";
        echo "   Standalone: " . ($token->is_standalone ? 'YES' : 'NO') . "\n";
        echo "   Token: " . substr($token->push_token, 0, 50) . "...\n";
        echo "   Creado: {$token->created_at}\n";
        echo "   Activo: " . ($token->is_active ? 'YES' : 'NO') . "\n\n";
    }
}

// 2. Verificar configuración Firebase
echo "🔥 CONFIGURACIÓN FIREBASE:\n";
echo "=========================\n";

$firebaseCredentials = config('services.firebase.credentials');
$firebaseProjectId = config('services.firebase.project_id');

echo "Credentials: " . ($firebaseCredentials ?: 'NOT SET') . "\n";
echo "Project ID: " . ($firebaseProjectId ?: 'NOT SET') . "\n";

if ($firebaseCredentials) {
    $credentialsPath = $firebaseCredentials;
    if (file_exists($credentialsPath)) {
        echo "Archivo existe: ✅ YES\n";
    } else {
        echo "Archivo existe: ❌ NO - " . $credentialsPath . "\n";
    }
}

echo "\n";

// 3. Verificar clases Firebase
echo "📦 FIREBASE SDK:\n";
echo "===============\n";

if (class_exists('Kreait\Firebase\Factory')) {
    echo "Firebase SDK: ✅ INSTALLED\n";
} else {
    echo "Firebase SDK: ❌ NOT FOUND\n";
}

echo "\n";

// 4. Test de detección de tokens
echo "🔍 PRUEBA DE DETECCIÓN DE TOKENS:\n";
echo "=================================\n";

$testTokens = [
    'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' => 'Should be EXPO',
    'fGzKj5TvSUmoABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890' => 'Should be FCM',
    'short' => 'Should be EXPO (default)'
];

foreach ($testTokens as $testToken => $expected) {
    $detectedType = detectTokenType($testToken);
    echo "Token: " . substr($testToken, 0, 30) . "...\n";
    echo "Expected: {$expected}\n";
    echo "Detected: " . strtoupper($detectedType) . "\n";
    echo "Status: " . ($detectedType === strtolower(explode(' ', $expected)[2]) ? '✅ CORRECT' : '❌ WRONG') . "\n\n";
}

// 5. Últimas notificaciones enviadas
echo "📤 ÚLTIMAS NOTIFICACIONES (logs):\n";
echo "=================================\n";

$logFile = storage_path('logs/laravel.log');
if (file_exists($logFile)) {
    $logContent = file_get_contents($logFile);
    $pushLogs = array_slice(explode("\n", $logContent), -50); // Últimas 50 líneas
    
    $pushNotificationLines = array_filter($pushLogs, function($line) {
        return strpos($line, 'push') !== false || 
               strpos($line, 'Push') !== false || 
               strpos($line, 'FCM') !== false || 
               strpos($line, 'Expo') !== false;
    });
    
    if (empty($pushNotificationLines)) {
        echo "❌ NO HAY LOGS RECIENTES DE PUSH NOTIFICATIONS\n";
        echo "   - El sistema no está enviando notificaciones\n";
        echo "   - Verificar que los listeners estén activos\n";
    } else {
        echo "📋 Últimos logs relacionados con push:\n";
        foreach (array_slice($pushNotificationLines, -10) as $line) {
            echo "   " . trim($line) . "\n";
        }
    }
} else {
    echo "❌ ARCHIVO DE LOG NO ENCONTRADO: {$logFile}\n";
}

echo "\n";

// 6. Recomendaciones
echo "💡 RECOMENDACIONES:\n";
echo "==================\n";

if ($tokens->isEmpty()) {
    echo "1. 📱 MOBILE: Verificar que la app registre tokens al iniciar\n";
    echo "2. 🔗 API: Probar endpoint register-push-token manualmente\n";
} else {
    $hasExpo = $tokens->where('token_type', 'expo')->count() > 0;
    $hasFcm = $tokens->where('token_type', 'fcm')->count() > 0;
    
    if (!$hasFcm) {
        echo "1. 📱 APK: No hay tokens FCM registrados\n";
        echo "   - La app APK no está enviando tokens FCM\n";
        echo "   - Verificar configuración Firebase en mobile\n";
    }
    
    if (!file_exists($firebaseCredentials ?? '')) {
        echo "2. 🔥 FIREBASE: Archivo de credenciales faltante\n";
        echo "   - Descargar desde Firebase Console\n";
        echo "   - Colocar en: {$firebaseCredentials}\n";
    }
}

echo "\n";

function detectTokenType($token) {
    if (strpos($token, 'ExponentPushToken[') === 0) {
        return 'expo';
    }
    
    if (strlen($token) > 100 && strpos($token, 'ExponentPushToken') === false) {
        return 'fcm';
    }
    
    return 'expo';
}