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
        Schema::table('ninja_one_alerts', function (Blueprint $table) {
            // Check if ticket_id column doesn't exist before adding it
            if (!Schema::hasColumn('ninja_one_alerts', 'ticket_id')) {
                $table->unsignedBigInteger('ticket_id')->nullable()->after('device_id');
                $table->foreign('ticket_id')->references('id')->on('tickets')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ninja_one_alerts', function (Blueprint $table) {
            if (Schema::hasColumn('ninja_one_alerts', 'ticket_id')) {
                $table->dropForeign(['ticket_id']);
                $table->dropColumn('ticket_id');
            }
        });
    }
};
