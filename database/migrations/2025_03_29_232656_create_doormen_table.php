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
        Schema::create('doormen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('building_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('email');
            $table->string('photo')->nullable();
            $table->string('phone')->nullable();
            $table->string('turn')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doormen');
    }
};
