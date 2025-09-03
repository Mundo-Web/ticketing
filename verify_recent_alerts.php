<?php

/**
 * Verify Recent Alerts
 */

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\NinjaOneAlert;

echo "🔍 VERIFICANDO ALERTAS RECIENTES\n";
echo "================================\n\n";

$alerts = NinjaOneAlert::orderBy('created_at', 'desc')->limit(10)->get();

echo "📊 Últimas 10 alertas en la base de datos:\n";
foreach ($alerts as $alert) {
    echo "   - {$alert->title} (ID: {$alert->id}, Device ID: {$alert->device_id}, Created: {$alert->created_at})\n";
}

echo "\n🔍 Buscando alertas de webhook específicamente:\n";
$webhookAlerts = NinjaOneAlert::where('title', 'LIKE', '%WEBHOOK%')
                             ->orWhere('ninjaone_alert_id', 'LIKE', 'test-webhook-%')
                             ->orderBy('created_at', 'desc')
                             ->get();

if ($webhookAlerts->count() > 0) {
    echo "✅ Encontradas {$webhookAlerts->count()} alertas de webhook:\n";
    foreach ($webhookAlerts as $alert) {
        echo "   - {$alert->title} (Ninja ID: {$alert->ninjaone_alert_id}, Created: {$alert->created_at})\n";
    }
} else {
    echo "⚠️ No se encontraron alertas de webhook en la base de datos\n";
}

echo "\n✅ VERIFICACIÓN COMPLETADA\n";