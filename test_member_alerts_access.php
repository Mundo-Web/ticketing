<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🧪 PROBANDO ACCESO DE MEMBER A ALERTAS NINJAONE\n\n";

// 1. Simular autenticación del usuario portodo@gmail.com
$user = \App\Models\User::where('email', 'portodo@gmail.com')->first();
if (!$user) {
    echo "❌ Usuario portodo@gmail.com no encontrado\n";
    exit;
}

echo "👤 USUARIO AUTENTICADO:\n";
echo "   ID: {$user->id}\n";
echo "   Email: {$user->email}\n";
echo "   Roles: " . ($user->roles ? $user->roles->pluck('name')->implode(', ') : 'Sin roles') . "\n\n";

// 2. Simular la lógica del controlador NinjaOneAlertsController
echo "🔍 SIMULANDO LÓGICA DEL CONTROLADOR:\n";

// Get user's devices (owned and shared) - SAME LOGIC AS userDeviceAlerts
$userDeviceIds = collect();

// Get tenant (either user is a tenant or has a tenant relationship)
$tenant = $user->tenant ?? $user;
echo "Tenant encontrado: " . ($tenant ? "ID {$tenant->id}" : "NO") . "\n";

// Get devices owned by this tenant/user
if ($tenant && method_exists($tenant, 'devices')) {
    $ownedDevices = $tenant->devices()->get();
    $userDeviceIds = $userDeviceIds->merge($ownedDevices->pluck('id'));
    echo "Dispositivos del tenant: {$ownedDevices->count()}\n";
    foreach ($ownedDevices as $device) {
        echo "   - Device ID: {$device->id} | Nombre: {$device->name}\n";
    }
} else {
    echo "❌ Tenant no tiene método devices() o no existe\n";
}

echo "Total device IDs únicos: " . $userDeviceIds->unique()->count() . "\n";
echo "Device IDs: [" . $userDeviceIds->unique()->implode(', ') . "]\n\n";

// 3. Buscar alertas para esos dispositivos
echo "🚨 ALERTAS PARA LOS DISPOSITIVOS DEL USUARIO:\n";
if ($userDeviceIds->count() > 0) {
    $alerts = \App\Models\NinjaOneAlert::with(['device'])
        ->whereIn('device_id', $userDeviceIds->unique())
        ->orderBy('created_at', 'desc')
        ->get();
        
    echo "Total alertas encontradas: {$alerts->count()}\n";
    
    foreach ($alerts as $alert) {
        echo "   📍 Alert ID: {$alert->id}\n";
        echo "      Device: {$alert->device->name} (ID: {$alert->device_id})\n";
        echo "      Tipo: {$alert->alert_type}\n";
        echo "      Severidad: {$alert->severity}\n";
        echo "      Estado: {$alert->status}\n";
        echo "      Título: {$alert->title}\n";
        echo "      Fecha: {$alert->created_at}\n\n";
    }
} else {
    echo "❌ No hay dispositivos para este usuario\n";
}

echo str_repeat("=", 60) . "\n";
echo "🎯 RESULTADO:\n";
if ($userDeviceIds->count() > 0 && $userDeviceIds->contains(17)) {
    echo "✅ El usuario SÍ debería ver las alertas de JULIOPC\n";
    echo "✅ JULIOPC (ID: 17) está en los dispositivos del usuario\n";
} else {
    echo "❌ El usuario NO puede ver alertas de JULIOPC\n";
    echo "❌ JULIOPC (ID: 17) NO está en los dispositivos del usuario\n";
}

?>
