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
        Schema::table('tickets', function (Blueprint $table) {
            $table->unsignedBigInteger('created_by_owner_id')->nullable()->after('technical_id');
            $table->unsignedBigInteger('created_by_doorman_id')->nullable()->after('created_by_owner_id');
            
            // Foreign keys
            $table->foreign('created_by_owner_id')->references('id')->on('owners')->onDelete('set null');
            $table->foreign('created_by_doorman_id')->references('id')->on('doormen')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['created_by_owner_id']);
            $table->dropForeign(['created_by_doorman_id']);
            $table->dropColumn(['created_by_owner_id', 'created_by_doorman_id']);
        });
    }
};
