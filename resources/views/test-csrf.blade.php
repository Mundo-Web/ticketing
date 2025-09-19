<!-- 
    Script de prueba CSRF - Coloca esto en una página de prueba para verificar 
    que el sistema CSRF automático funciona después del login 
-->
<!DOCTYPE html>
<html>
<head>
    <title>Test CSRF Auto-Refresh</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body>
    <h1>Test CSRF Token Auto-Refresh</h1>
    
    <div id="test-results">
        <p>Cargando...</p>
    </div>

    <button onclick="testCSRFToken()">Test CSRF Token</button>
    <button onclick="testDeleteTicket()">Test Delete Ticket (simulado)</button>

    <script>
        // Importar nuestro sistema CSRF (ajusta la ruta según necesites)
        // En producción esto ya estará disponible globalmente
        
        function testCSRFToken() {
            const results = document.getElementById('test-results');
            
            // Test 1: Token inicial
            const initialToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            results.innerHTML = '<h3>Test Results:</h3>';
            results.innerHTML += '<p><strong>Token inicial:</strong> ' + (initialToken ? initialToken.substring(0, 10) + '...' : 'NO ENCONTRADO') + '</p>';
            
            // Test 2: Token desde nuestro helper (si está disponible)
            if (typeof getCSRFToken !== 'undefined') {
                const helperToken = getCSRFToken();
                results.innerHTML += '<p><strong>Token desde helper:</strong> ' + (helperToken ? helperToken.substring(0, 10) + '...' : 'NO ENCONTRADO') + '</p>';
                results.innerHTML += '<p><strong>Tokens coinciden:</strong> ' + (initialToken === helperToken ? 'SÍ ✅' : 'NO ❌') + '</p>';
            } else {
                results.innerHTML += '<p><strong>Helper no disponible</strong> - Sistema CSRF manual en uso</p>';
            }
            
            // Test 3: Headers CSRF
            if (typeof createCSRFHeaders !== 'undefined') {
                const headers = createCSRFHeaders();
                results.innerHTML += '<p><strong>Headers generados:</strong> X-CSRF-TOKEN presente: ' + (headers['X-CSRF-TOKEN'] ? 'SÍ ✅' : 'NO ❌') + '</p>';
            }
        }
        
        function testDeleteTicket() {
            // Simular la función confirmDelete actualizada
            const results = document.getElementById('test-results');
            results.innerHTML += '<h3>Simulando Delete Ticket:</h3>';
            
            // Método antiguo (problemático)
            const oldToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            results.innerHTML += '<p><strong>Método antiguo:</strong> ' + (oldToken ? oldToken.substring(0, 10) + '...' : 'NO ENCONTRADO') + '</p>';
            
            // Método nuevo (con nuestro helper)
            if (typeof createCSRFHeaders !== 'undefined') {
                const headers = createCSRFHeaders();
                results.innerHTML += '<p><strong>Método nuevo:</strong> ' + (headers['X-CSRF-TOKEN'] ? headers['X-CSRF-TOKEN'].substring(0, 10) + '...' : 'NO ENCONTRADO') + '</p>';
                results.innerHTML += '<p><strong>Status:</strong> ✅ Sistema automático funcionando</p>';
            } else {
                results.innerHTML += '<p><strong>Status:</strong> ❌ Sistema automático NO disponible</p>';
            }
        }
        
        // Auto-test al cargar
        setTimeout(testCSRFToken, 1000);
    </script>
</body>
</html>