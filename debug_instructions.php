<?php

require_once 'vendor/autoload.php';

use App\Models\Technical;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== DEBUG: Technical Instructions ===\n";

// Find technical with email tex@gmail.com
$technical = Technical::where('email', 'tex@gmail.com')->first();

if ($technical) {
    echo "Technical found:\n";
    echo "- ID: {$technical->id}\n";
    echo "- Name: {$technical->name}\n";
    echo "- Email: {$technical->email}\n";
    echo "- is_default: " . ($technical->is_default ? 'true' : 'false') . "\n";
    echo "- Has instructions: " . ($technical->instructions ? 'yes' : 'no') . "\n";
    
    if ($technical->instructions) {
        echo "- Instructions:\n";
        echo json_encode($technical->instructions, JSON_PRETTY_PRINT);
    } else {
        echo "- No instructions found\n";
    }
} else {
    echo "Technical with email tex@gmail.com NOT FOUND\n";
}

echo "\n=== All Technicals ===\n";
$allTechnicals = Technical::all();
foreach ($allTechnicals as $tech) {
    echo "- {$tech->name} ({$tech->email}) - is_default: " . ($tech->is_default ? 'true' : 'false') . " - instructions: " . ($tech->instructions ? 'yes' : 'no') . "\n";
}

echo "\n=== END DEBUG ===\n";
