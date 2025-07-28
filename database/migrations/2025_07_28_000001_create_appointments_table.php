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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->onDelete('cascade');
            $table->foreignId('technical_id')->constrained('technicals')->onDelete('cascade');
            $table->foreignId('scheduled_by')->constrained('users')->onDelete('cascade'); // Who scheduled this appointment
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('address'); // Where the appointment will take place
            $table->datetime('scheduled_for'); // When the appointment is scheduled
            $table->integer('estimated_duration')->default(60); // Duration in minutes
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'])->default('scheduled');
            $table->text('notes')->nullable(); // Additional notes
            $table->text('member_instructions')->nullable(); // Instructions for the member
            $table->text('completion_notes')->nullable(); // Notes after completion
            $table->datetime('started_at')->nullable(); // When technician started the visit
            $table->datetime('completed_at')->nullable(); // When technician completed the visit
            $table->json('member_feedback')->nullable(); // Member's feedback after appointment
            $table->integer('rating')->nullable(); // 1-5 star rating from member
            $table->timestamps();

            $table->index(['technical_id', 'scheduled_for']);
            $table->index(['ticket_id', 'status']);
            $table->index(['scheduled_for', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
