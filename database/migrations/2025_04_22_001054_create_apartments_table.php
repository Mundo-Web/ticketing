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
        Schema::create('apartments', function (Blueprint $table) {

            $table->id(); // id autoincrement primary key
            $table->string('name', 255);
            $table->string('ubicacion', 255);
            $table->unsignedBigInteger('buildings_id');
            $table->timestamps();

            // Relación con buildings
            $table->foreign('buildings_id')->references('id')->on('buildings')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('apartments');
    }
};
