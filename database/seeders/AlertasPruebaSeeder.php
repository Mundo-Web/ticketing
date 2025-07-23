<?php

use Illuminate\Database\Seeder;
use App\Models\NinjaOneAlert;
use App\Models\Device;

class AlertasPruebaSeeder extends Seeder
{
    public function run()
    {
        // Limpiar alertas existentes
        NinjaOneAlert::truncate();
        
        // Obtener dispositivos habilitados para NinjaOne
        $devices = Device::where('ninjaone_enabled', true)->get();
        
        if ($devices->isEmpty()) {
            echo "No hay dispositivos habilitados para NinjaOne. Habilitando algunos...\n";
            
            // Habilitar algunos dispositivos
            Device::whereIn('name', ['DamianPC', 'iPhone 13 Pro', 'MacBook Pro M2 2023'])
                  ->update([
                      'ninjaone_enabled' => true,
                      'ninjaone_device_id' => function() {
                          static $counter = 1;
                          return 'device_' . ($counter++);
                      }
                  ]);
            
            $devices = Device::where('ninjaone_enabled', true)->get();
        }
        
        $alertTypes = [
            'HIGH_CPU_USAGE' => ['title' => 'Uso alto de CPU', 'description' => 'El uso de CPU ha superado el 85% durante más de 5 minutos'],
            'LOW_DISK_SPACE' => ['title' => 'Espacio en disco bajo', 'description' => 'El disco C: tiene menos del 10% de espacio libre'],
            'HIGH_MEMORY_USAGE' => ['title' => 'Uso alto de memoria', 'description' => 'El uso de RAM ha superado el 90%'],
            'SERVICE_STOPPED' => ['title' => 'Servicio detenido', 'description' => 'El servicio Windows Update se ha detenido inesperadamente'],
            'NETWORK_DISCONNECTED' => ['title' => 'Red desconectada', 'description' => 'El dispositivo perdió conectividad de red'],
            'ANTIVIRUS_OUTDATED' => ['title' => 'Antivirus desactualizado', 'description' => 'Las definiciones de antivirus tienen más de 7 días de antigüedad'],
        ];
        
        $severities = ['critical', 'high', 'warning', 'info'];
        $statuses = ['open', 'acknowledged', 'resolved'];
        
        $alertCount = 0;
        
        foreach ($devices as $device) {
            // Crear 2-4 alertas por dispositivo
            $numAlerts = rand(2, 4);
            
            for ($i = 0; $i < $numAlerts; $i++) {
                $alertType = array_rand($alertTypes);
                $alertData = $alertTypes[$alertType];
                
                $severity = $severities[array_rand($severities)];
                $status = $statuses[array_rand($statuses)];
                
                // Alertas críticas siempre abiertas
                if ($severity === 'critical') {
                    $status = 'open';
                }
                
                $createdAt = now()->subDays(rand(0, 30))->subHours(rand(0, 23));
                $acknowledgedAt = null;
                
                if ($status === 'acknowledged' || $status === 'resolved') {
                    $acknowledgedAt = $createdAt->copy()->addHours(rand(1, 48));
                }
                
                NinjaOneAlert::create([
                    'ninjaone_alert_id' => 'alert_' . $device->id . '_' . time() . '_' . rand(1000, 9999),
                    'device_id' => $device->id,
                    'ninjaone_device_id' => $device->ninjaone_device_id ?? 'device_' . $device->id,
                    'alert_type' => $alertType,
                    'severity' => $severity,
                    'status' => $status,
                    'title' => $alertData['title'],
                    'description' => $alertData['description'],
                    'metadata' => [
                        'source' => 'test_seeder',
                        'created_by' => 'system',
                        'device_info' => [
                            'name' => $device->name,
                            'type' => 'workstation'
                        ]
                    ],
                    'acknowledged_at' => $acknowledgedAt,
                    'ticket_created' => rand(0, 1) == 1,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                    'ninjaone_created_at' => $createdAt,
                ]);
                
                $alertCount++;
            }
        }
        
        echo "✅ Se crearon {$alertCount} alertas de prueba para " . $devices->count() . " dispositivos\n";
        
        // Mostrar resumen
        echo "\n📊 Resumen por severidad:\n";
        foreach ($severities as $severity) {
            $count = NinjaOneAlert::where('severity', $severity)->count();
            echo "  {$severity}: {$count} alertas\n";
        }
        
        echo "\n📊 Resumen por estado:\n";
        foreach ($statuses as $status) {
            $count = NinjaOneAlert::where('status', $status)->count();
            echo "  {$status}: {$count} alertas\n";
        }
    }
}
