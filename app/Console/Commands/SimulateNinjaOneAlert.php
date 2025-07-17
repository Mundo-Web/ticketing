<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Services\NinjaOneService;
use Illuminate\Console\Command;

class SimulateNinjaOneAlert extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ninjaone:simulate-alert {device_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Simula una alerta de NinjaOne para probar la integración';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // Obtener dispositivo por ID o mostrar lista para seleccionar
        $deviceId = $this->argument('device_id');
        $device = null;
        
        if ($deviceId) {
            $device = Device::find($deviceId);
            if (!$device) {
                $this->error("No se encontró el dispositivo con ID {$deviceId}");
                return 1;
            }
        } else {
            // Mostrar solo dispositivos marcados como NinjaOne
            $devices = Device::where('is_in_ninjaone', true)->get();
            
            if ($devices->isEmpty()) {
                $this->error('No hay dispositivos marcados como NinjaOne en el sistema');
                return 1;
            }
            
            $devicesList = $devices->map(function($device) {
                return [
                    'id' => $device->id,
                    'name' => $device->name ?: '(Sin nombre)',
                    'device_type' => $device->name_device->name ?? 'N/A',
                    'ninjaone' => $device->is_in_ninjaone ? 'Sí' : 'No'
                ];
            })->toArray();
            
            $this->table(['ID', 'Nombre', 'Tipo', 'NinjaOne'], $devicesList);
            
            $deviceId = $this->ask('Selecciona el ID del dispositivo para simular una alerta');
            $device = Device::find($deviceId);
            
            if (!$device) {
                $this->error("No se encontró el dispositivo con ID {$deviceId}");
                return 1;
            }
        }
        
        if (!$device->is_in_ninjaone) {
            if (!$this->confirm("El dispositivo no está marcado como NinjaOne. ¿Deseas continuar?")) {
                return 1;
            }
        }
        
        // Simular tipos de alertas
        $alertTypes = [
            'disk_space' => 'Espacio en disco bajo',
            'cpu_usage' => 'Uso de CPU alto',
            'memory_usage' => 'Uso de memoria alto',
            'service_stopped' => 'Servicio detenido',
            'windows_update' => 'Actualizaciones pendientes',
            'antivirus' => 'Problema con antivirus',
            'backup_failed' => 'Error en copia de seguridad',
            'connectivity' => 'Problemas de conectividad'
        ];
        
        $alertType = $this->choice(
            'Selecciona el tipo de alerta a simular',
            array_values($alertTypes)
        );
        
        $alertKey = array_search($alertType, $alertTypes);
        
        $severities = [
            'low' => 'Baja',
            'medium' => 'Media',
            'high' => 'Alta',
            'critical' => 'Crítica'
        ];
        
        $severity = $this->choice(
            'Selecciona la severidad de la alerta',
            array_values($severities)
        );
        
        $severityKey = array_search($severity, $severities);
        
        // Generar mensaje de alerta
        $messages = [
            'disk_space' => [
                'low' => 'El disco C: tiene menos del 20% de espacio libre',
                'medium' => 'El disco C: tiene menos del 15% de espacio libre',
                'high' => 'El disco C: tiene menos del 10% de espacio libre',
                'critical' => 'El disco C: tiene menos del 5% de espacio libre'
            ],
            'cpu_usage' => [
                'low' => 'Uso de CPU por encima del 70% durante los últimos 15 minutos',
                'medium' => 'Uso de CPU por encima del 80% durante los últimos 15 minutos',
                'high' => 'Uso de CPU por encima del 90% durante los últimos 15 minutos',
                'critical' => 'Uso de CPU al 100% durante los últimos 15 minutos'
            ],
            'memory_usage' => [
                'low' => 'Uso de memoria por encima del 80%',
                'medium' => 'Uso de memoria por encima del 85%',
                'high' => 'Uso de memoria por encima del 90%',
                'critical' => 'Uso de memoria por encima del 95%'
            ],
            'service_stopped' => [
                'low' => 'El servicio Print Spooler está detenido',
                'medium' => 'El servicio Windows Update está detenido',
                'high' => 'El servicio Windows Defender está detenido',
                'critical' => 'Múltiples servicios críticos están detenidos'
            ],
            'windows_update' => [
                'low' => '5 actualizaciones pendientes',
                'medium' => '10 actualizaciones pendientes',
                'high' => '15 actualizaciones pendientes incluyendo actualizaciones de seguridad',
                'critical' => 'Actualizaciones críticas de seguridad pendientes desde hace más de 30 días'
            ],
            'antivirus' => [
                'low' => 'Antivirus desactualizado',
                'medium' => 'Definiciones de antivirus desactualizadas por más de 7 días',
                'high' => 'Antivirus no está ejecutando el servicio de protección en tiempo real',
                'critical' => 'Antivirus desinstalado o desactivado'
            ],
            'backup_failed' => [
                'low' => 'La última copia de seguridad programada no se completó',
                'medium' => 'Copias de seguridad fallando por 3 días',
                'high' => 'Copias de seguridad fallando por 7 días',
                'critical' => 'Copias de seguridad fallando por más de 14 días'
            ],
            'connectivity' => [
                'low' => 'Latencia alta a servidor principal',
                'medium' => 'Pérdida de paquetes intermitente',
                'high' => 'Conectividad intermitente',
                'critical' => 'Dispositivo offline'
            ]
        ];
        
        $message = $messages[$alertKey][$severityKey] ?? 'Alerta simulada para pruebas';
        
        // Guardar alerta simulada
        $alert = new \App\Models\NinjaOneAlert();
        $alert->device_id = $device->id;
        $alert->ninjaone_alert_id = 'sim_' . time();
        $alert->alert_type = $alertKey;
        $alert->severity = $severityKey;
        $alert->title = $alertTypes[$alertKey];
        $alert->description = $message;
        $alert->status = 'open';
        $alert->save();
        
        $this->info("Alerta simulada creada para el dispositivo {$device->name_device->name} ({$device->name})");
        $this->table(
            ['ID', 'Dispositivo', 'Tipo', 'Severidad', 'Mensaje', 'Estado'],
            [[
                $alert->id,
                $device->name ?: $device->name_device->name ?? 'N/A',
                $alertTypes[$alert->alert_type] ?? $alert->alert_type,
                $severities[$alert->severity] ?? $alert->severity,
                $alert->description,
                'Abierta'
            ]]
        );
        
        return 0;
    }
}
