<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NinjaOneAlert;
use App\Models\Device;

class NinjaOneAlertsSeeder extends Seeder
{
    public function run()
    {
        // Primero limpiamos las alertas existentes
        NinjaOneAlert::truncate();
        
        // Obtener el dispositivo existente
        $device = Device::first();
        
        if (!$device) {
            $this->command->error('No devices found. Please create devices first.');
            return;
        }
        
        $this->command->info("Using device: {$device->name} (ID: {$device->id})");
        
        // Crear alertas de ejemplo
        $alerts = [
            [
                'ninjaone_alert_id' => 'alert_001',
                'device_id' => $device->id,
                'alert_type' => 'System Health',
                'severity' => 'critical',
                'status' => 'open',
                'title' => 'High CPU Usage Detected',
                'description' => 'CPU usage has exceeded 95% for more than 5 minutes on server. This may indicate a performance issue or runaway process.',
                'raw_data' => [
                    'cpu_usage' => 97.5,
                    'memory_usage' => 84.2,
                    'timestamp' => now()->toISOString(),
                    'affected_processes' => ['nginx', 'mysql', 'php-fpm']
                ],
                'ticket_created' => false,
            ],
            [
                'ninjaone_alert_id' => 'alert_002',
                'device_id' => $device->id,
                'alert_type' => 'Disk Space',
                'severity' => 'warning',
                'status' => 'acknowledged',
                'title' => 'Low Disk Space Warning',
                'description' => 'Available disk space on /var partition is below 15%. Consider cleaning up old files or expanding storage.',
                'acknowledged_at' => now()->subHours(2),
                'raw_data' => [
                    'partition' => '/var',
                    'available_space' => '12.3 GB',
                    'total_space' => '100 GB',
                    'usage_percentage' => 87.7
                ],
                'ticket_created' => true,
            ],
            [
                'ninjaone_alert_id' => 'alert_003',
                'device_id' => $device->id,
                'alert_type' => 'Network',
                'severity' => 'info',
                'status' => 'open',
                'title' => 'Network Interface Utilization',
                'description' => 'Network interface eth0 is experiencing higher than normal traffic. Monitor for potential issues.',
                'raw_data' => [
                    'interface' => 'eth0',
                    'rx_bytes' => 1024000000,
                    'tx_bytes' => 512000000,
                    'utilization_percentage' => 78.5
                ],
                'ticket_created' => false,
            ],
            [
                'ninjaone_alert_id' => 'alert_004',
                'device_id' => $device->id,
                'alert_type' => 'Security',
                'severity' => 'critical',
                'status' => 'open',
                'title' => 'Suspicious Login Attempt',
                'description' => 'Multiple failed login attempts detected from unknown IP address. Potential brute force attack.',
                'raw_data' => [
                    'source_ip' => '192.168.1.100',
                    'failed_attempts' => 15,
                    'time_window' => '10 minutes',
                    'affected_service' => 'SSH'
                ],
                'ticket_created' => false,
            ],
            [
                'ninjaone_alert_id' => 'alert_005',
                'device_id' => $device->id,
                'alert_type' => 'Service',
                'severity' => 'warning',
                'status' => 'resolved',
                'title' => 'Service Restart Required',
                'description' => 'MySQL service has been automatically restarted due to memory issues. Performance may be affected.',
                'acknowledged_at' => now()->subHours(4),
                'raw_data' => [
                    'service_name' => 'mysql',
                    'restart_reason' => 'memory_limit_exceeded',
                    'restart_time' => now()->subHours(4)->toISOString(),
                    'memory_usage_before' => '8.2 GB'
                ],
                'ticket_created' => true,
            ]
        ];

        foreach ($alerts as $alertData) {
            NinjaOneAlert::create($alertData);
        }

        $this->command->info('Created ' . count($alerts) . ' NinjaOne alerts for testing');
    }
}
