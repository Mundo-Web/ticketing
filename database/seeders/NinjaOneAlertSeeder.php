<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Device;
use App\Models\NinjaOneAlert;

class NinjaOneAlertSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Get devices that have NinjaOne enabled
        $ninjaDevices = Device::where('ninjaone_enabled', true)->get();
        
        if ($ninjaDevices->count() === 0) {
            $this->command->info('No devices with NinjaOne enabled found. Please enable NinjaOne for some devices first.');
            return;
        }

        $alertTypes = [
            'disk_space_low' => [
                'title' => 'Low Disk Space',
                'message' => 'Disk space is running low on C: drive (85% full)',
                'severity' => 'warning',
            ],
            'cpu_high' => [
                'title' => 'High CPU Usage',
                'message' => 'CPU usage has been above 90% for the last 15 minutes',
                'severity' => 'critical',
            ],
            'memory_low' => [
                'title' => 'Low Memory',
                'message' => 'Available memory is below 500MB',
                'severity' => 'warning',
            ],
            'service_down' => [
                'title' => 'Service Unavailable',
                'message' => 'Windows Update service has stopped unexpectedly',
                'severity' => 'critical',
            ],
            'temperature_high' => [
                'title' => 'High Temperature',
                'message' => 'System temperature has exceeded safe operating limits',
                'severity' => 'critical',
            ],
            'network_connectivity' => [
                'title' => 'Network Connectivity Issue',
                'message' => 'Intermittent network connectivity detected',
                'severity' => 'warning',
            ],
        ];

        $statuses = ['open', 'acknowledged', 'resolved'];

        foreach ($ninjaDevices as $device) {
            // Create 1-3 random alerts per device
            $alertCount = rand(1, 3);
            
            for ($i = 0; $i < $alertCount; $i++) {
                $alertType = array_rand($alertTypes);
                $alertData = $alertTypes[$alertType];
                
                NinjaOneAlert::create([
                    'device_id' => $device->id,
                    'ninjaone_alert_id' => 'alert_' . $device->id . '_' . time() . '_' . $i,
                    'ninjaone_device_id' => $device->ninjaone_device_id ?? 'ninja_device_' . $device->id,
                    'alert_type' => $alertType,
                    'title' => $alertData['title'],
                    'description' => $alertData['message'],
                    'severity' => $alertData['severity'],
                    'status' => $statuses[array_rand($statuses)],
                    'ninjaone_created_at' => now()->subMinutes(rand(10, 1440)), // Random time in last 24 hours
                    'metadata' => json_encode([
                        'source' => 'monitoring_system',
                        'category' => $alertType,
                        'threshold_exceeded' => rand(80, 95),
                        'current_value' => rand(85, 100),
                        'device_info' => [
                            'os' => $device->system?->name ?? 'Windows 11',
                            'model' => $device->model?->name ?? 'Unknown',
                            'brand' => $device->brand?->name ?? 'Unknown',
                        ]
                    ]),
                    'acknowledged_at' => $statuses[array_rand($statuses)] === 'acknowledged' ? now()->subMinutes(rand(5, 60)) : null,
                    'resolved_at' => $statuses[array_rand($statuses)] === 'resolved' ? now()->subMinutes(rand(1, 30)) : null,
                ]);
            }
        }

        $this->command->info('Created sample NinjaOne alerts for ' . $ninjaDevices->count() . ' devices.');
    }
}
