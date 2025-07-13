<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Device;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Enable NinjaOne for some sample devices for testing
        $devices = Device::take(5)->get(); // Take first 5 devices
        
        foreach ($devices as $index => $device) {
            $device->update([
                'ninjaone_enabled' => true,
                'ninjaone_device_id' => 'ninja_device_' . $device->id,
                'ninjaone_node_id' => 'ninja_node_' . $device->id,
                'ninjaone_organization_id' => 'org_' . (($index % 3) + 1), // Distribute across 3 organizations
                'ninjaone_last_sync' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Disable NinjaOne for all devices
        Device::where('ninjaone_enabled', true)->update([
            'ninjaone_enabled' => false,
            'ninjaone_device_id' => null,
            'ninjaone_node_id' => null,
            'ninjaone_organization_id' => null,
            'ninjaone_last_sync' => null,
        ]);
    }
};
