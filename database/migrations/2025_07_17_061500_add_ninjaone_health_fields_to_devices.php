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
        // Verificar si la tabla devices existe
        if (Schema::hasTable('devices')) {
            Schema::table('devices', function (Blueprint $table) {
                // Verificar que las columnas no existan antes de añadirlas
                if (!Schema::hasColumn('devices', 'ninjaone_system_name')) {
                    $table->string('ninjaone_system_name')->nullable()->after('is_in_ninjaone');
                }
                
                if (!Schema::hasColumn('devices', 'ninjaone_hostname')) {
                    $table->string('ninjaone_hostname')->nullable()->after('ninjaone_system_name');
                }
                
                if (!Schema::hasColumn('devices', 'ninjaone_status')) {
                    $table->string('ninjaone_status')->nullable()->after('ninjaone_hostname');
                }
                
                if (!Schema::hasColumn('devices', 'ninjaone_issues_count')) {
                    $table->integer('ninjaone_issues_count')->nullable()->default(0)->after('ninjaone_status');
                }
                
                if (!Schema::hasColumn('devices', 'ninjaone_online')) {
                    $table->boolean('ninjaone_online')->nullable()->default(false)->after('ninjaone_issues_count');
                }
                
                if (!Schema::hasColumn('devices', 'ninjaone_needs_attention')) {
                    $table->boolean('ninjaone_needs_attention')->nullable()->default(false)->after('ninjaone_online');
                }
                
                if (!Schema::hasColumn('devices', 'ninjaone_os')) {
                    $table->string('ninjaone_os')->nullable()->after('ninjaone_needs_attention');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('devices')) {
            Schema::table('devices', function (Blueprint $table) {
                $columns = [
                    'ninjaone_system_name',
                    'ninjaone_hostname',
                    'ninjaone_status',
                    'ninjaone_issues_count',
                    'ninjaone_online',
                    'ninjaone_needs_attention',
                    'ninjaone_os'
                ];
                
                foreach ($columns as $column) {
                    if (Schema::hasColumn('devices', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
