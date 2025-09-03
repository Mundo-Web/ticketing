<?php

/**
 * Check Alert ID 4
 */

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\NinjaOneAlert;

echo "🔍 VERIFICANDO ALERT ID 4\n";
echo "========================\n\n";

$alert = NinjaOneAlert::find(4);

if ($alert) {
    echo "✅ Alert ID 4 encontrada:\n";
    echo "   Title: {$alert->title}\n";
    echo "   Device ID: {$alert->device_id}\n";
    echo "   NinjaOne Alert ID: {$alert->ninjaone_alert_id}\n";
    echo "   Created: {$alert->created_at}\n";
    echo "   Severity: {$alert->severity}\n";
    echo "   Status: {$alert->status}\n";
} else {
    echo "❌ Alert ID 4 no encontrada\n";
}

// Verificar todas las alertas recientes
echo "\n📊 Todas las alertas ordenadas por ID:\n";
$allAlerts = NinjaOneAlert::orderBy('id', 'desc')->limit(10)->get();
foreach ($allAlerts as $alert) {
    echo "   ID {$alert->id}: {$alert->title} (NinjaOne ID: {$alert->ninjaone_alert_id})\n";
}

echo "\n✅ VERIFICACIÓN COMPLETADA\n";