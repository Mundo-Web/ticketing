<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('device_tenant', function (Blueprint $table) {
            $table->id();
         
         
            $table->timestamps();
            $table->unsignedBigInteger('device_id');
            $table->foreign('device_id')->references('id')->on('devices')->onDelete('cascade');
            $table->unsignedBigInteger('tenant_id');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        Schema::create('share_device_tenant', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('device_id');
            $table->foreign('device_id')->references('id')->on('devices')->onDelete('cascade');
            $table->unsignedBigInteger('owner_tenant_id');
            $table->foreign('owner_tenant_id')->references('id')->on('tenants')->onDelete('cascade');      
            $table->unsignedBigInteger('shared_with_tenant_id');
            $table->foreign('shared_with_tenant_id')->references('id')->on('tenants')->onDelete('cascade');      
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_tenant');
        Schema::dropIfExists('share_device_tenant');
    }
};
