# NinjaOne Alerts Synchronization

Este documento explica cómo resolver el problema de sincronización de alertas entre NinjaOne y el sistema local.

## Problema Identificado

El problema que mencionas ("arriba en el ninja hay un dispositivo que requiere atención y acá en alerts no me dice") se debe a que aunque el sistema tiene todas las funciones necesarias para obtener alertas desde la API de NinjaOne (`NinjaOneService.php`), falta el proceso automatizado que sincronice estas alertas con la base de datos local.

## Solución Implementada

Se han creado dos comandos de Artisan para resolver este problema:

### 1. Comando de Sincronización: `SyncNinjaOneAlerts`

**Ubicación:** `app/Console/Commands/SyncNinjaOneAlerts.php`

**Funcionalidades:**
- Sincroniza alertas desde la API de NinjaOne hacia la base de datos local
- Actualiza el estado de alertas existentes
- Crea nuevas alertas que no existen localmente
- Normaliza los niveles de severidad y estados
- Limpia alertas resueltas antiguas (opcional)
- Maneja errores y logs detallados

**Uso:**

```bash
# Sincronizar todas las alertas de todos los dispositivos
php artisan ninjaone:sync-alerts

# Sincronizar alertas de un dispositivo específico
php artisan ninjaone:sync-alerts --device=123

# Forzar sincronización (ignora el tiempo desde la última sincronización)
php artisan ninjaone:sync-alerts --force

# Limpiar alertas resueltas de más de 30 días
php artisan ninjaone:sync-alerts --cleanup

# Combinar opciones
php artisan ninjaone:sync-alerts --device=123 --force --cleanup
```

### 2. Comando de Prueba: `TestNinjaOneAlertsSync`

**Ubicación:** `app/Console/Commands/TestNinjaOneAlertsSync.php`

**Funcionalidades:**
- Prueba la conectividad con la API de NinjaOne
- Verifica que se pueden obtener alertas de dispositivos
- Prueba operaciones de base de datos
- Muestra estadísticas de alertas actuales
- Crear, actualizar y eliminar alertas de prueba

**Uso:**

```bash
# Ejecutar todas las pruebas
php artisan ninjaone:test-alerts-sync

# Probar con un dispositivo específico
php artisan ninjaone:test-alerts-sync --device=123

# Limitar el número de dispositivos a probar
php artisan ninjaone:test-alerts-sync --limit=3
```

## Pasos para Resolver el Problema

### Paso 1: Verificar que el Sistema Funciona
```bash
php artisan ninjaone:test-alerts-sync
```

Este comando verificará:
- ✅ Conectividad con la API de NinjaOne
- ✅ Capacidad de obtener alertas de dispositivos
- ✅ Operaciones de base de datos funcionando
- ✅ Estadísticas actuales de alertas

### Paso 2: Sincronizar Alertas por Primera Vez
```bash
php artisan ninjaone:sync-alerts --force
```

Este comando:
- 🔄 Obtendrá todas las alertas de todos los dispositivos
- 💾 Las guardará en la base de datos local
- 📊 Mostrará un resumen de las alertas sincronizadas

### Paso 3: Verificar Resultados
Después de la sincronización, ve a la sección de alertas en tu aplicación y deberías ver las alertas que están en NinjaOne.

### Paso 4: Automatizar la Sincronización (Recomendado)
Para que las alertas se mantengan actualizadas automáticamente, agrega la siguiente línea al crontab del servidor:

```bash
# Sincronizar alertas cada 5 minutos
*/5 * * * * cd /path/to/your/project && php artisan ninjaone:sync-alerts

# O cada 15 minutos para reducir carga
*/15 * * * * cd /path/to/your/project && php artisan ninjaone:sync-alerts
```

### Paso 5: Limpieza Periódica (Opcional)
Para limpiar alertas antiguas resueltas, ejecuta semanalmente:

```bash
# Limpiar alertas resueltas de más de 30 días (ejecutar semanalmente)
0 2 * * 0 cd /path/to/your/project && php artisan ninjaone:sync-alerts --cleanup
```

## Estructura de Datos

### Tabla: `ninja_one_alerts`

Las alertas sincronizadas incluyen:
- `ninjaone_alert_id`: ID único de NinjaOne
- `device_id`: ID del dispositivo local
- `ninjaone_device_id`: ID del dispositivo en NinjaOne
- `title`: Título de la alerta
- `description`: Descripción detallada
- `severity`: Nivel de severidad (critical, warning, info)
- `status`: Estado (open, acknowledged, resolved)
- `alert_type`: Tipo de alerta (system, hardware, network, etc.)
- `raw_data`: Datos completos de la API
- `acknowledged_at`: Fecha de reconocimiento
- `resolved_at`: Fecha de resolución
- `created_at`: Fecha de creación

## Mapeo de Severidad

El sistema normaliza automáticamente los niveles de severidad:

| NinjaOne | Sistema Local |
|----------|---------------|
| critical, high, error | critical |
| warning, medium, warn | warning |
| info, information, low | info |

## Mapeo de Estados

| NinjaOne | Sistema Local |
|----------|---------------|
| acknowledged, ack | acknowledged |
| resolved, closed, fixed | resolved |
| open, active, new | open |

## Troubleshooting

### Problema: "No se sincronizan alertas"
**Solución:**
```bash
# Verificar conectividad
php artisan ninjaone:test-alerts-sync

# Revisar logs
tail -f storage/logs/laravel.log

# Forzar sincronización
php artisan ninjaone:sync-alerts --force
```

### Problema: "Error de API"
**Solución:**
1. Verificar credenciales de NinjaOne en `.env`
2. Verificar que la URL de API es correcta
3. Verificar que el token de acceso no ha expirado

### Problema: "Alertas duplicadas"
**Solución:**
Las alertas se identifican por `ninjaone_alert_id`, por lo que no deberían duplicarse. Si ocurre:
```bash
# Limpiar duplicados (cuidado con este comando)
php artisan tinker
>>> App\Models\NinjaOneAlert::select('ninjaone_alert_id')->groupBy('ninjaone_alert_id')->havingRaw('count(*) > 1')->get();
```

## Logs y Monitoreo

Todos los comandos generan logs detallados en:
- `storage/logs/laravel.log`

Los logs incluyen:
- ✅ Alertas sincronizadas exitosamente
- ⚠️ Errores de API o base de datos
- 📊 Estadísticas de sincronización
- 🔄 Cambios de estado de alertas

## Rendimiento

Para optimizar el rendimiento:
- Ejecuta la sincronización cada 5-15 minutos en lugar de cada minuto
- Usa `--device=ID` para sincronizar dispositivos específicos
- Usa `--cleanup` semanalmente para mantener la base de datos limpia
- Monitorea los logs para identificar dispositivos problemáticos

## Ejemplo de Flujo Completo

```bash
# 1. Probar el sistema
php artisan ninjaone:test-alerts-sync

# 2. Sincronización inicial
php artisan ninjaone:sync-alerts --force

# 3. Verificar resultados en la interfaz web

# 4. Configurar cron para automatización
echo "*/10 * * * * cd $(pwd) && php artisan ninjaone:sync-alerts" | crontab -

# 5. Monitorear logs
tail -f storage/logs/laravel.log | grep -i "ninjaone"
```

¡Con estos comandos, el problema de sincronización de alertas entre NinjaOne y tu sistema local debería estar resuelto!