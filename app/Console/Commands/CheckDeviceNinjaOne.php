<?php

namespace App\Console\Commands;

use App\Models\Device;
use Illuminate\Console\Command;

class CheckDeviceNinjaOne extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:device-ninjaone {id=13}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check device NinjaOne information';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $deviceId = $this->argument('id');
        
        $device = Device::find($deviceId);
        
        if (!$device) {
            $this->error("Device with ID {$deviceId} not found");
            return 1;
        }
        
        $this->info("Device Information:");
        $this->table([
            'Field', 'Value'
        ], [
            ['ID', $device->id],
            ['Name', $device->name ?? 'N/A'],
            ['NinjaOne Status', $device->ninjaone_status ?? 'N/A'],
            ['NinjaOne Online', $device->ninjaone_online ? 'Yes' : 'No'],
            ['NinjaOne Issues Count', $device->ninjaone_issues_count ?? 'N/A'],
            ['NinjaOne System Name', $device->ninjaone_system_name ?? 'N/A'],
            ['Is in NinjaOne', $device->is_in_ninjaone ? 'Yes' : 'No'],
            ['Updated At', $device->updated_at],
        ]);
        
        return 0;
    }
}
