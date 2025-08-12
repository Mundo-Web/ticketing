<?php

// Simple verification of notification system
echo "🔍 CHECKING TICKET CREATION NOTIFICATION SYSTEM\n";
echo "=================================================\n\n";

// Check if notifications table exists
try {
    $pdo = new PDO('mysql:host=localhost;dbname=ticketing', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check notifications table
    $stmt = $pdo->query("SHOW TABLES LIKE 'notifications'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Notifications table exists\n";
        
        // Count current notifications
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM notifications");
        $result = $stmt->fetch();
        echo "📊 Current notifications in database: " . $result['count'] . "\n\n";
        
        // Show recent notifications
        $stmt = $pdo->query("
            SELECT n.*, u.name as user_name, u.email 
            FROM notifications n 
            JOIN users u ON n.notifiable_id = u.id 
            ORDER BY n.created_at DESC 
            LIMIT 5
        ");
        
        echo "📋 Recent notifications:\n";
        while ($row = $stmt->fetch()) {
            $data = json_decode($row['data'], true);
            echo "- {$row['user_name']} ({$row['email']}): {$data['message']}\n";
            echo "  Created: {$row['created_at']}\n";
            echo "  Read: " . ($row['read_at'] ? 'Yes' : 'No') . "\n\n";
        }
    } else {
        echo "❌ Notifications table not found\n";
    }
    
    // Check users with super-admin role
    $stmt = $pdo->query("
        SELECT u.name, u.email 
        FROM users u 
        JOIN model_has_roles mhr ON u.id = mhr.model_id 
        JOIN roles r ON mhr.role_id = r.id 
        WHERE r.name = 'super-admin'
    ");
    
    echo "👥 Super-admins who will receive notifications:\n";
    while ($row = $stmt->fetch()) {
        echo "- {$row['name']} ({$row['email']})\n";
    }
    echo "\n";
    
    // Check technical-default users
    $stmt = $pdo->query("
        SELECT u.name, u.email, t.is_default
        FROM users u 
        JOIN model_has_roles mhr ON u.id = mhr.model_id 
        JOIN roles r ON mhr.role_id = r.id 
        JOIN technicals t ON u.email = t.email
        WHERE r.name = 'technical' AND t.is_default = 1
    ");
    
    echo "🔧 Technical-defaults who will receive notifications:\n";
    while ($row = $stmt->fetch()) {
        echo "- {$row['name']} ({$row['email']})\n";
    }
    
    echo "\n✨ SYSTEM READY FOR TESTING!\n";
    echo "Now create a ticket from the frontend and check if notifications are created.\n";
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}
