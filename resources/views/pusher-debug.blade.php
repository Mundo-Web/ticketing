<!DOCTYPE html>
<html>
<head>
    <title>Pusher Debug</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body>
    <h1>🔍 Pusher Connection Debug</h1>
    <div id="debug-info"></div>
    
    <script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>
    <script>
        const debugDiv = document.getElementById('debug-info');
        
        function log(message) {
            console.log(message);
            debugDiv.innerHTML += '<p>' + message + '</p>';
        }
        
        log('🔄 Starting Pusher connection test...');
        
        // Test direct Pusher connection
        const pusher = new Pusher('{{ env("VITE_PUSHER_APP_KEY") }}', {
            cluster: '{{ env("VITE_PUSHER_APP_CLUSTER") }}',
            forceTLS: true
        });
        
        log('📡 Pusher instance created');
        log('🔑 Key: {{ env("VITE_PUSHER_APP_KEY") }}');
        log('🌍 Cluster: {{ env("VITE_PUSHER_APP_CLUSTER") }}');
        
        pusher.connection.bind('connected', () => {
            log('✅ Pusher connected successfully!');
            
            // Subscribe to public channel
            const channel = pusher.subscribe('notifications-public.1');
            
            channel.bind('pusher:subscription_succeeded', () => {
                log('✅ Successfully subscribed to notifications-public.1');
            });
            
            channel.bind('notification.created', (data) => {
                log('🚨 NOTIFICATION RECEIVED: ' + JSON.stringify(data));
            });
            
            channel.bind('pusher:subscription_error', (error) => {
                log('❌ Subscription error: ' + JSON.stringify(error));
            });
        });
        
        pusher.connection.bind('disconnected', () => {
            log('⚠️ Pusher disconnected');
        });
        
        pusher.connection.bind('error', (error) => {
            log('❌ Pusher error: ' + JSON.stringify(error));
        });
        
        setTimeout(() => {
            log('📊 Connection state: ' + pusher.connection.state);
        }, 2000);
    </script>
</body>
</html>