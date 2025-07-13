<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Device;

class UpdateDeviceNames extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'devices:update-names';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update device names for testing purposes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $devices = Device::whereNull('name')->orWhere('name', '')->take(5)->get();
        
        foreach ($devices as $index => $device) {
            $newName = 'TestDevice' . ($index + 1);
            $device->update(['name' => $newName]);
            $this->info("Updated device {$device->id} with name: {$newName}");
        }
        
        $this->info('Device names updated successfully!');
    }
}
