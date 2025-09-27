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
        Schema::table('push_tokens', function (Blueprint $table) {
            $table->string('token_type')->default('expo')->after('push_token'); // 'expo' o 'fcm'
            $table->string('app_ownership')->nullable()->after('token_type'); // 'expo' o 'standalone'
            $table->boolean('is_standalone')->default(false)->after('app_ownership');
            $table->string('execution_environment')->nullable()->after('is_standalone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('push_tokens', function (Blueprint $table) {
            $table->dropColumn(['token_type', 'app_ownership', 'is_standalone', 'execution_environment']);
        });
    }
};
