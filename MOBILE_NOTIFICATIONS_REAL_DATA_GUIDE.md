# 📱 NOTIFICACIONES MÓVILES - DATOS REALES DE LOS MODELOS - Documentación Final

## 🎯 **SISTEMA ACTUALIZADO CON DATOS REALES**

He revisado todos los modelos en la carpeta `Models` y he actualizado el sistema de notificaciones para usar **SOLO los campos que realmente existen** en los modelos de Laravel.

---

## 🗺️ **RELACIONES REALES DE LOS MODELOS**

### **📋 TICKET MODEL**
```php
// Campos reales:
'user_id', 'device_id', 'category', 'title', 'description', 'status', 'priority', 'code', 'technical_id'

// Relaciones reales:
ticket->user (User)
ticket->device (Device) 
ticket->technical (Technical)
```

### **🔧 DEVICE MODEL**
```php
// Campos reales:
'name', 'brand_id', 'system_id', 'model_id', 'name_device_id', 'status', 'ubicacion'

// Relaciones reales:
device->brand (Brand)
device->system (System)
device->model (DeviceModel)
device->name_device (NameDevice)
device->tenants (Tenant) - many-to-many
```

### **👨‍🔧 TECHNICAL MODEL**
```php
// Campos reales:
'name', 'email', 'photo', 'phone', 'shift', 'status', 'visible', 'is_default', 'instructions'

// Relaciones reales:
technical->user (User basado en email)
technical->tickets (Ticket)
technical->devices (Device)
```

### **🏠 USER → TENANT → APARTMENT → BUILDING**
```php
// User campos reales:
'name', 'email', 'first_name', 'last_name' (NO tiene phone por defecto)

// Tenant campos reales:
'apartment_id', 'name', 'email', 'photo', 'phone', 'status'

// Apartment campos reales: 
'name', 'ubicacion', 'buildings_id', 'status'

// Building campos reales:
'name', 'managing_company', 'address', 'description', 'status'
```

### **📅 APPOINTMENT MODEL**
```php
// Campos reales:
'ticket_id', 'technical_id', 'scheduled_by', 'title', 'description', 'address', 'scheduled_for', 'estimated_duration', 'status'

// Relaciones reales:
appointment->ticket (Ticket)
appointment->technical (Technical)
appointment->scheduledBy (User)
```

---

## 📱 **EJEMPLOS DE NOTIFICACIONES CON DATOS REALES**

### **🔄 Cambio de Estado de Ticket**
```javascript
{
  "title": "🔄 Ticket Status Changed",  
  "body": "The ticket 'AC Unit Not Working' has changed from Open to In Progress - Device: Samsung Main AC Unit (Split Model) - Assigned to: Carlos Rodriguez - Location: Apt 301, Tower A",
  "data": {
    "type": "ticket",
    "screen": "/tickets",
    "entityId": "123",
    // DATOS REALES DEL TICKET
    "ticket_data": {
      "id": 123,
      "code": "TCK-00123",
      "title": "AC Unit Not Working",
      "category": "HVAC", 
      "description": "AC unit not cooling properly",
      "status": "in_progress",
      "priority": "medium"
    },
    // DATOS REALES DEL TECHNICAL
    "technical_data": {
      "id": 789,
      "name": "Carlos Rodriguez",
      "phone": "+1987654321",
      "email": "carlos@company.com", 
      "shift": "morning"
    },
    // DATOS REALES DEL DEVICE
    "device_data": {
      "id": 456,
      "name": "Main AC Unit",
      "brand": "Samsung", // device->brand->name
      "model": "Split AC", // device->model->name  
      "ubicacion": "Living Room"
    },
    // DATOS REALES DE UBICACIÓN
    "location_data": {
      "client_name": "John Smith", // tenant->name
      "client_phone": "+1234567890", // tenant->phone
      "client_email": "john@email.com", // user->email
      "tenant_name": "John Smith", // tenant->name
      "tenant_phone": "+1234567890", // tenant->phone
      "apartment_name": "Apt 301", // apartment->name
      "apartment_ubicacion": "3rd Floor", // apartment->ubicacion
      "building_name": "Tower A", // building->name
      "building_address": "123 Main Street" // building->address
    }
  }
}
```

### **👨‍🔧 Asignación de Ticket**
```javascript
{
  "title": "👨‍🔧 Ticket Assigned",
  "body": "The ticket 'AC Unit Not Working' has been assigned to Carlos Rodriguez (Phone: +1987654321) - Device: Samsung Main AC Unit (Split AC) at Apt 301, Tower A",
  "data": {
    "type": "ticket",
    "screen": "/tickets",
    "entityId": "123",
    "ticket_data": {
      "id": 123,
      "code": "TCK-00123", 
      "title": "AC Unit Not Working",
      "category": "HVAC",
      "status": "assigned",
      "priority": "high"
    },
    "technical_data": {
      "id": 789,
      "name": "Carlos Rodriguez",
      "phone": "+1987654321", // technical->phone (campo real)
      "email": "carlos@company.com", // technical->email (campo real)
      "shift": "morning" // technical->shift (campo real)
    },
    "device_data": {
      "id": 456,
      "name": "Main AC Unit", // name_device->name
      "brand": "Samsung", // brand->name
      "model": "Split AC", // model->name
      "ubicacion": "Living Room" // device->ubicacion
    }
  }
}
```

