# 🔍 GUÍA DE LOGS Y DEBUGGING - PUSH NOTIFICATIONS

## 🎯 **SISTEMA DE LOGS IMPLEMENTADO**

He agregado logs detallados en todo el flujo de notificaciones push para que puedas verificar exactamente qué datos se envían al móvil y identificar cualquier problema.

---

## 📊 **ESTRUCTURA DE LOGS**

### **🔔 NOTIFICATION DISPATCHER LOGS**

#### **LOG 1: Creación de Notificación en BD**
```
🔔 NOTIFICATION DISPATCHER - Creating Database Notification
- user_id: 123
- user_name: "John Smith"
- user_email: "john@example.com"
- user_roles: ["member"]
- notification_type: "ticket_status_changed"
- notification_data_keys: ["ticket_id", "ticket_code", "ticket_title", ...]
- complete_data: {todos los datos que se guardan}
```

#### **LOG 2: Notificación Guardada**
```
✅ NOTIFICATION DISPATCHER - Database Notification Created
- notification_id: "uuid-123-456"
- user_id: 123
- notification_type: "ticket_status_changed"
- will_trigger_push: "YES" (si es member) / "NO"
- stored_data: {datos exactos guardados en BD}
```

#### **LOG 3: Evento Disparado**
```
📡 NOTIFICATION DISPATCHER - Broadcasting NotificationCreated Event
- user_id: 123
- notification_id: "uuid-123-456"
- type: "ticket_status_changed"
- event_will_trigger_push_listener: true
```

### **📱 PUSH NOTIFICATION LISTENER LOGS**

#### **LOG 1: Evento Recibido**
```
📱 PUSH NOTIFICATION LISTENER - Event Received
- user_id: 123
- notification_type: "Illuminate\\Notifications\\DatabaseNotification"
- notification_id: "uuid-123-456"
```

#### **LOG 2: Usuario Validado**
```
✅ PUSH NOTIFICATION - User and Tenant Validated
- user_id: 123
- user_name: "John Smith"
- user_email: "john@example.com"
- tenant_id: 456
- tenant_name: "John Smith"
- tenant_phone: "+1234567890"
```

#### **LOG 3: Datos RAW de Notificación**
```
📋 PUSH NOTIFICATION - Raw Notification Data
- raw_notification_data: {todos los datos tal como vienen}
- data_type: "array"
- data_keys: ["ticket_id", "ticket_code", "ticket_title", ...]
```

#### **LOG 4: Mensaje Mejorado**
```
✨ PUSH NOTIFICATION - Improved Message Generated
- original_title: "Ticket Updated"
- original_message: "Your ticket #TCK-123 status changed..."
- improved_title: "🔄 Ticket Status Changed"
- improved_body: "The ticket 'AC Unit Not Working' has changed from..."
- notification_type: "ticket_status_changed"
```

#### **LOG 5: Payload Completo**
```
📤 PUSH NOTIFICATION - Complete Payload Being Sent
- tenant_id: 456
- complete_push_message: {todo el mensaje que va al móvil}
- message_structure:
  - title: "🔄 Ticket Status Changed"
  - body: "The ticket 'AC Unit Not Working'..."
  - data_keys: ["type", "screen", "entityId", ...]
  - ticket_data_available: true
  - technical_data_available: true
  - device_data_available: true
  - location_data_keys: ["client_name", "building_name", ...]
```

#### **LOG 6: Resultado del Envío**
```
📬 PUSH NOTIFICATION - Send Result
- tenant_id: 456
- user_id: 123
- title: "🔄 Ticket Status Changed"
- body: "The ticket 'AC Unit Not Working'..."
- push_service_result: {respuesta completa del servicio}
- success: true
- sent_to_devices: 2
- error_message: null
```

#### **LOG 7: Resumen Final**
```
✅ PUSH NOTIFICATION - Successfully Sent
- notification_type: "ticket_status_changed"
- entity_type: "ticket"
- entity_id: 123
- devices_reached: 2
```

---

## 🧪 **CÓMO PROBAR Y VER LOS LOGS**

### **1. Comando de Prueba**
```bash
# Test cambio de estado
php artisan push:test-logs --type=status_change

# Test asignación
php artisan push:test-logs --type=assignment  

# Test ticket creado
php artisan push:test-logs --type=created
```

### **2. Ver Logs en Tiempo Real**
```bash
# En terminal separada, ejecutar:
tail -f storage/logs/laravel.log | grep "PUSH NOTIFICATION\|NOTIFICATION DISPATCHER"
```

