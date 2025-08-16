<!DOCTYPE html>
<html>
<head>
    <title>Test Real-time Notification</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        button, a { padding: 10px 20px; margin: 10px; display: inline-block; }
        button { background: #007cba; color: white; border: none; cursor: pointer; }
        a { background: #28a745; color: white; text-decoration: none; }
        button:hover, a:hover { opacity: 0.8; }
    </style>
</head>
<body>
    <h1>🧪 Manual Notification Test</h1>
    
    <h3>Method 1: Simple GET Request</h3>
    <a href="/test-send-notification-simple" target="_blank">📡 Send Test Notification (GET)</a>
    
    <h3>Method 2: POST with CSRF</h3>
    <button onclick="sendNotification()">📡 Send Test Notification (POST)</button>
    
    <div id="result"></div>
    
    <hr>
    <h3>🎯 Instructions:</h3>
    <ol>
        <li><strong>Open the dashboard</strong> in another tab: <a href="/dashboard" target="_blank">Go to Dashboard</a></li>
        <li><strong>Open browser console</strong> in the dashboard tab (F12 → Console)</li>
        <li><strong>Click one of the buttons above</strong> to send a test notification</li>
        <li><strong>Watch the dashboard</strong> for real-time notification!</li>
    </ol>
    
    <script>
        function sendNotification() {
            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            
            fetch('/test-send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({})
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Notification sent:', data);
                document.getElementById('result').innerHTML = '<p style="color: green;">✅ Notification sent successfully! Check the dashboard tab.</p>';
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('result').innerHTML = '<p style="color: red;">❌ Error sending notification: ' + error.message + '</p>';
            });
        }
    </script>
</body>
</html>