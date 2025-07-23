<?php
/**
 * Script para agregar el dispositivo JULIOPC a la base de datos
 * Esto permitirá que el webhook haga match con las alertas de NinjaOne
 */

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Device;
use App\Models\Building;
use App\Models\Apartment;
use App\Models\Tenant;

echo "🔧 AGREGANDO DISPOSITIVO JULIOPC A LA BASE DE DATOS\n";
echo "📍 Esto permitirá que el webhook procese alertas de este dispositivo\n\n";

// Verificar si ya existe
$existingDevice = Device::where('name', 'JULIOPC')
    ->orWhere('name', 'DESKTOP-6VEP452')
    ->first();

if ($existingDevice) {
    echo "⚠️  El dispositivo ya existe:\n";
    echo "   ID: {$existingDevice->id}\n";
    echo "   Nombre: {$existingDevice->name}\n";
    echo "   NinjaOne habilitado: " . ($existingDevice->ninjaone_enabled ? 'SÍ' : 'NO') . "\n\n";
    
    // Actualizar para habilitar NinjaOne si no está habilitado
    if (!$existingDevice->ninjaone_enabled) {
        $existingDevice->update([
            'ninjaone_enabled' => true,
            'ninjaone_device_id' => 'ninjaone_juliopc_desktop', // ID temporal
        ]);
        echo "✅ NinjaOne habilitado para el dispositivo existente\n";
    }
} else {
    echo "➕ Creando nuevo dispositivo JULIOPC...\n";
    
    // Buscar o crear edificio de prueba
    $building = Building::first();
    if (!$building) {
        echo "❌ No hay edificios en la base de datos. Creando edificio de prueba...\n";
        $building = Building::create([
            'name' => 'Virtual Lab Building',
            'address' => 'Virtual Lab Address',
            'location_link' => '-12.0464, -77.0428'
        ]);
        echo "✅ Edificio creado: {$building->name}\n";
    }
    
    // Buscar o crear apartamento de prueba
    $apartment = Apartment::where('building_id', $building->id)->first();
    if (!$apartment) {
        echo "➕ Creando apartamento de prueba...\n";
        $apartment = Apartment::create([
            'building_id' => $building->id,
            'number' => 'OFFICE-001',
            'floor' => 1
        ]);
        echo "✅ Apartamento creado: {$apartment->number}\n";
    }
    
    // Buscar o crear tenant (usuario) de prueba
    $tenant = Tenant::first();
    if (!$tenant) {
        echo "➕ Creando usuario de prueba para JULIOPC...\n";
        $tenant = Tenant::create([
            'name' => 'Julio',
            'lastname' => 'PC User',
            'email' => 'julio@example.com',
            'phone' => '999999999',
            'apartment_id' => $apartment->id,
            'status' => 'active'
        ]);
        echo "✅ Usuario creado: {$tenant->name} {$tenant->lastname}\n";
    }
    
    // Crear el dispositivo
    $device = Device::create([
        'name' => 'JULIOPC', // Nombre que aparece en NinjaOne
        'icon_id' => 1, // ID de icono por defecto
        'apartment_id' => $apartment->id,
        'ninjaone_enabled' => true,
        'ninjaone_device_id' => 'ninjaone_juliopc_desktop', // ID temporal, se actualizará con el real
        'status' => 'active',
        'description' => 'DESKTOP-6VEP452 - Windows Desktop (Virtual Lab)'
    ]);
    
    echo "✅ Dispositivo JULIOPC creado exitosamente!\n";
    echo "   ID: {$device->id}\n";
    echo "   Nombre: {$device->name}\n";
    echo "   Apartamento: {$apartment->number}\n";
    echo "   Edificio: {$building->name}\n";
    echo "   NinjaOne habilitado: SÍ\n\n";
    
    // Asignar el dispositivo al tenant (propietario)
    if ($tenant) {
        // Asignar como propietario usando la relación pivot
        $device->owner()->attach($tenant->id);
        echo "✅ Dispositivo asignado como propietario a: {$tenant->name} {$tenant->lastname}\n";
    }
}

echo "\n🎯 CONFIGURACIÓN COMPLETADA\n";
echo "📋 Ahora cuando NinjaOne envíe alertas para 'JULIOPC', el webhook podrá:\n";
echo "   ✅ Encontrar el dispositivo en la base de datos\n";
echo "   ✅ Crear la alerta automáticamente\n";
echo "   ✅ Notificar al propietario del dispositivo\n";
echo "   ✅ Permitir crear tickets desde la alerta\n\n";

echo "💡 NOTAS IMPORTANTES:\n";
echo "1. El dispositivo está configurado con nombre 'JULIOPC'\n";
echo "2. NinjaOne debe enviar el nombre exacto en el webhook\n";
echo "3. Si el nombre en NinjaOne es diferente, actualiza manualmente\n";
echo "4. El ID de NinjaOne se actualizará automáticamente cuando llegue la primera alerta\n\n";

echo "🔍 VERIFICAR EN:\n";
echo "- Panel de dispositivos: ver que aparezca JULIOPC\n";
echo "- Cuando llegue una alerta: debería procesarse automáticamente\n";
echo "- Interface de alertas: /ninjaone-alerts\n";
