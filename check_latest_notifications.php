<?php

// Quick check for latest notifications after ticket creation
$pdo = new PDO('mysql:host=localhost;dbname=ticketing', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "📊 CHECKING LATEST NOTIFICATIONS\n";
echo "===============================\n\n";

$stmt = $pdo->query("SELECT COUNT(*) as count FROM notifications");
$result = $stmt->fetch();
echo "Total notifications: " . $result['count'] . "\n\n";

// Show latest notifications
$stmt = $pdo->query("
    SELECT n.*, u.name as user_name, u.email 
    FROM notifications n 
    JOIN users u ON n.notifiable_id = u.id 
    ORDER BY n.created_at DESC 
    LIMIT 5
");

echo "📋 Latest notifications:\n";
while ($row = $stmt->fetch()) {
    $data = json_decode($row['data'], true);
    echo "- {$row['user_name']}: {$data['message']}\n";
    echo "  Created: {$row['created_at']}\n";
    echo "  Type: {$data['type']}\n\n";
}
