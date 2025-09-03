<?php

/**
 * Fix Device Tenant Assignment
 */

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Device;
use App\Models\User;

echo "🔧 SOLUCIONANDO: Asignación de dispositivos a tenant de usuario\n";
echo "===============================================================\n\n";

try {
    // Obtener usuario principal
    $user = User::first();
    $userTenant = $user->tenant ?? $user;
    
    echo "👤 Usuario: {$user->email}\n";
    echo "🏢 Tenant del usuario: ID {$userTenant->id}\n\n";
    
    // Obtener dispositivos con NinjaOne
    $devices = Device::whereNotNull('ninjaone_device_id')->get();
    
    echo "📱 Dispositivos encontrados: {$devices->count()}\n";
    
    foreach ($devices as $device) {
        echo "\n🔧 Procesando dispositivo: {$device->name} (ID: {$device->id})\n";
        
        // Obtener tenants actuales
        $currentTenants = $device->tenants()->get();
        echo "   Tenants actuales: {$currentTenants->count()}\n";
        foreach ($currentTenants as $tenant) {
            echo "     - Tenant ID: {$tenant->id}\n";
        }
        
        // Verificar si el dispositivo ya está asignado al tenant del usuario
        $hasUserTenant = $device->tenants()->where('tenant_id', $userTenant->id)->exists();
        
        if (!$hasUserTenant) {
            echo "   ✅ Asignando dispositivo al tenant del usuario...\n";
            
            // Asignar el dispositivo al tenant del usuario
            $device->tenants()->attach($userTenant->id);
            
            echo "   ✅ Dispositivo asignado exitosamente\n";
        } else {
            echo "   ℹ️ Dispositivo ya está asignado al tenant del usuario\n";
        }
        
        // Verificar tenants después de la asignación
        $updatedTenants = $device->tenants()->get();
        echo "   Tenants después de actualización: {$updatedTenants->count()}\n";
        foreach ($updatedTenants as $tenant) {
            echo "     - Tenant ID: {$tenant->id}" . ($tenant->id == $userTenant->id ? " (USUARIO)" : "") . "\n";
        }
    }
    
    echo "\n✅ CORRECCIÓN COMPLETADA\n";
    echo "\n🧪 Ahora ejecuta este comando para verificar:\n";
    echo "php debug_user_device_access.php\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🎯 PROCESO COMPLETADO\n";