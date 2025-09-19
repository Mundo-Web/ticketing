<?php
/**
 * Script de prueba para verificar configuración CSRF en producción
 * Este script ayuda a diagnosticar problemas con tokens CSRF
 */

require __DIR__ . '/vendor/autoload.php';

echo "=== DIAGNÓSTICO CSRF EN PRODUCCIÓN ===\n\n";

// 1. Verificar configuración de sesión
echo "1. CONFIGURACIÓN DE SESIÓN:\n";
echo "SESSION_DOMAIN: " . env('SESSION_DOMAIN', 'null') . "\n";
echo "SESSION_SECURE_COOKIE: " . env('SESSION_SECURE_COOKIE', 'false') . "\n";
echo "APP_URL: " . env('APP_URL', 'http://localhost') . "\n";
echo "APP_ENV: " . env('APP_ENV', 'local') . "\n\n";

// 2. Verificar permisos de storage
echo "2. PERMISOS DE STORAGE:\n";
$storageFramework = __DIR__ . '/storage/framework';
$sessionPath = $storageFramework . '/sessions';

echo "Storage framework existe: " . (is_dir($storageFramework) ? 'SÍ' : 'NO') . "\n";
echo "Sessions dir existe: " . (is_dir($sessionPath) ? 'SÍ' : 'NO') . "\n";

if (is_dir($storageFramework)) {
    echo "Permisos storage/framework: " . substr(sprintf('%o', fileperms($storageFramework)), -4) . "\n";
}

if (is_dir($sessionPath)) {
    echo "Permisos sessions: " . substr(sprintf('%o', fileperms($sessionPath)), -4) . "\n";
    echo "Archivos de sesión: " . count(glob($sessionPath . '/*')) . "\n";
}

echo "\n";

// 3. Verificar middleware CSRF
echo "3. VERIFICAR MIDDLEWARE CSRF:\n";
$middlewareFile = __DIR__ . '/app/Http/Middleware/VerifyCsrfToken.php';
echo "Middleware CSRF existe: " . (file_exists($middlewareFile) ? 'SÍ' : 'NO') . "\n";

if (file_exists($middlewareFile)) {
    $content = file_get_contents($middlewareFile);
    if (strpos($content, 'api/*') !== false) {
        echo "API routes excluidas: SÍ\n";
    } else {
        echo "API routes excluidas: NO (puede causar problemas)\n";
    }
}

echo "\n";

// 4. Verificar archivos de configuración cacheados
echo "4. CACHÉ DE CONFIGURACIÓN:\n";
$configCache = __DIR__ . '/bootstrap/cache/config.php';
$routeCache = __DIR__ . '/bootstrap/cache/routes-v7.php';

echo "Config cache existe: " . (file_exists($configCache) ? 'SÍ - ELIMINAR CON php artisan config:clear' : 'NO') . "\n";
echo "Route cache existe: " . (file_exists($routeCache) ? 'SÍ - ELIMINAR CON php artisan route:clear' : 'NO') . "\n";

echo "\n";

// 5. Generar comando de limpieza
echo "5. COMANDOS RECOMENDADOS PARA EL SERVIDOR:\n";
echo "cd " . __DIR__ . "\n";
echo "php artisan config:clear\n";
echo "php artisan route:clear\n";
echo "php artisan view:clear\n";
echo "php artisan cache:clear\n";
echo "chmod -R 755 storage/\n";
echo "chown -R www-data:www-data storage/\n";

echo "\n";

// 6. Verificar archivos compilados
echo "6. ASSETS COMPILADOS:\n";
$manifestFile = __DIR__ . '/public/build/manifest.json';
echo "Manifest existe: " . (file_exists($manifestFile) ? 'SÍ' : 'NO') . "\n";

if (file_exists($manifestFile)) {
    $manifest = json_decode(file_get_contents($manifestFile), true);
    echo "Assets principales:\n";
    foreach (['resources/js/app.tsx', 'resources/css/app.css'] as $asset) {
        if (isset($manifest[$asset])) {
            echo "  - $asset -> " . $manifest[$asset]['file'] . "\n";
        }
    }
}

echo "\n=== FIN DEL DIAGNÓSTICO ===\n";