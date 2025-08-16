<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

// Canal público para pruebas (sin autenticación)
Broadcast::channel('notifications-public.{userId}', function ($user, $userId) {
    Log::info('Public broadcasting channel access', [
        'user_id' => $user ? $user->id : 'null',
        'requested_userId' => $userId
    ]);
    return true; // Siempre permitir acceso para pruebas
});

// Canal privado original (con autenticación)
Broadcast::channel('notifications.{userId}', function ($user, $userId) {
    Log::info('Broadcasting channel authorization', [
        'user_id' => $user ? $user->id : 'null',
        'user_email' => $user ? $user->email : 'null',
        'requested_userId' => $userId,
        'user_object' => $user ? 'present' : 'null'
    ]);
    
    if (!$user) {
        Log::error('Broadcasting auth failed: No user found');
        return false;
    }
    
    $authorized = (int) $user->id === (int) $userId;
    
    Log::info('Broadcasting authorization result', [
        'user_id' => $user->id,
        'requested_userId' => $userId,
        'authorized' => $authorized
    ]);
    
    return $authorized;
});