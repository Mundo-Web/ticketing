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
        if (Schema::hasTable('ninjaone_alerts')) {
            Schema::table('ninjaone_alerts', function (Blueprint $table) {
                if (!Schema::hasColumn('ninjaone_alerts', 'alert_id')) {
                    $table->string('alert_id')->nullable()->comment('ID de la alerta en NinjaOne');
                }
                
                if (!Schema::hasColumn('ninjaone_alerts', 'type')) {
                    $table->string('type')->nullable()->comment('Tipo de alerta');
                }
                
                if (!Schema::hasColumn('ninjaone_alerts', 'severity')) {
                    $table->string('severity')->default('medium')->comment('Severidad: low, medium, high, critical');
                }
                
                if (!Schema::hasColumn('ninjaone_alerts', 'message')) {
                    $table->text('message')->nullable()->comment('Mensaje de la alerta');
                }
                
                if (!Schema::hasColumn('ninjaone_alerts', 'status')) {
                    $table->string('status')->default('open')->comment('Estado: open, acknowledged, resolved, dismissed');
                }
                
                if (!Schema::hasColumn('ninjaone_alerts', 'acknowledged_at')) {
                    $table->timestamp('acknowledged_at')->nullable();
                }
                
                if (!Schema::hasColumn('ninjaone_alerts', 'resolved_at')) {
                    $table->timestamp('resolved_at')->nullable();
                }
                
                if (!Schema::hasColumn('ninjaone_alerts', 'dismissed_at')) {
                    $table->timestamp('dismissed_at')->nullable();
                }
                
                if (!Schema::hasColumn('ninjaone_alerts', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
                }
                
                if (!Schema::hasColumn('ninjaone_alerts', 'metadata')) {
                    $table->json('metadata')->nullable()->comment('Datos adicionales de la alerta');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No se puede revertir esta migración fácilmente ya que podría haber datos
    }
};
