<?php

/**
 * Create Test Alert Script
 */

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Device;
use App\Models\NinjaOneAlert;

echo "🧪 Creating test alert...\n";

try {
    // Get a device with NinjaOne integration
    $device = Device::whereNotNull('ninjaone_device_id')->first();
    
    if (!$device) {
        echo "❌ No device with NinjaOne integration found\n";
        exit(1);
    }
    
    echo "📱 Using device: {$device->name} (ID: {$device->id})\n";
    
    // Create test alert
    $alert = new NinjaOneAlert();
    $alert->device_id = $device->id;
    $alert->ninjaone_alert_id = 'test-alert-' . time();
    $alert->title = 'Dispositivo requiere atención - PRUEBA';
    $alert->description = 'Esta es una alerta de prueba para verificar que el sistema funciona correctamente. El dispositivo puede tener problemas de rendimiento o conectividad.';
    $alert->alert_type = 'system';
    $alert->severity = 'warning';
    $alert->status = 'open';
    $alert->save();
    
    echo "✅ Alerta de prueba creada exitosamente!\n";
    echo "   - ID de alerta: {$alert->id}\n";
    echo "   - Título: {$alert->title}\n";
    echo "   - Estado: {$alert->status}\n";
    echo "   - Severidad: {$alert->severity}\n";
    echo "\n";
    
    // Check total alerts now
    $totalAlerts = NinjaOneAlert::count();
    echo "📊 Total de alertas en la base de datos: {$totalAlerts}\n";
    
    // Check alerts for this device
    $deviceAlerts = NinjaOneAlert::where('device_id', $device->id)->count();
    echo "📱 Alertas para este dispositivo: {$deviceAlerts}\n";
    
    echo "\n🌐 Ahora ve a tu panel de alertas en el navegador para ver la alerta:\n";
    echo "   URL: http://localhost/projects/ticketing/public/alerts\n";
    echo "   (o la URL que uses para acceder a tu aplicación)\n";
    
} catch (Exception $e) {
    echo "❌ Error creating test alert: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n🎉 Test completado!\n";