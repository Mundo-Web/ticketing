<!DOCTYPE html>
<html>
<head>
    <title>🚨 PUSHER DEBUG TOTAL</title>
    <style>
        body { font-family: monospace; padding: 20px; }
        .log { margin: 5px 0; padding: 5px; background: #f0f0f0; }
        .error { background: #ffebee; color: #c62828; }
        .success { background: #e8f5e8; color: #2e7d32; }
        .info { background: #e3f2fd; color: #1565c0; }
        button { padding: 10px 20px; margin: 10px; font-size: 16px; }
    </style>
</head>
<body>
    <h1>� PUSHER DEBUG COMPLETO</h1>
    <div id="logs"></div>
    <button onclick="sendTest()">🔥 ENVIAR NOTIFICACIÓN</button>
    <button onclick="clearLogs()">🧹 LIMPIAR LOGS</button>
    
    <script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>
    <script>
        const logs = document.getElementById('logs');
        
        function addLog(message, type = 'info') {
            const now = new Date().toLocaleTimeString();
            const div = document.createElement('div');
            div.className = `log ${type}`;
            div.innerHTML = `[${now}] ${message}`;
            logs.appendChild(div);
            console.log(`[${type.toUpperCase()}] ${message}`);
            logs.scrollTop = logs.scrollHeight;
        }
        
        function clearLogs() {
            logs.innerHTML = '';
        }
        
        addLog('🚀 Iniciando conexión Pusher...', 'info');
        
        // Debug completo de Pusher
        Pusher.logToConsole = true;
        
        const pusher = new Pusher('c08250ed32ae6dc6ccc1', {
            cluster: 'us2',
            forceTLS: true,
            enabledTransports: ['ws', 'wss'],
            disabledTransports: []
        });
        
        // Estados de conexión
        pusher.connection.bind('connecting', () => {
            addLog('🔄 Conectando a Pusher...', 'info');
        });
        
        pusher.connection.bind('connected', () => {
            addLog('✅ ¡CONECTADO A PUSHER!', 'success');
            addLog(`Socket ID: ${pusher.connection.socket_id}`, 'info');
        });
        
        pusher.connection.bind('disconnected', () => {
            addLog('❌ Desconectado de Pusher', 'error');
        });
        
        pusher.connection.bind('error', (err) => {
            addLog(`❌ Error de conexión: ${JSON.stringify(err)}`, 'error');
        });
        
        // Suscripción al canal
        const channel = pusher.subscribe('notifications-public.183');
        
        channel.bind('pusher:subscription_succeeded', () => {
            addLog('🎯 SUSCRITO AL CANAL notifications-public.183', 'success');
        });
        
        channel.bind('pusher:subscription_error', (err) => {
            addLog(`❌ Error de suscripción: ${JSON.stringify(err)}`, 'error');
        });
        
        // EVENTO ESPECÍFICO
        channel.bind('notification.created', (data) => {
            addLog('🚨🚨🚨 NOTIFICACIÓN RECIBIDA: ' + JSON.stringify(data), 'success');
        });
        
        // CUALQUIER EVENTO (debug)
        channel.bind_global((eventName, data) => {
            addLog(`📡 Evento recibido [${eventName}]: ${JSON.stringify(data)}`, 'info');
        });
        
        function sendTest() {
            addLog('📤 Enviando notificación de prueba...', 'info');
            
            fetch('/api/send-test-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: 183 })
            })
            .then(response => response.json())
            .then(data => {
                addLog('✅ Respuesta del servidor: ' + JSON.stringify(data), 'success');
            })
            .catch(error => {
                addLog('❌ Error en petición: ' + error.message, 'error');
            });
        }
    </script>
</body>
</html>