<?php

/**
 * Script para corregir tipos de tokens push mal clasificados
 * 
 * Este script revisa todos los tokens en la base de datos y corrige
 * automáticamente aquellos que tienen el token_type incorrecto
 */

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
require_once __DIR__ . '/bootstrap/app.php';

use App\Models\PushToken;
use Illuminate\Support\Facades\Log;

echo "🔧 Corrigiendo tipos de tokens push...\n";
echo "=====================================\n\n";

// Function to detect token type
function detectTokenType($token) {
    if (strpos($token, 'ExponentPushToken[') === 0) {
        return 'expo';
    }
    
    if (strlen($token) > 100 && strpos($token, 'ExponentPushToken') === false) {
        return 'fcm';
    }
    
    return 'expo';
}

// Get all push tokens
$tokens = PushToken::all();
$corrected = 0;
$alreadyCorrect = 0;

echo "📊 Revisando {$tokens->count()} tokens...\n\n";

foreach ($tokens as $token) {
    $detectedType = detectTokenType($token->push_token);
    $currentType = $token->token_type;
    
    if ($detectedType !== $currentType) {
        echo "🔄 Corrigiendo token ID {$token->id}:\n";
        echo "   Token: " . substr($token->push_token, 0, 30) . "...\n";
        echo "   Tipo actual: {$currentType}\n";
        echo "   Tipo correcto: {$detectedType}\n";
        
        $token->update(['token_type' => $detectedType]);
        $corrected++;
        
        Log::info("Token type corrected", [
            'token_id' => $token->id,
            'tenant_id' => $token->tenant_id,
            'old_type' => $currentType,
            'new_type' => $detectedType,
            'token_preview' => substr($token->push_token, 0, 20) . '...'
        ]);
        
        echo "   ✅ Corregido\n\n";
    } else {
        $alreadyCorrect++;
    }
}

echo "📈 RESUMEN:\n";
echo "===========\n";
echo "✅ Tokens ya correctos: {$alreadyCorrect}\n";
echo "🔄 Tokens corregidos: {$corrected}\n";
echo "📊 Total procesados: {$tokens->count()}\n\n";

if ($corrected > 0) {
    echo "🎉 ¡Corrección completada! Las notificaciones push ahora deberían funcionar correctamente.\n";
} else {
    echo "👍 Todos los tokens ya tenían el tipo correcto.\n";
}

echo "\n🔄 Para aplicar los cambios, las próximas notificaciones usarán los tipos corregidos automáticamente.\n";