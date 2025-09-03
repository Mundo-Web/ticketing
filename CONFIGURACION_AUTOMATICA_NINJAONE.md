# 🚀 AUTOMATIZACIÓN COMPLETA - Configuración para escuchar NinjaOne

## 📋 CÓMO FUNCIONA LA SINCRONIZACIÓN AUTOMÁTICA

### 1. CRON JOB (Método Principal)
```bash
# Windows Task Scheduler o Linux Crontab
# Sincronizar cada 5 minutos
*/5 * * * * cd C:\xampp\htdocs\projects\ticketing && php artisan ninjaone:sync-alerts

# Cada 15 minutos (recomendado para producción)
*/15 * * * * cd C:\xampp\htdocs\projects\ticketing && php artisan ninjaone:sync-alerts
```

### 2. WEBHOOK EN TIEMPO REAL (Avanzado)
```php
// Ya tienes configurado el webhook en:
// routes/api.php línea 164: Route::post('/ninjaone/webhook', ...)

// NinjaOne puede enviar notificaciones instantáneas cuando:
// - Un dispositivo tiene problemas
// - Se genera una nueva alerta
// - Cambia el estado de un dispositivo
```

### 3. CONFIGURACIÓN DEL CRON JOB

#### Para Windows (Task Scheduler):
1. Abrir "Programador de tareas" (Task Scheduler)
2. Crear tarea básica
3. Nombre: "NinjaOne Alerts Sync"
4. Disparador: Cada 15 minutos
5. Acción: Ejecutar programa
   - Programa: `php.exe`
   - Argumentos: `artisan ninjaone:sync-alerts`
   - Directorio: `C:\xampp\htdocs\projects\ticketing`

#### Para Linux (Crontab):
```bash
# Editar crontab
crontab -e

# Agregar línea:
*/15 * * * * cd /path/to/ticketing && php artisan ninjaone:sync-alerts >> /var/log/ninjaone-sync.log 2>&1
```

### 4. MONITOREO EN TIEMPO REAL

#### Opción A: Supervisord (Linux)
```ini
[program:ninjaone-sync]
command=php artisan ninjaone:sync-alerts
directory=/path/to/ticketing
user=www-data
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/ninjaone-sync.log
```

#### Opción B: Windows Service
Convertir el comando en un servicio de Windows que corra continuamente.

### 5. WEBHOOK SETUP (Tiempo Real)

En NinjaOne Dashboard:
1. Ir a Administration → Integrations → Webhooks
2. Crear nuevo webhook:
   - URL: `https://tu-dominio.com/api/ninjaone/webhook`
   - Events: Device alerts, Device status changes
   - Authentication: Bearer token o API key

### 6. CONFIGURACIÓN HÍBRIDA (RECOMENDADO)

```bash
# Sync rápido cada 5 minutos para alertas críticas
*/5 * * * * php artisan ninjaone:sync-alerts --severity=critical

# Sync completo cada hora
0 * * * * php artisan ninjaone:sync-alerts --force

# Cleanup diario
0 2 * * * php artisan ninjaone:sync-alerts --cleanup
```

### 7. LOGGING Y MONITOREO

```bash
# Ver logs de sincronización
tail -f storage/logs/laravel.log | grep "NinjaOne"

# Verificar último sync
php artisan ninjaone:test-alerts-sync
```

## 🎯 CONFIGURACIÓN INMEDIATA

### Para configurar AHORA MISMO:

#### 1. Crear archivo batch para Windows:
```batch
@echo off
cd C:\xampp\htdocs\projects\ticketing
php artisan ninjaone:sync-alerts
```

#### 2. Configurar Task Scheduler:
- Programa: El archivo .bat que creaste
- Frecuencia: Cada 15 minutos
- Ejecutar aunque el usuario no esté logueado

#### 3. Verificar que funciona:
```bash
# Ejecutar manualmente para probar
php artisan ninjaone:sync-alerts --force
```

## 📊 FLUJO COMPLETO:

```
NinjaOne API ←→ Tu aplicación ←→ Base de datos ←→ Frontend
     ↑              ↑                ↑            ↑
  Alertas      Sync cada      Almacena       Muestra
  Eventos      15 min         alertas        en web
     ↑              ↑                ↑            ↑
  Webhook     Cron job        MySQL        React
```

## ✅ ESTADO ACTUAL:
- ✅ API integration: FUNCIONANDO
- ✅ Manual sync: FUNCIONANDO  
- ✅ Frontend display: FUNCIONANDO
- ⏳ Auto sync: PENDIENTE (necesita cron job)
- ⏳ Webhooks: OPCIONAL (para tiempo real)

¿Quieres que te ayude a configurar el cron job ahora mismo?