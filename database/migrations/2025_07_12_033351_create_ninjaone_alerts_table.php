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
        Schema::create('ninjaone_alerts', function (Blueprint $table) {
            $table->id();
            $table->string('ninjaone_alert_id')->unique()->comment('Unique alert ID from NinjaOne');
            $table->string('ninjaone_device_id')->index()->comment('Device ID from NinjaOne');
            $table->foreignId('device_id')->nullable()->constrained()->onDelete('set null')->comment('Local device ID if matched');
            $table->string('alert_type')->comment('Type of alert (critical, warning, info)');
            $table->string('severity')->comment('Alert severity level');
            $table->string('title')->comment('Alert title/summary');
            $table->text('description')->comment('Detailed alert description');
            $table->json('metadata')->nullable()->comment('Full alert payload from NinjaOne');
            $table->string('status')->default('open')->comment('Alert status: open, acknowledged, resolved');
            $table->timestamp('ninjaone_created_at')->comment('Alert creation time in NinjaOne');
            $table->timestamp('acknowledged_at')->nullable()->comment('When alert was acknowledged');
            $table->timestamp('resolved_at')->nullable()->comment('When alert was resolved');
            $table->foreignId('ticket_id')->nullable()->constrained()->onDelete('set null')->comment('Generated ticket ID if any');
            $table->boolean('notification_sent')->default(false)->comment('Whether notification was sent to user');
            $table->timestamps();
            
            $table->index(['status', 'created_at']);
            $table->index(['device_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ninjaone_alerts');
    }
};
