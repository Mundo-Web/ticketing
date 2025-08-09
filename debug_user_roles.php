<?php
require 'vendor/autoload.php';

use Illuminate\Foundation\Application;

$app = new Application(realpath(__DIR__));
$app->singleton(
    \Illuminate\Contracts\Http\Kernel::class,
    \App\Http\Kernel::class
);
$app->singleton(
    \Illuminate\Contracts\Console\Kernel::class,
    \App\Console\Kernel::class
);
$app->singleton(
    \Illuminate\Contracts\Debug\ExceptionHandler::class,
    \App\Exceptions\Handler::class
);

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== DEBUG USER ROLES ===\n";

// Obtener todos los usuarios con rol technical
$technicalUsers = \App\Models\User::role('technical')->get();

echo "Technical users found: " . $technicalUsers->count() . "\n\n";

foreach ($technicalUsers as $user) {
    echo "User: {$user->email}\n";
    echo "Roles: " . $user->roles->pluck('name')->join(', ') . "\n";
    
    $technical = \App\Models\Technical::where('email', $user->email)->first();
    if ($technical) {
        echo "Technical ID: {$technical->id}\n";
        echo "Is Default: " . ($technical->is_default ? 'YES' : 'NO') . "\n";
        echo "Name: {$technical->name}\n";
    } else {
        echo "NO TECHNICAL RECORD FOUND!\n";
    }
    echo "---\n";
}

// También mostrar super-admins
echo "\n=== SUPER ADMINS ===\n";
$admins = \App\Models\User::role('super-admin')->get();
foreach ($admins as $admin) {
    echo "Admin: {$admin->email}\n";
}

echo "\nDone.\n";