### **3. Filtrar Logs por Tipo**
```bash
# Solo logs de push notifications
grep "PUSH NOTIFICATION" storage/logs/laravel.log

# Solo logs del dispatcher
grep "NOTIFICATION DISPATCHER" storage/logs/laravel.log

# Logs de un usuario específico
grep "user_id.*123" storage/logs/laravel.log
```

---

## 🔍 **QUÉ VERIFICAR EN LOS LOGS**

### **✅ FLUJO NORMAL:**

1. **Dispatcher crea notificación** 🔔
   - ✅ `Creating Database Notification` con datos completos
   - ✅ `Database Notification Created` con success
   - ✅ `Broadcasting NotificationCreated Event`

2. **Listener recibe evento** 📱
   - ✅ `Event Received` 
   - ✅ `User and Tenant Validated`
   - ✅ `Raw Notification Data` (verificar que tenga todos los campos)

3. **Mensaje mejorado** ✨
   - ✅ `Improved Message Generated` con títulos descriptivos
   - ✅ Verificar que use datos reales (marca, modelo, nombre técnico, etc.)

4. **Payload enviado** 📤
   - ✅ `Complete Payload Being Sent` 
   - ✅ Verificar estructura: `ticket_data`, `technical_data`, `device_data`, etc.
   - ✅ Comprobar que `*_data_available` sea `true` cuando corresponda

5. **Envío exitoso** 📬
   - ✅ `Send Result` con `success: true`
   - ✅ `sent_to_devices > 0`
   - ✅ `Successfully Sent`

### **❌ PROBLEMAS COMUNES:**

#### **Usuario no válido:**
```
⏭️ PUSH NOTIFICATION - User is not a member
- user_roles: ["admin", "technical"]  // ❌ No es "member"
```

#### **Sin tenant:**
```
❌ Push notification skipped: Tenant not found
- user_id: 123
```

#### **Datos faltantes:**
```
📋 PUSH NOTIFICATION - Raw Notification Data
- raw_notification_data: {"type": "ticket_status_changed"}  // ❌ Faltan campos
- data_keys: ["type"]  // ❌ Muy pocos campos
```

#### **Envío fallido:**
```
⚠️ PUSH NOTIFICATION - Send Failed
- error: "No push tokens found"
- devices_attempted: 0
```

---

## 🔧 **EJEMPLO DE LOG COMPLETO EXITOSO**

```
[2025-09-27 10:30:01] 🔔 NOTIFICATION DISPATCHER - Creating Database Notification
{
  "user_id": 123,
  "user_name": "John Smith", 
  "notification_type": "ticket_status_changed",
  "complete_data": {
    "ticket_id": 456,
    "ticket_code": "TCK-00456",
    "ticket_title": "AC Unit Not Working",
    "device_name": "Main AC Unit",
    "device_brand": "Samsung",
    "technical_name": "Carlos Rodriguez",
    "building_name": "Tower A"
  }
}

[2025-09-27 10:30:01] 📱 PUSH NOTIFICATION LISTENER - Event Received
{"user_id": 123, "notification_id": "uuid-789"}

[2025-09-27 10:30:01] ✨ PUSH NOTIFICATION - Improved Message Generated
{
  "improved_title": "🔄 Ticket Status Changed",
  "improved_body": "The ticket 'AC Unit Not Working' has changed from Open to In Progress - Device: Samsung Main AC Unit - Assigned to: Carlos Rodriguez - Location: Apt 301, Tower A"
}

[2025-09-27 10:30:02] 📤 PUSH NOTIFICATION - Complete Payload Being Sent
{
  "complete_push_message": {
    "title": "🔄 Ticket Status Changed",
    "body": "The ticket 'AC Unit Not Working' has changed...",
    "data": {
      "type": "ticket",
      "ticket_data": {"id": 456, "title": "AC Unit Not Working"},
      "technical_data": {"name": "Carlos Rodriguez", "phone": "+1987654321"},
      "device_data": {"brand": "Samsung", "model": "Split AC"}
    }
  }
}

[2025-09-27 10:30:02] ✅ PUSH NOTIFICATION - Successfully Sent
{"devices_reached": 2, "notification_type": "ticket_status_changed"}
```

---

## 📱 **VERIFICAR EN EL MÓVIL**

Con estos logs puedes:

1. **Confirmar estructura exacta** que recibe el móvil
2. **Verificar campos disponibles** en cada notificación
3. **Identificar datos faltantes** o incorrectos
4. **Validar mensajes descriptivos** vs genéricos
5. **Confirmar envío exitoso** a dispositivos

**¡Ahora tienes visibilidad completa del flujo de notificaciones!** 🎉