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
        Schema::table('brands', function (Blueprint $table) {
       
            $table->softDeletes();
        });
        Schema::table('models', function (Blueprint $table) {
            // ...
            $table->softDeletes();
        });
        Schema::table('systems', function (Blueprint $table) {
            // ...
            $table->softDeletes();
        });
        Schema::table('name_devices', function (Blueprint $table) {
            // ...
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('device', function (Blueprint $table) {
            //
        });
    }
};
