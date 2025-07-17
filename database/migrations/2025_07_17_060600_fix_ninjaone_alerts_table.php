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
        // Hacer que todos los campos sean nullable para evitar problemas con campos adicionales
        Schema::table('ninjaone_alerts', function (Blueprint $table) {
            // En lugar de modificar el campo, agregamos el campo a nuestro modelo
            // para que lo pueda manejar automáticamente
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No revertir
    }
};