### **❌ Desasignación de Técnico**
```javascript
{
  "title": "❌ Technician Unassigned",
  "body": "The technician Carlos Rodriguez has been unassigned from ticket 'AC Unit Not Working' - Device: Samsung Main AC Unit (Split AC)",
  "data": {
    "type": "ticket",
    "screen": "/tickets", 
    "entityId": "123"
  }
}
```

### **🎫 Ticket Creado**
```javascript
{
  "title": "🎫 New Ticket Created", 
  "body": "New ticket 'AC Unit Not Working' has been created by John Smith - Device: Samsung Main AC Unit (Split AC) at Apt 301, Tower A",
  "data": {
    "type": "ticket",
    "screen": "/tickets",
    "entityId": "123",
    "device_data": {
      "name": "Main AC Unit", // name_device->name (relación real)
      "brand": "Samsung", // device->brand->name (relación real)
      "model": "Split AC", // device->model->name (relación real) 
      "ubicacion": "Living Room" // device->ubicacion (campo real)
    },
    "location_data": {
      "tenant_name": "John Smith", // tenant->name (campo real)
      "apartment_name": "Apt 301", // apartment->name (campo real)
      "building_name": "Tower A" // building->name (campo real)
    }
  }
}
```

### **📅 Cita Creada**
```javascript
{
  "title": "📅 New Appointment Created",
  "body": "A new appointment 'AC Repair Visit' has been created for Sep 27, 2025 at 2:00 PM with Carlos Rodriguez at 123 Main Street, Apt 301",
  "data": {
    "type": "appointment",
    "screen": "/appointments",
    "entityId": "456",
    "appointment_data": {
      "id": 456,
      "title": "AC Repair Visit", // appointment->title (campo real)
      "description": "Fix AC cooling issue", // appointment->description (campo real)
      "address": "123 Main Street, Apt 301", // appointment->address (campo real)
      "scheduled_for": "2025-09-27T14:00:00Z", // appointment->scheduled_for (campo real)
      "status": "scheduled", // appointment->status (campo real)
      "estimated_duration": 120 // appointment->estimated_duration (campo real)
    }
  }
}
```

### **⏰ Recordatorio de Cita**
```javascript
{
  "title": "⏰ Appointment Reminder",
  "body": "Your appointment 'AC Repair Visit' starts in 30 minutes at 123 Main Street, Apt 301 with Carlos Rodriguez",
  "data": {
    "type": "appointment",
    "screen": "/appointments",
    "entityId": "456"
  }
}
```

---

## 🔧 **CAMBIOS REALIZADOS**

### **✅ NotificationDispatcherService.php**
- **Removidos campos inventados**: `device_serial`, `device_model` (como string directo), `technical_speciality`
- **Agregados campos reales**: `device->brand->name`, `device->model->name`, `device->ubicacion`, `technical->shift`, `technical->phone`, `technical->email`
- **Relaciones correctas**: `user->tenant->apartment->building` (usando las relaciones reales)

### **✅ SendPushNotificationListener.php**
- **Mensajes más descriptivos** usando campos reales de los modelos
- **Información del device**: Marca, modelo y ubicación reales
- **Datos del técnico**: Nombre, teléfono, turno (campos que realmente existen)
- **Ubicación completa**: Apartamento y edificio con nombres reales

### **✅ Ejemplos de Mensajes Mejorados**

**Antes (con datos inventados):**
> "🔄 Ticket Updated - 'AC Problem' is now In Progress"

**Después (con datos reales):**
> "🔄 Ticket Status Changed - The ticket 'AC Unit Not Working' has changed from Open to In Progress - Device: Samsung Main AC Unit (Split AC) - Assigned to: Carlos Rodriguez - Location: Apt 301, Tower A"

---

## 🚀 **PARA EL EQUIPO MÓVIL**

### **Campos Garantizados (Siempre Disponibles):**
- `ticket_data.code` - Código del ticket (generado automáticamente)
- `ticket_data.title` - Título del ticket
- `device_data.name` - Nombre del dispositivo (desde NameDevice)
- `technical_data.name` - Nombre del técnico
- `location_data.tenant_name` - Nombre del tenant

### **Campos Opcionales (Pueden ser null):**
- `device_data.brand` - Marca del dispositivo
- `device_data.model` - Modelo del dispositivo  
- `technical_data.phone` - Teléfono del técnico
- `location_data.apartment_name` - Nombre del apartamento
- `location_data.building_name` - Nombre del edificio

### **Campos que NO Existen (Removidos):**
- ❌ `device_data.serial` - No existe en el modelo Device
- ❌ `technical_data.speciality` - No existe en el modelo Technical
- ❌ `user.phone` - No es un campo por defecto en User

---

## 📞 **RELACIONES DE DATOS REALES**

```
Ticket
  ├── user (User)
  │   └── tenant (Tenant)
  │       └── apartment (Apartment)
  │           └── building (Building)
  ├── device (Device)
  │   ├── name_device (NameDevice)
  │   ├── brand (Brand)
  │   └── model (DeviceModel)
  └── technical (Technical)

Appointment
  ├── ticket (Ticket)
  ├── technical (Technical)
  └── scheduledBy (User)
```

---

**🎉 ¡Ahora el sistema usa únicamente datos reales de los modelos de Laravel! No más campos inventados o relaciones que no existen.**

**Los mensajes de push notification serán precisos, informativos y basados en la estructura real de la base de datos.**