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
            // First drop the current status column
            $table->dropColumn('status');
        });

        Schema::table('appointments', function (Blueprint $table) {
            // Add the new status column with no_show option
            $table->enum('status', ['scheduled', 'in_progress', 'awaiting_feedback', 'completed', 'cancelled', 'rescheduled', 'no_show'])->default('scheduled');
            
            // Add no-show specific fields
            $table->string('no_show_reason')->nullable();
            $table->text('no_show_description')->nullable();
            $table->timestamp('marked_no_show_at')->nullable();
            $table->unsignedBigInteger('marked_no_show_by')->nullable();
            
            // Foreign key for who marked it as no-show
            $table->foreign('marked_no_show_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Drop foreign key and new fields
            $table->dropForeign(['marked_no_show_by']);
            $table->dropColumn(['no_show_reason', 'no_show_description', 'marked_no_show_at', 'marked_no_show_by']);
            
            // Drop status column
            $table->dropColumn('status');
        });

        Schema::table('appointments', function (Blueprint $table) {
            // Restore the old status column
            $table->enum('status', ['scheduled', 'in_progress', 'awaiting_feedback', 'completed', 'cancelled', 'rescheduled'])->default('scheduled');
        });
    }
};
