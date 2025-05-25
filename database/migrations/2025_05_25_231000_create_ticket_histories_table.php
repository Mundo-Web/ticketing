<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('ticket_histories');
        Schema::create('ticket_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->onDelete('cascade');
            $table->foreignId('technical_id')->nullable()->constrained('technicals')->onDelete('set null');
            $table->string('action'); // e.g. status_changed, assigned, comment, derived
            $table->text('description')->nullable(); // Optional details or comment
            $table->json('meta')->nullable(); // Extra data (e.g. from/to status)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_histories');
    }
};
