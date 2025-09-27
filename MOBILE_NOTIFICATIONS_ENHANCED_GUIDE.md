# 📱 NOTIFICACIONES MÓVILES MEJORADAS - Documentación para Equipo Móvil

## 🎯 **NUEVA ESTRUCTURA IMPLEMENTADA**

El sistema de notificaciones push ha sido completamente mejorado para proporcionar mensajes más descriptivos e información completa. Ahora todas las notificaciones incluyen:

- ✅ **Mensajes descriptivos** con títulos de tickets en lugar de códigos
- ✅ **Estados legibles** ("In Progress" en lugar de "in_progress")  
- ✅ **Información completa del técnico** (nombre, teléfono, especialidad)
- ✅ **Datos del dispositivo** (nombre, modelo, serie, ubicación)
- ✅ **Información del cliente** (nombre, teléfono, apartamento)
- ✅ **Datos de ubicación** (edificio, apartamento)

---

## 📋 **TIPOS DE NOTIFICACIONES IMPLEMENTADAS**

### **🎫 NOTIFICACIONES DE TICKETS**

#### **1. Ticket Created (`ticket_created`)**
```javascript
{
  "title": "🎫 New Ticket Created",  
  "body": "New ticket 'AC Unit Not Working' has been created for device: Main AC Unit",
  "data": {
    "type": "ticket",
    "screen": "/tickets",
    "entityId": "123",
    "ticket_data": {
      "id": 123,
      "code": "TICK-2025-001",
      "title": "AC Unit Not Working", 
      "status": "open",
      "priority": "medium"
    },
    "device_data": {
      "id": 456,
      "name": "Main AC Unit",
      "serial": "AC-12345",
      "model": "Samsung Split AC",
      "location": "Apt 301"
    },
    "location_data": {
      "client_name": "John Smith",
      "client_phone": "+1234567890",
      "building_name": "Tower A",
      "apartment_name": "Apt 301"
    }
  }
}
```

#### **2. Ticket Assigned (`ticket_assigned`)**
```javascript
{
  "title": "👨‍🔧 Ticket Assigned",
  "body": "The ticket 'AC Unit Not Working' has been assigned to Carlos Rodriguez (Device: Main AC Unit)",
  "data": {
    "type": "ticket", 
    "screen": "/tickets",
    "entityId": "123",
    "ticket_data": {
      "id": 123,
      "code": "TICK-2025-001",
      "title": "AC Unit Not Working",
      "status": "assigned", 
      "priority": "high"
    },
    "technical_data": {
      "id": 789,
      "name": "Carlos Rodriguez",
      "phone": "+1987654321",
      "speciality": "HVAC Technician",
      "email": "carlos@company.com"
    },
    "device_data": {
      "id": 456,
      "name": "Main AC Unit",
      "serial": "AC-12345", 
      "model": "Samsung Split AC",
      "location": "Apt 301"
    },
    "location_data": {
      "client_name": "John Smith",
      "client_phone": "+1234567890", 
      "building_name": "Tower A",
      "apartment_name": "Apt 301"
    }
  }
}
```

#### **3. Ticket Status Changed (`ticket_status_changed`)**
```javascript
{
  "title": "🔄 Ticket Status Changed",
  "body": "The ticket 'AC Unit Not Working' has changed from Open to In Progress (Device: Main AC Unit) - Assigned to: Carlos Rodriguez",
  "data": {
    "type": "ticket",
    "screen": "/tickets", 
    "entityId": "123",
    "ticket_data": {
      "id": 123,
      "code": "TICK-2025-001",
      "title": "AC Unit Not Working",
      "status": "in_progress",
      "priority": "medium"
    },
    "technical_data": {
      "id": 789,
      "name": "Carlos Rodriguez", 
      "phone": "+1987654321",
      "speciality": "HVAC Technician",
      "email": "carlos@company.com"
    },
    "device_data": {
      "id": 456,
      "name": "Main AC Unit",
      "serial": "AC-12345",
      "model": "Samsung Split AC",
      "location": "Apt 301"
    }
  }
}
```

#### **4. Ticket Unassigned (`ticket_unassigned`)** 🆕
```javascript
{
  "title": "❌ Technician Unassigned", 
  "body": "The technician has been unassigned from ticket 'AC Unit Not Working' (Device: Main AC Unit)",
  "data": {
    "type": "ticket",
    "screen": "/tickets",
    "entityId": "123",
    "ticket_data": {
      "id": 123,
      "code": "TICK-2025-001", 
      "title": "AC Unit Not Working",
      "status": "open",
      "priority": "medium"
    },
    "device_data": {
      "id": 456,
      "name": "Main AC Unit",
      "serial": "AC-12345",
      "model": "Samsung Split AC",
      "location": "Apt 301"
    }
  }
}
```

---

### **📅 NOTIFICACIONES DE CITAS**

