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
        Schema::create('push_tokens', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('push_token')->unique();
            $table->enum('platform', ['ios', 'android']);
            $table->string('device_name')->nullable();
            $table->string('device_type');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id']);
            $table->index(['push_token']);
            $table->index(['is_active']);

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('push_tokens');
    }
};
