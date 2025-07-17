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
        if (!Schema::hasTable('ninjaone_alerts')) {
            Schema::create('ninjaone_alerts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('device_id')->constrained('devices')->onDelete('cascade');
                $table->string('alert_id')->nullable()->comment('ID de la alerta en NinjaOne');
                $table->string('type')->nullable()->comment('Tipo de alerta');
                $table->string('severity')->default('medium')->comment('Severidad: low, medium, high, critical');
                $table->text('message')->nullable()->comment('Mensaje de la alerta');
                $table->string('status')->default('open')->comment('Estado: open, acknowledged, resolved, dismissed');
                $table->timestamp('acknowledged_at')->nullable();
                $table->timestamp('resolved_at')->nullable();
                $table->timestamp('dismissed_at')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
                $table->json('metadata')->nullable()->comment('Datos adicionales de la alerta');
                $table->timestamps();
                
                $table->index(['device_id', 'status']);
                $table->index('alert_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ninjaone_alerts');
    }
};
