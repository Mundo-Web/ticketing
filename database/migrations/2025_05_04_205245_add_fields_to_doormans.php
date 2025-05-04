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
        Schema::table('doormen', function (Blueprint $table) {
            $table->enum('shift', ['morning', 'afternoon', 'night'])
                ->default('morning');
            $table->boolean('visible')->default(true);
            $table->boolean('status')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doormans', function (Blueprint $table) {
            //
        });
    }
};
