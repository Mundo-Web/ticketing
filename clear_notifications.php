<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "=== Clearing Old Notifications ===\n\n";

try {
    // Clear all existing notifications
    $deletedCount = DB::table('notifications')->delete();
    echo "✅ Deleted {$deletedCount} old notifications\n\n";

    // Show clean slate
    echo "Current notification counts (should be 0):\n";
    $users = User::with('roles')->get();
    foreach ($users as $user) {
        $count = $user->unreadNotifications()->count();
        $roles = $user->roles->pluck('name')->toArray();
        echo "• {$user->name} (" . implode(', ', $roles) . "): {$count} notifications\n";
    }

    echo "\n=== Now create a ticket from the frontend and check for new notifications! ===\n";

} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
