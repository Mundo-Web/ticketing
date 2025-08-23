# Configuración de Sesiones y Tokens CSRF

## 📋 Resumen

Este documento explica la configuración de sesiones para que nunca expiren y su impacto en los tokens CSRF del sistema.

## ⚙️ Configuración de Sesiones

### Cambios Realizados

En `config/session.php` se modificó el tiempo de vida de las sesiones:

```php
'lifetime' => (int) env('SESSION_LIFETIME', 525600), // 1 año en minutos
```

### Opciones de Configuración

1. **Sesiones que nunca expiran por inactividad:**
   - `SESSION_LIFETIME=525600` (1 año en minutos)
   - `SESSION_EXPIRE_ON_CLOSE=false` (no expira al cerrar navegador)

2. **Variables de entorno recomendadas:**
   ```env
   SESSION_LIFETIME=525600
   SESSION_EXPIRE_ON_CLOSE=false
   SESSION_DRIVER=database
   ```

## 🔒 Impacto en Tokens CSRF

### ¿Los tokens CSRF fallan con sesiones largas?

**Respuesta: NO necesariamente, pero hay consideraciones importantes:**

### 1. **Tokens CSRF y Sesiones**
- Los tokens CSRF están vinculados a la sesión del usuario
- Si la sesión nunca expira, el token CSRF tampoco expira
- **Ventaja:** Menos interrupciones por tokens expirados
- **Desventaja:** Menor rotación de tokens de seguridad

### 2. **Escenarios donde pueden fallar:**

#### A. Regeneración de Sesión
```php
// Si se regenera la sesión, el token CSRF cambia
Session::regenerate();
```

#### B. Logout/Login
```php
// Al hacer logout, se invalida la sesión y sus tokens
Auth::logout();
```

#### C. Limpieza Manual
```php
// Limpiar sesiones manualmente
Session::flush();
```

### 3. **Configuración CSRF Recomendada**

En `config/session.php`, mantener:
```php
'same_site' => env('SESSION_SAME_SITE', 'lax'),
'http_only' => env('SESSION_HTTP_ONLY', true),
'secure' => env('SESSION_SECURE_COOKIE'), // true en producción
```

## 🛡️ Consideraciones de Seguridad

### Ventajas de Sesiones Largas
- ✅ Mejor experiencia de usuario (no se desloguea)
- ✅ Menos interrupciones por tokens CSRF expirados
- ✅ Mantiene estado de aplicación por más tiempo

### Riesgos de Seguridad
- ⚠️ Sesiones secuestradas permanecen válidas más tiempo
- ⚠️ Tokens CSRF no rotan frecuentemente
- ⚠️ Mayor ventana de oportunidad para ataques

### Mitigaciones Recomendadas

1. **Regenerar sesión en acciones críticas:**
   ```php
   // En login exitoso
   Session::regenerate();
   
   // En cambios de contraseña
   Session::regenerate();
   ```

2. **Implementar timeout por inactividad en frontend:**
   ```javascript
   // Detectar inactividad del usuario
   let inactivityTimer;
   function resetTimer() {
       clearTimeout(inactivityTimer);
       inactivityTimer = setTimeout(logout, 30 * 60 * 1000); // 30 min
   }
   ```

3. **Monitoreo de sesiones activas:**
   ```php
   // Comando para limpiar sesiones muy antiguas
   DB::table('sessions')
       ->where('last_activity', '<', now()->subDays(30)->timestamp)
       ->delete();
   ```

## 🔧 Configuración Alternativa

### Para Mayor Seguridad (Recomendado para Producción)

```env
# Sesión de 8 horas
SESSION_LIFETIME=480
SESSION_EXPIRE_ON_CLOSE=false

# Regenerar token CSRF periódicamente
CSRF_TOKEN_REGENERATE=true
```

### Para Máxima Conveniencia (Desarrollo)

```env
# Sesión de 1 año
SESSION_LIFETIME=525600
SESSION_EXPIRE_ON_CLOSE=false
```

## 📝 Comandos Útiles

### Limpiar Sesiones
```bash
# Limpiar todas las sesiones
php artisan session:table
php artisan migrate

# Limpiar cache de sesiones
php artisan cache:clear
```

### Verificar Configuración
```bash
# Ver configuración actual
php artisan config:show session

# Limpiar config cache
php artisan config:clear
```

## 🎯 Conclusión

**Los tokens CSRF NO fallan automáticamente con sesiones largas**, pero es importante:

1. ✅ Configurar sesiones largas para mejor UX
2. ✅ Implementar regeneración de sesión en puntos críticos
3. ✅ Monitorear y limpiar sesiones antiguas
4. ✅ Usar HTTPS en producción
5. ✅ Considerar timeout por inactividad en frontend

La configuración actual permite sesiones de 1 año, lo que prácticamente elimina las expiraciones por inactividad mientras mantiene la funcionalidad CSRF intacta.