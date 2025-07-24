<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== DEBUGGING DEVICE MATCHING ===\n\n";

// Buscar el dispositivo DAMIANPC
echo "1. Buscando dispositivo local 'DAMIANPC':\n";
$damianDevice = App\Models\Device::where('name', 'DAMIANPC')->first();

if ($damianDevice) {
    echo "✅ Dispositivo encontrado:\n";
    echo "   - ID: {$damianDevice->id}\n";
    echo "   - Nombre: {$damianDevice->name}\n";
    echo "   - ninjaone_device_id: " . ($damianDevice->ninjaone_device_id ?? 'NULL') . "\n";
    echo "   - ninjaone_enabled: " . ($damianDevice->ninjaone_enabled ? 'true' : 'false') . "\n";
} else {
    echo "❌ No se encontró dispositivo con nombre exacto 'DAMIANPC'\n";
}

// Buscar dispositivos que contengan "DAMIAN"
echo "\n2. Buscando dispositivos que contengan 'DAMIAN':\n";
$damianDevices = App\Models\Device::where('name', 'LIKE', '%DAMIAN%')->get();

if ($damianDevices->count() > 0) {
    foreach ($damianDevices as $device) {
        echo "   - ID: {$device->id}, Nombre: '{$device->name}', ninjaone_device_id: " . ($device->ninjaone_device_id ?? 'NULL') . "\n";
    }
} else {
    echo "❌ No se encontraron dispositivos que contengan 'DAMIAN'\n";
}

// Mostrar todos los dispositivos locales
echo "\n3. Todos los dispositivos locales (primeros 10):\n";
$allDevices = App\Models\Device::take(10)->get();

foreach ($allDevices as $device) {
    echo "   - ID: {$device->id}, Nombre: '{$device->name}', ninjaone_device_id: " . ($device->ninjaone_device_id ?? 'NULL') . "\n";
}

// Contar dispositivos con y sin ninjaone_device_id
echo "\n4. Estadísticas:\n";
$totalDevices = App\Models\Device::count();
$devicesWithNinjaone = App\Models\Device::whereNotNull('ninjaone_device_id')->count();
$devicesWithoutNinjaone = App\Models\Device::whereNull('ninjaone_device_id')->count();

echo "   - Total dispositivos: {$totalDevices}\n";
echo "   - Con ninjaone_device_id: {$devicesWithNinjaone}\n";
echo "   - Sin ninjaone_device_id: {$devicesWithoutNinjaone}\n";
