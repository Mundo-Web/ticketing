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
        // Para MySQL, necesitamos usar ALTER TABLE para modificar el ENUM
        DB::statement("ALTER TABLE ninja_one_alerts MODIFY COLUMN severity ENUM('low', 'info', 'medium', 'warning', 'high', 'critical') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir a los valores originales
        DB::statement("ALTER TABLE ninja_one_alerts MODIFY COLUMN severity ENUM('info', 'warning', 'critical') NOT NULL");
    }
};
