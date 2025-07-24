<?php

require_once 'vendor/autoload.php';

use App\Services\NinjaOneService;

// Configurar variables de entorno
$_ENV['NINJAONE_CLIENT_ID'] = 'msp_4c6c21aa-af00-452c-9d93-17e6ce32e0b7';
$_ENV['NINJAONE_CLIENT_SECRET'] = 'YfFTnpEkWoNzZmHMm9T9Q6p_dWBPWPvGPp8nINgfZfY';
$_ENV['NINJAONE_BASE_URL'] = 'https://us-datto-api.ninjarmm.com';

try {
    $ninjaOneService = new NinjaOneService();
    
    echo "=== OBTENIENDO DISPOSITIVOS ===\n";
    $devices = $ninjaOneService->getDevices();
    
    if (empty($devices)) {
        echo "No se encontraron dispositivos\n";
        exit;
    }
    
    // Tomar el primer dispositivo para análisis
    $device = $devices[0];
    echo "=== ANALIZANDO DISPOSITIVO: " . $device['displayName'] . " ===\n";
    echo "ID: " . $device['id'] . "\n\n";
    
    // Obtener datos detallados del dispositivo
    echo "=== OBTENIENDO DATOS DETALLADOS ===\n";
    $detailedDevice = $ninjaOneService->getDevice($device['id']);
    
    echo "=== ESTRUCTURA COMPLETA DE DATOS ===\n";
    echo json_encode($detailedDevice, JSON_PRETTY_PRINT) . "\n\n";
    
    // Verificar específicamente los datos del OS
    echo "=== ANÁLISIS DE DATOS DE OS ===\n";
    
    if (isset($detailedDevice['operatingSystem'])) {
        echo "operatingSystem: '" . $detailedDevice['operatingSystem'] . "'\n";
    } else {
        echo "operatingSystem: NO EXISTE\n";
    }
    
    if (isset($detailedDevice['os'])) {
        echo "os object: " . json_encode($detailedDevice['os'], JSON_PRETTY_PRINT) . "\n";
        
        if (isset($detailedDevice['os']['name'])) {
            echo "os.name: '" . $detailedDevice['os']['name'] . "'\n";
        }
        
        if (isset($detailedDevice['os']['manufacturer'])) {
            echo "os.manufacturer: '" . $detailedDevice['os']['manufacturer'] . "'\n";
        }
        
        if (isset($detailedDevice['os']['architecture'])) {
            echo "os.architecture: '" . $detailedDevice['os']['architecture'] . "'\n";
        }
        
        if (isset($detailedDevice['os']['buildNumber'])) {
            echo "os.buildNumber: '" . $detailedDevice['os']['buildNumber'] . "'\n";
        }
    } else {
        echo "os object: NO EXISTE\n";
    }
    
    // Verificar otros campos importantes
    echo "\n=== OTROS CAMPOS IMPORTANTES ===\n";
    
    if (isset($detailedDevice['system'])) {
        echo "system object existe\n";
        if (isset($detailedDevice['system']['manufacturer'])) {
            echo "system.manufacturer: '" . $detailedDevice['system']['manufacturer'] . "'\n";
        }
        if (isset($detailedDevice['system']['model'])) {
            echo "system.model: '" . $detailedDevice['system']['model'] . "'\n";
        }
    }
    
    if (isset($detailedDevice['processors'])) {
        echo "processors array existe con " . count($detailedDevice['processors']) . " elementos\n";
    }
    
    if (isset($detailedDevice['volumes'])) {
        echo "volumes array existe con " . count($detailedDevice['volumes']) . " elementos\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
