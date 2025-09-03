<?php

/**
 * Test Super Admin Alert Access
 */

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\NinjaOneAlert;
use Illuminate\Support\Facades\Auth;

echo "🧪 PRUEBA: Acceso de Super Admin a alertas\n";
echo "==========================================\n\n";

try {
    // Simular autenticación con superadmin
    $superAdmin = User::where('email', 'superadmin@adk.com')->first();
    
    if (!$superAdmin) {
        echo "❌ No se encontró usuario superadmin@adk.com\n";
        $superAdmin = User::first();
        echo "🔄 Usando primer usuario disponible: {$superAdmin->email}\n";
    }
    
    Auth::login($superAdmin);
    
    echo "👤 Usuario autenticado: {$superAdmin->email} (ID: {$superAdmin->id})\n";
    
    // Verificar roles
    $roles = method_exists($superAdmin, 'roles') ? $superAdmin->roles->pluck('name') : collect();
    echo "🏷️ Roles del usuario: " . ($roles->count() > 0 ? $roles->implode(', ') : 'Sin roles definidos') . "\n";
    
    // Verificar si es super admin
    $isSuperAdmin = (method_exists($superAdmin, 'hasRole') && $superAdmin->hasRole('super_admin')) || 
                   $superAdmin->email === 'superadmin@adk.com' || 
                   $superAdmin->id === 1;
    
    echo "🔑 Es Super Admin: " . ($isSuperAdmin ? "SÍ" : "NO") . "\n\n";
    
    // Simular el comportamiento del controlador
    if ($isSuperAdmin) {
        echo "✅ SUPER ADMIN - Puede ver TODAS las alertas\n";
        $alertsQuery = NinjaOneAlert::with(['device']);
        $alerts = $alertsQuery->get();
        
        echo "📊 Total de alertas disponibles para super admin: {$alerts->count()}\n";
        
        foreach ($alerts as $alert) {
            $deviceName = $alert->device ? $alert->device->name : 'N/A';
            echo "   - {$alert->title} (Device: {$deviceName}, Severity: {$alert->severity})\n";
        }
    } else {
        echo "⚠️ USUARIO REGULAR - Solo puede ver alertas de sus dispositivos\n";
        // Lógica regular de filtrado por dispositivos del usuario
    }
    
    echo "\n🌐 Ahora puedes ir a tu navegador y visitar:\n";
    echo "   URL: http://localhost/projects/ticketing/public/ninjaone-alerts\n";
    echo "   (o la URL que uses para acceder a tu aplicación)\n";
    echo "\n✅ Deberías poder ver todas las alertas como super admin!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n🎯 PRUEBA COMPLETADA\n";