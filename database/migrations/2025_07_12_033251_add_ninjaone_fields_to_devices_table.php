<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->string('ninjaone_device_id')->nullable()->index()->comment('NinjaOne device identifier for webhooks');
            $table->string('ninjaone_node_id')->nullable()->comment('NinjaOne node ID');
            $table->string('ninjaone_serial_number')->nullable()->comment('Device serial number from NinjaOne');
            $table->string('ninjaone_asset_tag')->nullable()->comment('Device asset tag from NinjaOne');
            $table->json('ninjaone_metadata')->nullable()->comment('Additional NinjaOne device metadata');
            $table->timestamp('ninjaone_last_seen')->nullable()->comment('Last time device was seen in NinjaOne');
            $table->boolean('ninjaone_enabled')->default(false)->comment('Enable NinjaOne integration for this device');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropColumn([
                'ninjaone_device_id',
                'ninjaone_node_id', 
                'ninjaone_serial_number',
                'ninjaone_asset_tag',
                'ninjaone_metadata',
                'ninjaone_last_seen',
                'ninjaone_enabled'
            ]);
        });
    }
};