#### **1. Appointment Created (`appointment_created`)** 🆕
```javascript
{
  "title": "📅 New Appointment Created",
  "body": "A new appointment 'AC Repair Visit' has been created for Sep 27, 2025 at 2:00 PM with Carlos Rodriguez",
  "data": {
    "type": "appointment",
    "screen": "/appointments", 
    "entityId": "456",
    "appointment_data": {
      "id": 456,
      "title": "AC Repair Visit",
      "address": "123 Main St, Apt 301",
      "scheduled_for": "2025-09-27T14:00:00Z",
      "status": "scheduled",
      "duration": 120
    },
    "technical_data": {
      "id": 789,
      "name": "Carlos Rodriguez",
      "phone": "+1987654321",
      "speciality": "HVAC Technician"
    },
    "ticket_data": {
      "id": 123, 
      "code": "TICK-2025-001",
      "title": "AC Unit Not Working"
    }
  }
}
```

#### **2. Appointment Rescheduled (`appointment_rescheduled`)**
```javascript
{
  "title": "🔄 Appointment Rescheduled",
  "body": "The appointment 'AC Repair Visit' has been rescheduled from Sep 27, 2025 at 2:00 PM to Sep 28, 2025 at 10:00 AM",
  "data": {
    "type": "appointment",
    "screen": "/appointments",
    "entityId": "456",
    "appointment_data": {
      "id": 456,
      "title": "AC Repair Visit", 
      "address": "123 Main St, Apt 301",
      "scheduled_for": "2025-09-28T10:00:00Z",
      "status": "rescheduled",
      "duration": 120
    }
  }
}
```

#### **3. Appointment Reminder (`appointment_reminder`)**
```javascript
{
  "title": "⏰ Appointment Reminder",
  "body": "Your appointment 'AC Repair Visit' starts in 30 minutes at 123 Main St, Apt 301", 
  "data": {
    "type": "appointment",
    "screen": "/appointments",
    "entityId": "456",
    "appointment_data": {
      "id": 456,
      "title": "AC Repair Visit",
      "address": "123 Main St, Apt 301",
      "scheduled_for": "2025-09-27T14:00:00Z",
      "status": "scheduled",
      "duration": 120
    }
  }
}
```

#### **4. Appointment Started (`appointment_started`)** 🆕
```javascript
{
  "title": "🚀 Appointment Started",
  "body": "The appointment 'AC Repair Visit' has started with Carlos Rodriguez",
  "data": {
    "type": "appointment",
    "screen": "/appointments",
    "entityId": "456"
  }
}
```

#### **5. Appointment Completed (`appointment_completed`)** 🆕
```javascript
{
  "title": "✅ Appointment Completed",
  "body": "The appointment 'AC Repair Visit' has been completed by Carlos Rodriguez",
  "data": {
    "type": "appointment", 
    "screen": "/appointments",
    "entityId": "456"
  }
}
```

#### **6. Appointment Cancelled (`appointment_cancelled`)** 🆕
```javascript
{
  "title": "❌ Appointment Cancelled",
  "body": "The appointment 'AC Repair Visit' has been cancelled (was scheduled for Sep 27, 2025 at 2:00 PM)",
  "data": {
    "type": "appointment",
    "screen": "/appointments", 
    "entityId": "456"
  }
}
```

---

## 🔧 **IMPLEMENTACIÓN EN REACT NATIVE**

### **1. Manejo de Notificaciones Mejoradas**

```javascript
// services/NotificationHandler.js
export const handleNotificationReceived = (notification) => {
  const { title, body, data } = notification.request.content;
  
  console.log('📱 Enhanced notification received:', {
    title,
    body,
    type: data?.type,
    entityId: data?.entityId
  });

  // Procesar datos adicionales según el tipo
  switch (data?.type) {
    case 'ticket':
      handleTicketNotification(data);
      break;
    case 'appointment': 
      handleAppointmentNotification(data);
      break;
    default:
      handleGenericNotification(data);
  }
};

const handleTicketNotification = (data) => {
  const { ticket_data, technical_data, device_data, location_data } = data;
  
  console.log('🎫 Ticket notification data:', {
    ticket: ticket_data,
    technical: technical_data, 
    device: device_data,
    location: location_data
  });
  
  // Actualizar estado de la app con información completa
  updateTicketState({
    ...ticket_data,
    technical: technical_data,
    device: device_data,
    location: location_data
  });
};

const handleAppointmentNotification = (data) => {
  const { appointment_data, technical_data, ticket_data } = data;
  
  console.log('📅 Appointment notification data:', {
    appointment: appointment_data,
    technical: technical_data,
    ticket: ticket_data
  });
  
  // Actualizar calendario/lista de citas
  updateAppointmentState({
    ...appointment_data,
    technical: technical_data,
    ticket: ticket_data
  });
};
```

### **2. Navegación Inteligente**

