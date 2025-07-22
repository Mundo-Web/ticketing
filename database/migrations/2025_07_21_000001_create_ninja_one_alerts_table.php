<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ninja_one_alerts', function (Blueprint $table) {
            $table->id();
            $table->string('ninjaone_alert_id')->unique();
            $table->foreignId('device_id')->nullable()->constrained()->onDelete('set null');
            $table->string('alert_type');
            $table->enum('severity', ['info', 'warning', 'critical']);
            $table->enum('status', ['open', 'acknowledged', 'resolved'])->default('open');
            $table->string('title');
            $table->text('description');
            $table->json('raw_data')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->boolean('ticket_created')->default(false);
            $table->timestamps();

            $table->index(['status', 'severity']);
            $table->index(['device_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('ninja_one_alerts');
    }
};
