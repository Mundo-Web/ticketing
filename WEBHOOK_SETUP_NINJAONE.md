# 🚀 CONFIGURACIÓN WEBHOOK NINJAONE EN TIEMPO REAL

## 📋 CONFIGURACIÓN COMPLETA PASO A PASO

### 1. PREPARAR URL PÚBLICA (DESARROLLO)

#### Opción A: ngrok (Recomendado para desarrollo)
```bash
# Instalar ngrok desde: https://ngrok.com/
# Después ejecutar:
ngrok http 80
# Te dará una URL como: https://abc123.ngrok.io

# Tu webhook URL será:
# https://abc123.ngrok.io/projects/ticketing/public/api/ninjaone/webhook
```

#### Opción B: Para producción
```bash
# Tu URL de producción será:
# https://tu-dominio.com/api/ninjaone/webhook
```

### 2. CONFIGURAR EN NINJAONE DASHBOARD

1. **Ir a NinjaOne Dashboard**
   - Administration → Integrations → Webhooks
   - O buscar "Webhooks" en configuración

2. **Crear Nuevo Webhook**
   ```
   Name: Sistema de Tickets - Alertas
   URL: https://tu-url.ngrok.io/projects/ticketing/public/api/ninjaone/webhook
   Method: POST
   Content Type: application/json
   ```

3. **Eventos a Escuchar**
   ✅ Alert Created
   ✅ Alert Updated  
   ✅ Alert Resolved
   ✅ Device Status Changed
   ✅ Device Offline
   ✅ Device Online
   ✅ Health Check Failed

4. **Configuración de Seguridad**
   ```
   Authentication: None (manejado en el código)
   Secret Token: (opcional - tu webhook ya maneja validación)
   Retry: 3 attempts
   Timeout: 30 seconds
   ```

### 3. PROBAR EL WEBHOOK

#### Prueba Manual:
```bash
# Desde terminal en tu proyecto:
curl -X POST https://tu-url.ngrok.io/projects/ticketing/public/api/ninjaone/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "alert.created",
    "device_name": "DAMIANPC",
    "data": {
      "alert": {
        "id": "test-webhook-alert",
        "type": "system",
        "severity": "critical", 
        "title": "WEBHOOK TEST - Disco lleno",
        "description": "Prueba de webhook en tiempo real desde NinjaOne"
      }
    }
  }'
```

#### Verificar logs:
```bash
# Ver si llegó el webhook:
tail -f storage/logs/laravel.log | grep WEBHOOK
```

### 4. CONFIGURACIÓN PARA DESARROLLO LOCAL

#### Archivo .env:
```env
# Agregar estas variables:
NINJAONE_WEBHOOK_ENABLED=true
NINJAONE_WEBHOOK_SECRET=tu_secreto_aqui
LOG_LEVEL=debug
```

### 5. SCRIPT DE CONFIGURACIÓN AUTOMÁTICA