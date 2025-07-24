<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== NINJAONE DEVICE INVENTORY TEST - FULL DATA ===\n\n";

use App\Services\NinjaOneService;
use App\Models\Device;

try {
    $ninjaOneService = app(NinjaOneService::class);
    
    echo "1. ✅ Conectando a NinjaOne...\n";
    
    // Obtener todos los dispositivos de NinjaOne (info básica)
    $ninjaOneBasicDevices = $ninjaOneService->getAllDevices();
    
    if (!$ninjaOneBasicDevices || count($ninjaOneBasicDevices) === 0) {
        echo "❌ No se encontraron dispositivos en NinjaOne\n";
        exit;
    }
    
    echo "✅ Encontrados " . count($ninjaOneBasicDevices) . " dispositivos en NinjaOne\n";
    echo "🔄 Obteniendo información detallada de cada dispositivo...\n\n";
    
    // Obtener información detallada de cada dispositivo
    $ninjaOneDevices = [];
    foreach ($ninjaOneBasicDevices as $basicDevice) {
        $deviceId = $basicDevice['id'];
        echo "  📥 Obteniendo detalles del dispositivo ID: {$deviceId}...\n";
        
        $detailedDevice = $ninjaOneService->getDevice($deviceId);
        if ($detailedDevice) {
            $ninjaOneDevices[] = $detailedDevice;
        } else {
            echo "  ⚠️ No se pudieron obtener detalles del dispositivo ID: {$deviceId}\n";
            // Usar la información básica como fallback
            $ninjaOneDevices[] = $basicDevice;
        }
    }
    
    echo "✅ Procesados " . count($ninjaOneDevices) . " dispositivos con información detallada\n\n";
    
    // Obtener dispositivos locales
    $localDevices = Device::where('ninjaone_enabled', true)
        ->with(['brand', 'model', 'system', 'name_device'])
        ->get();
    
    echo "✅ Encontrados " . $localDevices->count() . " dispositivos locales con NinjaOne habilitado\n\n";
    
    // Crear un mapa para vincular dispositivos locales con NinjaOne
    $deviceMap = [];
    foreach ($localDevices as $device) {
        if ($device->ninjaone_device_id) {
            $deviceMap[$device->ninjaone_device_id] = $device;
        }
    }
    
    echo "=== DATOS COMPLETOS DE CADA DISPOSITIVO ===\n\n";
    
    foreach ($ninjaOneDevices as $index => $ninjaDevice) {
        $deviceNumber = $index + 1;
        echo "🔍 DISPOSITIVO #{$deviceNumber}\n";
        echo "===============================\n";
        
        // Datos básicos de NinjaOne
        echo "📱 DATOS NINJAONE:\n";
        echo "   - ID: " . ($ninjaDevice['id'] ?? 'N/A') . "\n";
        echo "   - System Name: " . ($ninjaDevice['systemName'] ?? 'N/A') . "\n";
        echo "   - Hostname: " . ($ninjaDevice['hostname'] ?? 'N/A') . "\n";
        echo "   - Display Name: " . ($ninjaDevice['displayName'] ?? 'N/A') . "\n";
        echo "   - DNS Name: " . ($ninjaDevice['dnsName'] ?? 'N/A') . "\n";
        echo "   - Operating System: " . ($ninjaDevice['operatingSystem'] ?? 'N/A') . "\n";
        echo "   - Online: " . (isset($ninjaDevice['online']) ? ($ninjaDevice['online'] ? 'YES' : 'NO') : 'N/A') . "\n";
        echo "   - Offline: " . (isset($ninjaDevice['offline']) ? ($ninjaDevice['offline'] ? 'YES' : 'NO') : 'N/A') . "\n";
        echo "   - Last Seen UTC: " . ($ninjaDevice['lastSeenUtc'] ?? 'N/A') . "\n";
        echo "   - Last Contact: " . ($ninjaDevice['lastContact'] ?? 'N/A') . "\n";
        echo "   - Last Update: " . ($ninjaDevice['lastUpdate'] ?? 'N/A') . "\n";
        echo "   - Serial Number: " . ($ninjaDevice['serialNumber'] ?? 'N/A') . "\n";
        echo "   - Device Type: " . ($ninjaDevice['deviceType'] ?? 'N/A') . "\n";
        echo "   - Node Class: " . ($ninjaDevice['nodeClass'] ?? 'N/A') . "\n";
        echo "   - Approval Status: " . ($ninjaDevice['approvalStatus'] ?? 'N/A') . "\n";
        echo "   - Organization ID: " . ($ninjaDevice['organizationId'] ?? 'N/A') . "\n";
        echo "   - Location ID: " . ($ninjaDevice['locationId'] ?? 'N/A') . "\n";
        echo "   - Node Role ID: " . ($ninjaDevice['nodeRoleId'] ?? 'N/A') . "\n";
        echo "   - Role Policy ID: " . ($ninjaDevice['rolePolicyId'] ?? 'N/A') . "\n";
        echo "   - Public IP: " . ($ninjaDevice['publicIP'] ?? 'N/A') . "\n";
        
        // IPs y MACs
        if (isset($ninjaDevice['ipAddresses']) && is_array($ninjaDevice['ipAddresses'])) {
            echo "   - IP Addresses: " . implode(', ', $ninjaDevice['ipAddresses']) . "\n";
        }
        
        if (isset($ninjaDevice['macAddresses']) && is_array($ninjaDevice['macAddresses'])) {
            echo "   - MAC Addresses: " . implode(', ', $ninjaDevice['macAddresses']) . "\n";
        }
        
        // Sistema operativo detallado
        if (isset($ninjaDevice['os']) && is_array($ninjaDevice['os'])) {
            echo "   - OS Manufacturer: " . ($ninjaDevice['os']['manufacturer'] ?? 'N/A') . "\n";
            echo "   - OS Name: " . ($ninjaDevice['os']['name'] ?? 'N/A') . "\n";
            echo "   - OS Architecture: " . ($ninjaDevice['os']['architecture'] ?? 'N/A') . "\n";
            echo "   - OS Build Number: " . ($ninjaDevice['os']['buildNumber'] ?? 'N/A') . "\n";
            echo "   - OS Language: " . ($ninjaDevice['os']['language'] ?? 'N/A') . "\n";
            echo "   - OS Locale: " . ($ninjaDevice['os']['locale'] ?? 'N/A') . "\n";
            echo "   - Needs Reboot: " . (isset($ninjaDevice['os']['needsReboot']) ? ($ninjaDevice['os']['needsReboot'] ? 'YES' : 'NO') : 'N/A') . "\n";
        }
        
        // Sistema/Hardware
        if (isset($ninjaDevice['system']) && is_array($ninjaDevice['system'])) {
            echo "   - System Name: " . ($ninjaDevice['system']['name'] ?? 'N/A') . "\n";
            echo "   - System Manufacturer: " . ($ninjaDevice['system']['manufacturer'] ?? 'N/A') . "\n";
            echo "   - System Model: " . ($ninjaDevice['system']['model'] ?? 'N/A') . "\n";
            echo "   - BIOS Serial: " . ($ninjaDevice['system']['biosSerialNumber'] ?? 'N/A') . "\n";
            echo "   - Serial Number: " . ($ninjaDevice['system']['serialNumber'] ?? 'N/A') . "\n";
            echo "   - Domain: " . ($ninjaDevice['system']['domain'] ?? 'N/A') . "\n";
            echo "   - Domain Role: " . ($ninjaDevice['system']['domainRole'] ?? 'N/A') . "\n";
            echo "   - Processors: " . ($ninjaDevice['system']['numberOfProcessors'] ?? 'N/A') . "\n";
            echo "   - Total Memory: " . ($ninjaDevice['system']['totalPhysicalMemory'] ?? 'N/A') . "\n";
            echo "   - Virtual Machine: " . (isset($ninjaDevice['system']['virtualMachine']) ? ($ninjaDevice['system']['virtualMachine'] ? 'YES' : 'NO') : 'N/A') . "\n";
            echo "   - Chassis Type: " . ($ninjaDevice['system']['chassisType'] ?? 'N/A') . "\n";
        }
        
        // Memoria
        if (isset($ninjaDevice['memory']) && is_array($ninjaDevice['memory'])) {
            echo "   - Memory Capacity: " . ($ninjaDevice['memory']['capacity'] ?? 'N/A') . "\n";
        }
        
        // Procesadores
        if (isset($ninjaDevice['processors']) && is_array($ninjaDevice['processors'])) {
            echo "   - Processors Count: " . count($ninjaDevice['processors']) . "\n";
            foreach ($ninjaDevice['processors'] as $procIndex => $processor) {
                echo "     Processor #" . ($procIndex + 1) . ":\n";
                echo "       - Name: " . ($processor['name'] ?? 'N/A') . "\n";
                echo "       - Architecture: " . ($processor['architecture'] ?? 'N/A') . "\n";
                echo "       - Max Clock Speed: " . ($processor['maxClockSpeed'] ?? 'N/A') . "\n";
                echo "       - Clock Speed: " . ($processor['clockSpeed'] ?? 'N/A') . "\n";
                echo "       - Cores: " . ($processor['numCores'] ?? 'N/A') . "\n";
                echo "       - Logical Cores: " . ($processor['numLogicalCores'] ?? 'N/A') . "\n";
            }
        }
        
        // Volúmenes/Discos
        if (isset($ninjaDevice['volumes']) && is_array($ninjaDevice['volumes'])) {
            echo "   - Volumes Count: " . count($ninjaDevice['volumes']) . "\n";
            foreach ($ninjaDevice['volumes'] as $volIndex => $volume) {
                echo "     Volume #" . ($volIndex + 1) . ":\n";
                echo "       - Name: " . ($volume['name'] ?? 'N/A') . "\n";
                echo "       - Label: " . ($volume['label'] ?? 'N/A') . "\n";
                echo "       - Device Type: " . ($volume['deviceType'] ?? 'N/A') . "\n";
                echo "       - File System: " . ($volume['fileSystem'] ?? 'N/A') . "\n";
                echo "       - Capacity: " . ($volume['capacity'] ?? 'N/A') . "\n";
                echo "       - Free Space: " . ($volume['freeSpace'] ?? 'N/A') . "\n";
                echo "       - Auto Mount: " . (isset($volume['autoMount']) ? ($volume['autoMount'] ? 'YES' : 'NO') : 'N/A') . "\n";
                echo "       - Compressed: " . (isset($volume['compressed']) ? ($volume['compressed'] ? 'YES' : 'NO') : 'N/A') . "\n";
            }
        }
        
        // Último usuario logueado
        echo "   - Last Logged User: " . ($ninjaDevice['lastLoggedInUser'] ?? 'N/A') . "\n";
        
        // Obtener información adicional
        echo "\n🏥 HEALTH STATUS:\n";
        try {
            $healthStatus = $ninjaOneService->getDeviceHealthStatus($ninjaDevice['id']);
            if ($healthStatus) {
                echo "   - Status: " . ($healthStatus['status'] ?? 'N/A') . "\n";
                echo "   - Issues Count: " . ($healthStatus['issuesCount'] ?? 'N/A') . "\n";
                echo "   - Critical Count: " . ($healthStatus['criticalCount'] ?? 'N/A') . "\n";
                echo "   - Warning Count: " . ($healthStatus['warningCount'] ?? 'N/A') . "\n";
                echo "   - Is Offline: " . (isset($healthStatus['isOffline']) ? ($healthStatus['isOffline'] ? 'YES' : 'NO') : 'N/A') . "\n";
                echo "   - Last Contact: " . ($healthStatus['lastContact'] ?? 'N/A') . "\n";
            } else {
                echo "   - No health status available\n";
            }
        } catch (Exception $e) {
            echo "   - Error getting health status: " . $e->getMessage() . "\n";
        }
        
        echo "\n🚨 ALERTS:\n";
        try {
            $alerts = $ninjaOneService->getDeviceAlerts($ninjaDevice['id']);
            if ($alerts && count($alerts) > 0) {
                echo "   - Total Alerts: " . count($alerts) . "\n";
                foreach ($alerts as $alertIndex => $alert) {
                    echo "     Alert #" . ($alertIndex + 1) . ":\n";
                    echo "       - ID: " . ($alert['id'] ?? 'N/A') . "\n";
                    echo "       - Message: " . ($alert['message'] ?? 'N/A') . "\n";
                    echo "       - Created At: " . ($alert['createdAt'] ?? 'N/A') . "\n";
                    echo "       - Severity: " . ($alert['severity'] ?? 'N/A') . "\n";
                    echo "       - Status: " . ($alert['status'] ?? 'N/A') . "\n";
                }
            } else {
                echo "   - No alerts\n";
            }
        } catch (Exception $e) {
            echo "   - Error getting alerts: " . $e->getMessage() . "\n";
        }
        
        // Dispositivo local correspondiente
        echo "\n💾 LOCAL DEVICE MAPPING:\n";
        $localDevice = $deviceMap[$ninjaDevice['id']] ?? null;
        if ($localDevice) {
            echo "   - ✅ MAPPED\n";
            echo "   - Local ID: " . $localDevice->id . "\n";
            echo "   - Local Name: " . $localDevice->name . "\n";
            echo "   - Brand: " . ($localDevice->brand->name ?? 'N/A') . "\n";
            echo "   - Model: " . ($localDevice->model->name ?? 'N/A') . "\n";
            echo "   - System: " . ($localDevice->system->name ?? 'N/A') . "\n";
            echo "   - NinjaOne Device ID: " . ($localDevice->ninjaone_device_id ?? 'N/A') . "\n";
            echo "   - NinjaOne Enabled: " . ($localDevice->ninjaone_enabled ? 'YES' : 'NO') . "\n";
        } else {
            echo "   - ❌ NOT MAPPED\n";
        }
        
        echo "\n" . str_repeat("=", 50) . "\n\n";
        
        // Solo mostrar los primeros 3 dispositivos para no saturar
        if ($index >= 2) {
            echo "... (mostrando solo los primeros 3 dispositivos para no saturar la consola)\n";
            echo "Total de dispositivos disponibles: " . count($ninjaOneDevices) . "\n";
            break;
        }
    }
    
    echo "\n=== RESUMEN ESTADÍSTICAS ===\n";
    echo "Total dispositivos NinjaOne: " . count($ninjaOneDevices) . "\n";
    echo "Total dispositivos locales: " . $localDevices->count() . "\n";
    echo "Dispositivos mapeados: " . count($deviceMap) . "\n";
    echo "Dispositivos online: " . collect($ninjaOneDevices)->where('online', true)->count() . "\n";
    echo "Dispositivos offline: " . collect($ninjaOneDevices)->where('online', false)->count() . "\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
