# 🔍 GUÍA DE DEBUGGING - Push Notifications

## 🎯 **OBJETIVO:** 
Encontrar por qué el APK no recibe notificaciones push (solo funciona en Expo Go)

---

## 📋 **COMANDOS PARA EJECUTAR EN EL SERVIDOR:**

### **1. Verificar estado actual:**
```bash
# En el servidor
php artisan push:debug
```
**Esto te dirá:**
- ¿Cuántos tokens están registrados?
- ¿Qué tipos de tokens hay (expo vs fcm)?
- ¿Están configuradas las credenciales Firebase?

### **2. Monitorear en tiempo real:**
```bash
# Ver todos los tokens
php artisan push:monitor

# Ver tokens de un tenant específico
php artisan push:monitor 288  # Reemplazar 288 con tu tenant_id
```

### **3. Ver logs detallados:**
```bash
# Ver logs en tiempo real
tail -f /var/www/laravel/storage/logs/laravel.log | grep -i "push\|fcm\|expo"

# Ver logs recientes específicos
tail -n 100 /var/www/laravel/storage/logs/laravel.log | grep "PUSH NOTIFICATION"
```

---

## 📱 **TESTING PASO A PASO:**

### **Paso 1: Verificar si tu app está registrando tokens**

1. **Abrir tu APK** (no Expo Go)
2. **Hacer login** 
3. **En el servidor ejecutar:**
   ```bash
   php artisan push:monitor
   ```
4. **¿Aparece algún token nuevo con `token_type: fcm`?**
   - ✅ **SÍ** → Tu app SÍ está registrando, problema en envío
   - ❌ **NO** → Tu app NO está registrando tokens FCM

### **Paso 2: Si NO aparecen tokens FCM**

**PROBLEMA:** Tu app móvil no está configurada correctamente para FCM

**NECESITAS VERIFICAR EN TU APP:**

1. **¿Tienes `google-services.json`?**
   ```
   adk_app_mobile/
   ├── google-services.json  ← DEBE EXISTIR
   ├── app.json
   └── ...
   ```

2. **¿Está configurado en app.json?**
   ```json
   {
     "expo": {
       "plugins": [
         "@react-native-firebase/app"
       ],
       "android": {
         "googleServicesFile": "./google-services.json"
       }
     }
   }
   ```

3. **¿Tienes las dependencias?**
   ```bash
   npm list @react-native-firebase/app
   npm list @react-native-firebase/messaging
   ```

### **Paso 3: Si SÍ aparecen tokens FCM pero no llegan notificaciones**

1. **Hacer una acción que genere notificación** (actualizar ticket)
2. **Ver logs inmediatamente:**
   ```bash
   tail -f /var/www/laravel/storage/logs/laravel.log | grep "🔔\|📊\|❌"
   ```
3. **Buscar mensajes como:**
   - `🔔 PUSH NOTIFICATION REQUEST` 
   - `📊 TOKENS FOUND FOR TENANT`
   - `❌ NO PUSH TOKENS FOUND`

---

## 🎯 **POSIBLES RESULTADOS Y SOLUCIONES:**

### **RESULTADO 1: `❌ NO PUSH TOKENS FOUND`**
**CAUSA:** Tu app no registra tokens cuando está en APK
**SOLUCIÓN:** Configurar Firebase correctamente en la app móvil

### **RESULTADO 2: `📊 TOKENS FOUND: 0 FCM, 1 Expo`**
**CAUSA:** Solo funciona en Expo Go, no en APK
**SOLUCIÓN:** App móvil necesita detectar APK y usar FCM

### **RESULTADO 3: `📊 TOKENS FOUND: 1 FCM` pero `FCM send error`**
**CAUSA:** Token FCM registrado pero Firebase tiene problemas
**SOLUCIÓN:** Verificar credenciales Firebase o token inválido

### **RESULTADO 4: Todo parece bien pero no llega**
**CAUSA:** Problema en el dispositivo o configuración FCM
**SOLUCIÓN:** Verificar permisos de notificaciones en el dispositivo

---

## 🚨 **COMANDOS DE EMERGENCIA:**

### **Forzar registro de token de prueba:**
```bash
# Simular token FCM
curl -X POST 'https://adkassist.com/api/tenant/register-push-token' \
  -H 'Authorization: Bearer TU_TOKEN_AQUI' \
  -H 'Content-Type: application/json' \
  -d '{
    "push_token": "TEST_FCM_TOKEN_12345",
    "token_type": "fcm",
    "platform": "android",
    "device_type": "phone",
    "device_name": "Test APK Device",
    "is_standalone": true
  }'
```

### **Enviar notificación de prueba:**
```bash
curl -X POST 'https://adkassist.com/api/tenant/send-push-notification' \
  -H 'Authorization: Bearer TU_TOKEN_AQUI' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Test FCM",
    "body": "Testing FCM notification",
    "data": {"test": true}
  }'
```

---

## 📋 **CHECKLIST FINAL:**

- [ ] Ejecutar `php artisan push:debug` en servidor
- [ ] Verificar si aparecen tokens FCM cuando usas APK
- [ ] Si NO aparecen tokens FCM → Configurar Firebase en app móvil
- [ ] Si SÍ aparecen tokens → Revisar logs de envío con `tail -f logs/laravel.log`
- [ ] Probar notificación manual con curl
- [ ] Verificar permisos de notificaciones en dispositivo

---

**🎯 Con estos comandos sabremos exactamente dónde está el problema: si es en la app móvil (no registra tokens FCM) o en el backend (no envía correctamente).**