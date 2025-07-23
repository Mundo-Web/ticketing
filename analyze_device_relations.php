<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🔍 ANÁLISIS COMPLETO DE RELACIONES DISPOSITIVO JULIOPC\n\n";

// 1. Verificar dispositivo JULIOPC
$device = \App\Models\Device::find(17);
if (!$device) {
    echo "❌ Dispositivo ID 17 no encontrado\n";
    exit;
}

echo "📱 DISPOSITIVO JULIOPC:\n";
echo "   ID: {$device->id}\n";
echo "   Nombre: {$device->name}\n";
echo "   Apartment ID: {$device->apartment_id}\n\n";

// 2. Verificar tabla pivot device_tenant (members)
echo "👥 RELACIÓN DEVICE-TENANT (PIVOT TABLE):\n";
$pivotRecords = \DB::table('device_tenant')->where('device_id', 17)->get();
echo "   Registros en device_tenant: {$pivotRecords->count()}\n";
foreach ($pivotRecords as $pivot) {
    echo "   - Device ID: {$pivot->device_id} → Tenant ID: {$pivot->tenant_id}\n";
    
    // Obtener datos del tenant
    $tenant = \App\Models\Tenant::find($pivot->tenant_id);
    if ($tenant) {
        echo "     Tenant: {$tenant->name} {$tenant->lastname} ({$tenant->email})\n";
        echo "     Apartment ID: {$tenant->apartment_id}\n";
        
        // Verificar apartamento del tenant
        $apartment = $tenant->apartment;
        if ($apartment) {
            echo "     Apartamento: {$apartment->number} (Floor: {$apartment->floor})\n";
            echo "     Building ID: {$apartment->building_id}\n";
            
            // Verificar building
            $building = $apartment->building;
            if ($building) {
                echo "     Building: {$building->name}\n";
            }
        }
    }
    echo "\n";
}

// 3. Verificar alertas existentes de JULIOPC
echo "🚨 ALERTAS DE NINJAONE PARA JULIOPC:\n";
$alerts = \App\Models\NinjaOneAlert::where('device_id', 17)->get();
echo "   Total alertas: {$alerts->count()}\n";
foreach ($alerts as $alert) {
    echo "   - ID: {$alert->id} | Tipo: {$alert->alert_type} | Severidad: {$alert->severity}\n";
    echo "     Título: {$alert->title}\n";
    echo "     Estado: {$alert->status}\n";
    echo "     Fecha: {$alert->created_at}\n\n";
}

// 4. Verificar si hay usuario logueado que sea member de ese apartamento
if ($pivotRecords->count() > 0) {
    $firstTenant = \App\Models\Tenant::find($pivotRecords->first()->tenant_id);
    if ($firstTenant && $firstTenant->apartment_id) {
        echo "🔍 VERIFICANDO ACCESO DE MEMBERS DEL APARTAMENTO:\n";
        
        // Buscar todos los tenants del mismo apartamento
        $apartmentTenants = \App\Models\Tenant::where('apartment_id', $firstTenant->apartment_id)->get();
        echo "   Tenants en apartamento {$firstTenant->apartment_id}: {$apartmentTenants->count()}\n";
        
        foreach ($apartmentTenants as $tenant) {
            echo "   - {$tenant->name} {$tenant->lastname} ({$tenant->email})\n";
            
            // Verificar si tiene usuario asociado
            $user = \App\Models\User::where('email', $tenant->email)->first();
            if ($user) {
                echo "     ✅ Tiene usuario: ID {$user->id}\n";
                echo "     Roles: " . ($user->roles ? $user->roles->pluck('name')->implode(', ') : 'Sin roles') . "\n";
            } else {
                echo "     ❌ NO tiene usuario en la tabla users\n";
            }
        }
    }
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "🎯 DIAGNÓSTICO:\n";

if ($pivotRecords->count() == 0) {
    echo "❌ PROBLEMA: No hay relación device_tenant para JULIOPC\n";
    echo "   Solución: Ejecutar add_juliopc_device.php para crear la relación\n";
} else {
    echo "✅ Relación device_tenant existe\n";
    
    if ($alerts->count() == 0) {
        echo "❌ PROBLEMA: No hay alertas de NinjaOne para mostrar\n";
        echo "   Solución: Ejecutar webhook test para crear alertas\n";
    } else {
        echo "✅ Alertas existen\n";
        echo "🎯 NEXT STEP: Verificar por qué el member no ve las alertas en la interfaz\n";
        echo "   - Revisar endpoint /ninjaone-alerts\n";
        echo "   - Verificar que el usuario esté logueado como member\n";
        echo "   - Verificar filtros en el controlador\n";
    }
}

?>
