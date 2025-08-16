<?php
require_once 'vendor/autoload.php';

// Cargar variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use Pusher\Pusher;

echo "🚀 TESTING PUSHER DIRECTO\n";

$pusher = new Pusher(
    $_ENV['PUSHER_APP_KEY'],
    $_ENV['PUSHER_APP_SECRET'],
    $_ENV['PUSHER_APP_ID'],
    [
        'cluster' => $_ENV['PUSHER_APP_CLUSTER'],
        'useTLS' => true
    ]
);

echo "✅ Pusher instanciado\n";
echo "📡 Enviando evento a canal: notifications-public.183\n";

$data = [
    'id' => 9999,
    'title' => 'PRUEBA DIRECTA PUSHER',
    'message' => 'Este mensaje viene directamente de PHP a Pusher',
    'user_id' => 183,
    'created_at' => date('Y-m-d H:i:s')
];

try {
    $result = $pusher->trigger('notifications-public.183', 'notification.created', $data);
    echo "🎯 EVENTO ENVIADO EXITOSAMENTE!\n";
    echo "📋 Resultado: " . json_encode($result) . "\n";
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}