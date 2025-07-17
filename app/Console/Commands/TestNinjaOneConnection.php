<?php

namespace App\Console\Commands;

use App\Services\NinjaOneService;
use Illuminate\Console\Command;

class TestNinjaOneConnection extends Command
{
    protected $signature = 'ninjaone:test-connection';
    protected $description = 'Test NinjaOne API connection';

    public function handle()
    {
        $this->info('Testing NinjaOne API connection...');
        
        $ninjaOneService = new NinjaOneService();
        
        // Test connection
        if ($ninjaOneService->testConnection()) {
            $this->info('✅ NinjaOne API connection successful!');
        } else {
            $this->error('❌ NinjaOne API connection failed!');
            return 1;
        }
        
        // Try to get devices
        $this->info('Fetching devices...');
        $devices = $ninjaOneService->getDeviceAlertsByName('DamianPC');
        
        if (empty($devices)) {
            $this->warn('No devices found or failed to fetch devices');
        } else {
            $this->info('✅ Found ' . count($devices) . ' devices');
            
            // Show first few devices
            $this->table(
                ['ID', 'Name', 'Type', 'Status'],
                collect($devices)->take(5)->map(function ($device) {
                    return [
                        $device['id'] ?? 'N/A',
                        $device['systemName'] ?? 'N/A',
                        $device['nodeClass'] ?? 'N/A',
                        $device['status'] ?? 'N/A'
                    ];
                })
            );
        }
        
        return 0;
    }
}
