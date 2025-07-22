<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== SETTING UP TENANT BRAD FOR LOGIN ===\n\n";

$tenant = \App\Models\Tenant::find(348);
if ($tenant) {
    echo "Found tenant: {$tenant->name} ({$tenant->email})\n";
    
    // Set password for login
    $tenant->password = bcrypt('password');
    $tenant->save();
    
    echo "Password set successfully!\n";
    echo "Login credentials:\n";
    echo "- Email: {$tenant->email}\n";
    echo "- Password: password\n\n";
    
    echo "Now tenant Brad can login and should see device alerts in notifications.\n";
} else {
    echo "Tenant Brad (ID: 348) not found!\n";
}
