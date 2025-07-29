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
        Schema::table('appointments', function (Blueprint $table) {
            // Add new status for awaiting feedback
            $table->dropColumn('status');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->enum('status', ['scheduled', 'in_progress', 'awaiting_feedback', 'completed', 'cancelled', 'rescheduled'])->default('scheduled');
            
            // Change member_feedback from JSON to text for simplicity
            $table->dropColumn('member_feedback');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->text('member_feedback')->nullable();
            
            // Rename rating to service_rating for clarity
            $table->renameColumn('rating', 'service_rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'])->default('scheduled');
            
            $table->dropColumn('member_feedback');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->json('member_feedback')->nullable();
            $table->renameColumn('service_rating', 'rating');
        });
    }
};
