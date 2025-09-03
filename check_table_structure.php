<?php

/**
 * Check table structure script
 */

// Bootstrap Laravel
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;

echo "🔍 Checking ninja_one_alerts table structure...\n";

try {
    if (Schema::hasTable('ninja_one_alerts')) {
        echo "✅ Table 'ninja_one_alerts' exists\n";
        echo "📋 Columns:\n";
        
        $columns = Schema::getColumnListing('ninja_one_alerts');
        foreach ($columns as $column) {
            echo "   - {$column}\n";
        }
    } else {
        echo "❌ Table 'ninja_one_alerts' does not exist\n";
        echo "🔧 You need to create the migration first\n";
    }
} catch (Exception $e) {
    echo "❌ Error checking table: " . $e->getMessage() . "\n";
}

echo "\n🎉 Check completed!\n";