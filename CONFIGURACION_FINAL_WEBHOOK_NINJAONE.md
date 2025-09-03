# 🚀 CONFIGURACIÓN FINAL - NINJAONE WEBHOOKS EN TIEMPO REAL

## ✅ ESTADO ACTUAL
- ✅ Webhook URL funcionando: https://adkassist.com/api/ninjaone/webhook
- ✅ Controlador procesando correctamente
- ✅ Base de datos preparada para recibir alertas
- ✅ Frontend mostrando alertas

## 🔧 CONFIGURACIÓN EN NINJAONE DASHBOARD

### 1. ACCEDER A CONFIGURACIÓN DE WEBHOOKS
```
1. Ir a tu NinjaOne Dashboard
2. Administration → Integrations → Webhooks
   (o buscar "Webhooks" en configuración)
3. Click "Add Webhook" o "Create New Webhook"
```

### 2. CONFIGURACIÓN DEL WEBHOOK
```
📋 CONFIGURACIÓN EXACTA:

Name: Sistema de Tickets - Alertas en Tiempo Real
URL: https://adkassist.com/api/ninjaone/webhook
Method: POST
Content Type: application/json
Active: ✅ Enabled
```

### 3. EVENTOS A CONFIGURAR
```
✅ CRÍTICOS (Obligatorios):
- Alert Created
- Alert Updated
- Alert Resolved
- Device Alert Created
- Device Alert Updated

✅ OPCIONALES (Recomendados):
- Device Status Changed
- Device Offline
- Device Online
- Device Health Check Failed
- Condition Alert Created
- Condition Alert Updated
```

### 4. CONFIGURACIÓN DE SEGURIDAD
```
Authentication: None
Secret Token: (dejar vacío por ahora)
Retry Attempts: 3
Timeout: 30 seconds
```

### 5. FILTROS (Opcional)
```
Device Groups: Todos (o específicos si quieres filtrar)
Organization: Tu organización
Alert Types: Todos
```

## 🧪 PRUEBA EN TIEMPO REAL

### Después de configurar el webhook:

1. **Generar una alerta de prueba en NinjaOne:**
   - Ir a un dispositivo
   - Crear una alerta manual
   - O simular un problema (desconectar red por un momento)

2. **Verificar recepción instantánea:**
   ```bash
   # Ver logs en tiempo real:
   tail -f storage/logs/laravel.log | grep WEBHOOK
   
   # O en Windows:
   Get-Content storage\logs\laravel.log -Wait | Select-String "WEBHOOK"
   ```

3. **Verificar en tu web:**
   - Ir a: https://adkassist.com/ninjaone-alerts
   - La nueva alerta debería aparecer INMEDIATAMENTE

## 📊 MONITOREO DEL WEBHOOK

### Script de monitoreo continuo:
```bash
# Crear archivo: monitor_webhooks.bat
@echo off
:loop
echo [%date% %time%] Checking webhook logs...
powershell "Get-Content storage\logs\laravel.log -Tail 20 | Select-String 'WEBHOOK'"
timeout /t 10
goto loop
```

### Dashboard de estado:
```bash
# Ver últimas alertas:
php artisan tinker --execute="
\$alerts = App\Models\NinjaOneAlert::orderBy('created_at', 'desc')->limit(5)->get();
foreach(\$alerts as \$alert) {
    echo \$alert->created_at . ' - ' . \$alert->title . PHP_EOL;
}
"
```

## 🎯 VALIDACIÓN FINAL

### Checklist de configuración:
- [ ] Webhook URL configurada en NinjaOne: https://adkassist.com/api/ninjaone/webhook
- [ ] Eventos seleccionados (mínimo: Alert Created)
- [ ] Webhook activado (Enabled)
- [ ] Prueba manual realizada
- [ ] Alerta aparece en tiempo real en web
- [ ] Logs confirman recepción de webhook

### Comandos de verificación:
```bash
# 1. Probar webhook manualmente:
curl -X POST https://adkassist.com/api/ninjaone/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"alert.created","device_name":"TEST","data":{"alert":{"id":"manual-test","title":"Test Manual"}}}'

# 2. Ver últimas alertas:
php artisan tinker --execute="echo App\Models\NinjaOneAlert::count() . ' total alerts'"

# 3. Monitorear logs:
tail -f storage/logs/laravel.log
```

## 🚀 PRÓXIMOS PASOS

1. **Configurar en NinjaOne Dashboard** (5 minutos)
2. **Hacer prueba real** generando alerta
3. **Verificar tiempo real** en tu web
4. **Configurar notificaciones** adicionales (email/SMS)
5. **Documentar para el equipo**

---

**¡Tu sistema estará 100% en tiempo real después de esta configuración!**

Cuando generes una alerta en NinjaOne → Aparecerá INSTANTÁNEAMENTE en tu web.