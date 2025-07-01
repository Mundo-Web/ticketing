<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Assign sample icons to devices that don't have any
        DB::table('devices')->where('id', 1)->update(['icon_id' => 'monitor']);
        DB::table('devices')->where('id', 4)->update(['icon_id' => 'wifi']);
        DB::table('devices')->where('id', 5)->update(['icon_id' => 'router']);
        DB::table('devices')->where('id', 6)->update(['icon_id' => 'smartphone']);
        DB::table('devices')->where('id', 7)->update(['icon_id' => 'speaker']);
        DB::table('devices')->where('id', 8)->update(['icon_id' => 'laptop']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
