import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

console.log('🔧 [Bootstrap] Starting Echo initialization...');
console.log('🔧 [Bootstrap] Pusher available:', !!Pusher);
console.log('🔧 [Bootstrap] Echo available:', !!Echo);

window.Pusher = Pusher;

// Configuración simple para canales públicos
window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true
});

console.log('🚀 Echo initialized with config:', {
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true
});

console.log('✅ [Bootstrap] Echo instance created:', window.Echo);