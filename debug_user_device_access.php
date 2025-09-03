<?php

/**
 * Debug User Device Access
 */

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\NinjaOneAlert;
use App\Models\Device;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

echo "🔍 DEBUG: Verificando acceso de usuario a dispositivos y alertas\n";
echo "=================================================================\n\n";

try {
    // Simular autenticación con el primer usuario disponible
    $user = User::first();
    if (!$user) {
        echo "❌ No se encontraron usuarios en la base de datos\n";
        exit(1);
    }
    
    echo "👤 Usuario: {$user->email} (ID: {$user->id})\n";
    
    // Verificar relación tenant
    $tenant = $user->tenant ?? $user;
    echo "🏢 Tenant: " . ($tenant ? "ID {$tenant->id}" : "No tenant") . "\n";
    
    // Verificar dispositivos del usuario
    $userDeviceIds = collect();
    
    if ($tenant && method_exists($tenant, 'devices')) {
        $ownedDevices = $tenant->devices()->get();
        $userDeviceIds = $userDeviceIds->merge($ownedDevices->pluck('id'));
        echo "📱 Dispositivos del tenant: {$ownedDevices->count()}\n";
        foreach ($ownedDevices as $device) {
            echo "   - {$device->name} (ID: {$device->id})\n";
        }
    } else {
        echo "⚠️ El tenant no tiene método 'devices' o no existe\n";
        
        // Intentar ver todos los dispositivos
        $allDevices = Device::all();
        echo "📱 Total dispositivos en sistema: {$allDevices->count()}\n";
        foreach ($allDevices as $device) {
            echo "   - {$device->name} (ID: {$device->id})\n";
        }
        
        // Para propósitos de debugging, usar todos los dispositivos
        $userDeviceIds = $allDevices->pluck('id');
    }
    
    echo "\n📊 IDs de dispositivos del usuario: " . $userDeviceIds->implode(', ') . "\n";
    
    // Verificar alertas para estos dispositivos
    $alerts = NinjaOneAlert::with(['device'])
        ->whereIn('device_id', $userDeviceIds->unique())
        ->get();
    
    echo "\n🚨 Alertas para dispositivos del usuario: {$alerts->count()}\n";
    foreach ($alerts as $alert) {
        $deviceName = $alert->device ? $alert->device->name : 'N/A';
        echo "   - {$alert->title} (Device: {$deviceName}, Severity: {$alert->severity})\n";
    }
    
    // Verificar todas las alertas en la base de datos
    $allAlerts = NinjaOneAlert::with(['device'])->get();
    echo "\n📋 TODAS las alertas en la base de datos: {$allAlerts->count()}\n";
    foreach ($allAlerts as $alert) {
        $deviceName = $alert->device ? $alert->device->name : 'N/A';
        echo "   - {$alert->title} (Device ID: {$alert->device_id}, Device: {$deviceName})\n";
    }
    
    // Verificar si hay problema de relación dispositivo-usuario
    echo "\n🔗 Verificando relaciones dispositivo-usuario:\n";
    
    // Obtener dispositivos con alertas
    $devicesWithAlerts = Device::whereIn('id', $allAlerts->pluck('device_id')->unique())->get();
    foreach ($devicesWithAlerts as $device) {
        echo "   - Dispositivo: {$device->name} (ID: {$device->id})\n";
        
        // Verificar si este dispositivo tiene tenants
        if (method_exists($device, 'tenants')) {
            $tenants = $device->tenants()->get();
            echo "     Tenants: {$tenants->count()}\n";
            foreach ($tenants as $deviceTenant) {
                echo "       - Tenant ID: {$deviceTenant->id}\n";
            }
        } else {
            echo "     ⚠️ Dispositivo no tiene relación con tenants\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🎯 DIAGNÓSTICO COMPLETADO\n";