```javascript
// services/NavigationService.js
export const navigateFromNotification = (data, navigation) => {
  const { type, screen, entityId } = data;
  
  switch (type) {
    case 'ticket':
      if (entityId) {
        navigation.navigate('TicketDetail', {
          ticketId: entityId,
          // Pasar datos adicionales para evitar llamadas a API
          ticketData: data.ticket_data,
          technicalData: data.technical_data,
          deviceData: data.device_data
        });
      } else {
        navigation.navigate('TicketsList');
      }
      break;
      
    case 'appointment':
      if (entityId) {
        navigation.navigate('AppointmentDetail', {
          appointmentId: entityId,
          appointmentData: data.appointment_data,
          technicalData: data.technical_data
        });
      } else {
        navigation.navigate('AppointmentsList');
      }
      break;
      
    default:
      navigation.navigate('Home');
  }
};
```

### **3. UI de Notificaciones Mejoradas**

```javascript
// components/NotificationCard.js
export const NotificationCard = ({ notification }) => {
  const { title, body, data } = notification;
  
  const renderNotificationIcon = () => {
    switch (data?.type) {
      case 'ticket':
        return getTicketIcon(data.ticket_data?.status);
      case 'appointment':
        return getAppointmentIcon(data.appointment_data?.status);
      default:
        return '🔔';
    }
  };
  
  const renderAdditionalInfo = () => {
    if (data?.technical_data?.name) {
      return (
        <Text style={styles.technicalInfo}>
          👨‍🔧 {data.technical_data.name}
          {data.technical_data.phone && ` • ${data.technical_data.phone}`}
        </Text>
      );
    }
    
    if (data?.device_data?.name) {
      return (
        <Text style={styles.deviceInfo}>
          📱 {data.device_data.name}
          {data.device_data.location && ` • ${data.device_data.location}`}
        </Text>
      );
    }
    
    return null;
  };
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigateFromNotification(data)}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{renderNotificationIcon()}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
      {renderAdditionalInfo()}
    </TouchableOpacity>
  );
};
```

---

## 🚀 **BENEFICIOS DE LA NUEVA IMPLEMENTACIÓN**

### **✅ Para Usuarios:**
- **Mensajes claros**: "AC Unit Not Working" en lugar de "TICK-123"  
- **Estados legibles**: "In Progress" en lugar de "in_progress"
- **Información completa**: Nombre del técnico, datos del dispositivo, ubicación
- **Contexto completo**: Saben exactamente qué, quién, cuándo y dónde

### **✅ Para Técnicos:**  
- **Detalles del trabajo**: Información del cliente, dispositivo, ubicación
- **Datos de contacto**: Teléfono del cliente para coordinación
- **Información técnica**: Modelo del dispositivo, número de serie
- **Ubicación precisa**: Edificio, apartamento para llegar correctamente

### **✅ Para Desarrollo:**
- **Datos estructurados**: Información organizada en objetos claros
- **Navegación inteligente**: Puede navegar directamente con datos precargados
- **Menos llamadas API**: Datos ya incluidos en la notificación
- **Extensible**: Fácil agregar nuevos tipos de notificaciones

---

## 🔧 **PRÓXIMOS PASOS PARA EL EQUIPO MÓVIL**

### **1. Actualizar PushNotificationService**
- ✅ Ya está implementado el manejo dual Expo/FCM
- 🔄 Actualizar handlers para procesar nuevas estructuras de datos

### **2. Mejorar UI de Notificaciones**
- 🔄 Mostrar información adicional (técnico, dispositivo)  
- 🔄 Iconos específicos por tipo de notificación
- 🔄 Colores según prioridad/estado

### **3. Implementar Navegación Mejorada**
- 🔄 Pasar datos completos al navegar
- 🔄 Evitar llamadas API innecesarias
- 🔄 Precarga de pantallas con datos de notificación

### **4. Testing**
- 🔄 Probar todos los nuevos tipos de notificaciones
- 🔄 Verificar datos completos en cada escenario
- 🔄 Validar navegación desde notificaciones

---

## 📞 **EVENTOS QUE DISPARAN NOTIFICACIONES AUTOMÁTICAMENTE**

### **Backend Disparadores:**
1. **Ticket creado** → `dispatchTicketCreated()`
2. **Ticket asignado** → `dispatchTicketAssigned()`  
3. **Estado cambiado** → `dispatchTicketStatusChanged()`
4. **Técnico desasignado** → `dispatchTicketUnassigned()` 🆕
5. **Cita creada** → `dispatchAppointmentCreated()` 🆕
6. **Cita reagendada** → Modelo Appointment (ya existe)
7. **Recordatorio de cita** → Modelo Appointment (ya existe)
8. **Cita iniciada** → `dispatchAppointmentStarted()` 🆕
9. **Cita completada** → `dispatchAppointmentCompleted()` 🆕  
10. **Cita cancelada** → `dispatchAppointmentCancelled()` 🆕

Todas las notificaciones se envían automáticamente cuando ocurren estos eventos en el backend. El equipo móvil solo necesita estar preparado para recibirlas y procesarlas correctamente.

---

**🎉 ¡El sistema está listo! Todas las notificaciones ahora proporcionan información completa y mensajes descriptivos para una mejor experiencia de usuario.**