<?php

/**
 * Alternative Fix: Temporarily disable tenant filtering
 */

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Device;
use App\Models\User;
use App\Models\Tenant;

echo "🔍 ANÁLISIS: Verificando estructura de tenants y usuarios\n";
echo "========================================================\n\n";

try {
    // Verificar usuarios
    $users = User::all();
    echo "👥 Usuarios en el sistema: {$users->count()}\n";
    foreach ($users as $user) {
        echo "   - {$user->email} (ID: {$user->id})\n";
    }
    
    echo "\n🏢 Tenants en el sistema:\n";
    $tenants = Tenant::all();
    echo "Total tenants: {$tenants->count()}\n";
    foreach ($tenants as $tenant) {
        echo "   - Tenant ID: {$tenant->id}\n";
    }
    
    echo "\n📱 Dispositivos y sus tenants:\n";
    $devices = Device::with('tenants')->get();
    foreach ($devices as $device) {
        echo "   - {$device->name} (ID: {$device->id})\n";
        foreach ($device->tenants as $tenant) {
            echo "     → Tenant ID: {$tenant->id}\n";
        }
    }
    
    echo "\n🎯 SOLUCIÓN TEMPORAL:\n";
    echo "Vamos a crear un controlador modificado que no filtre por tenant\n";
    echo "para que puedas ver todas las alertas mientras configuramos correctamente\n";
    echo "la relación usuario-dispositivo.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n✅ ANÁLISIS COMPLETADO\n";