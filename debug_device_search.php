<?php
/**
 * Debug: Verificar por qué no encuentra el dispositivo JULIOPC
 */

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Device;

echo "🔍 DEBUG: BÚSQUEDA DE DISPOSITIVO JULIOPC\n\n";

// 1. Verificar dispositivos en la base de datos
echo "1️⃣ Dispositivos en la base de datos:\n";
$devices = Device::all(['id', 'name', 'ninjaone_enabled']);
foreach ($devices as $device) {
    echo "   ID: {$device->id} | Nombre: '{$device->name}' | NinjaOne: " . ($device->ninjaone_enabled ? 'SÍ' : 'NO') . "\n";
}
echo "\n";

// 2. Buscar específicamente JULIOPC
echo "2️⃣ Búsqueda específica de 'JULIOPC':\n";
$searchName = 'JULIOPC';

// Prueba 1: Búsqueda exacta
$device1 = Device::where('name', $searchName)->first();
echo "   Búsqueda exacta: " . ($device1 ? "ENCONTRADO (ID: {$device1->id})" : "NO ENCONTRADO") . "\n";

// Prueba 2: Búsqueda insensible a mayúsculas
$device2 = Device::whereRaw('LOWER(name) = LOWER(?)', [$searchName])->first();
echo "   Búsqueda case-insensitive: " . ($device2 ? "ENCONTRADO (ID: {$device2->id})" : "NO ENCONTRADO") . "\n";

// Prueba 3: Usando el método findByName
$device3 = Device::findByName($searchName);
echo "   Método findByName: " . ($device3 ? "ENCONTRADO (ID: {$device3->id})" : "NO ENCONTRADO") . "\n";

// Prueba 4: Verificar con diferentes variaciones
$variations = ['JULIOPC', 'juliopc', 'JulioPC', 'Juliopc'];
echo "\n3️⃣ Probando variaciones del nombre:\n";
foreach ($variations as $variation) {
    $found = Device::findByName($variation);
    echo "   '{$variation}': " . ($found ? "ENCONTRADO (ID: {$found->id})" : "NO ENCONTRADO") . "\n";
}

// 4. Verificar dispositivos con NinjaOne habilitado
echo "\n4️⃣ Dispositivos con NinjaOne habilitado:\n";
$ninjaDevices = Device::where('ninjaone_enabled', true)->get(['id', 'name']);
foreach ($ninjaDevices as $device) {
    echo "   ID: {$device->id} | Nombre: '{$device->name}'\n";
}

// 5. Mostrar el dispositivo JULIOPC si existe
echo "\n5️⃣ Detalles del dispositivo JULIOPC:\n";
$julioDevice = Device::where('name', 'JULIOPC')->first();
if ($julioDevice) {
    echo "   ID: {$julioDevice->id}\n";
    echo "   Nombre: '{$julioDevice->name}'\n";
    echo "   NinjaOne habilitado: " . ($julioDevice->ninjaone_enabled ? 'SÍ' : 'NO') . "\n";
    echo "   NinjaOne Device ID: " . ($julioDevice->ninjaone_device_id ?? 'NULL') . "\n";
} else {
    echo "   ❌ No se encontró dispositivo con nombre 'JULIOPC'\n";
}

echo "\n🔧 POSIBLES SOLUCIONES:\n";
echo "1. Verificar que el nombre en la BD sea exactamente 'JULIOPC'\n";
echo "2. Verificar que ninjaone_enabled sea true\n";
echo "3. Verificar espacios en blanco en el nombre\n";
echo "4. Verificar caracteres especiales\n";
