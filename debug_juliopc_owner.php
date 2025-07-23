<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔍 INVESTIGANDO DISPOSITIVO JULIOPC Y SU PROPIETARIO\n\n";

// 1. Verificar dispositivo JULIOPC
$device = \App\Models\Device::find(17);
if (!$device) {
    echo "❌ Dispositivo JULIOPC no encontrado\n";
    exit;
}

echo "📱 DISPOSITIVO:\n";
echo "   ID: {$device->id}\n";
echo "   Nombre: {$device->name}\n";
echo "   Apartment ID: {$device->apartment_id}\n";
echo "   NinjaOne habilitado: " . ($device->ninjaone_enabled ? 'SÍ' : 'NO') . "\n\n";

// 2. Verificar propietario del dispositivo
echo "👤 PROPIETARIO (RELACIÓN PIVOT):\n";
$owners = $device->tenants()->get(); // Usando tenants() en lugar de owner()
if ($owners->count() > 0) {
    foreach ($owners as $owner) {
        echo "   ID: {$owner->id}\n";
        echo "   Nombre: {$owner->name} {$owner->lastname}\n";
        echo "   Email: {$owner->email}\n";
        echo "   Apartment ID: {$owner->apartment_id}\n";
        echo "   Tipo relación: " . $owner->pivot->ownership_type . "\n";
    }
} else {
    echo "   ❌ NO HAY PROPIETARIOS EN LA TABLA PIVOT!\n";
    
    // Verificar si hay datos en la tabla pivot
    $pivotData = DB::table('tenant_device')->where('device_id', 17)->get();
    echo "   Registros en tenant_device: {$pivotData->count()}\n";
    foreach ($pivotData as $pivot) {
        echo "     - Tenant ID: {$pivot->tenant_id} | Device ID: {$pivot->device_id} | Tipo: {$pivot->ownership_type}\n";
    }
}

// 3. Verificar apartamento
$apartment = $device->apartment;
if ($apartment) {
    echo "\n🏠 APARTAMENTO:\n";
    echo "   ID: {$apartment->id}\n";
    echo "   Número: {$apartment->number}\n";
    echo "   Building ID: {$apartment->building_id}\n";
    
    // Verificar tenants del apartamento
    $tenants = \App\Models\Tenant::where('apartment_id', $apartment->id)->get();
    echo "   Tenants: {$tenants->count()}\n";
    foreach ($tenants as $tenant) {
        echo "     - {$tenant->name} {$tenant->lastname} ({$tenant->email})\n";
    }
}

// 4. Verificar alertas del dispositivo
echo "\n🚨 ALERTAS DE NINJAONE:\n";
$alerts = \App\Models\NinjaOneAlert::where('device_id', 17)->get();
echo "   Total alertas: {$alerts->count()}\n";
foreach ($alerts as $alert) {
    echo "   - ID: {$alert->id} | Tipo: {$alert->alert_type} | Severidad: {$alert->severity} | Estado: {$alert->status}\n";
    echo "     Título: {$alert->title}\n";
    echo "     Fecha: {$alert->created_at}\n\n";
}

// 5. Verificar si el usuario propietario puede ver las alertas
if ($owners->count() > 0) {
    echo "🔍 VERIFICANDO ACCESO A ALERTAS:\n";
    $owner = $owners->first();
    echo "¿El propietario debería poder ver las alertas de su dispositivo JULIOPC?\n";
    echo "- Dispositivo pertenece al apartamento: " . ($device->apartment_id ? 'SÍ' : 'NO') . "\n";
    echo "- Propietario vive en el apartamento: " . ($owner->apartment_id == $device->apartment_id ? 'SÍ' : 'NO') . "\n";
    echo "- Alertas existentes: {$alerts->count()}\n";
    echo "- Relación pivot configurada: SÍ\n";
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "CONCLUSIÓN:\n";
if ($alerts->count() > 0 && $owners->count() > 0) {
    echo "✅ El dispositivo tiene alertas Y tiene propietario en la pivot\n";
    echo "🎯 El propietario DEBERÍA ver las alertas en su dashboard\n";
    echo "⚠️ Si no las ve, hay un problema en la interfaz\n";
} else {
    echo "❌ Falta configuración:\n";
    if ($alerts->count() == 0) echo "   - No hay alertas\n";
    if ($owners->count() == 0) echo "   - No hay propietario asignado en la pivot\n";
}

?>
