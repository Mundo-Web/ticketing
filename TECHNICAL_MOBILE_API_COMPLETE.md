# 📱 API Completa para App Móvil de Técnicos

> **Documentación completa y actualizada de todos los endpoints disponibles**

---

## 📋 Tabla de Contenidos

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Listado de Técnicos](#listado-de-técnicos)
4. [Tickets](#tickets)
5. [Acciones de Tickets](#acciones-de-tickets)
6. [Appointments (Citas)](#appointments-citas)
7. [Notificaciones](#notificaciones)
8. [Errores Comunes](#errores-comunes)

---

## 🌐 Información General

### Base URL
```
https://adkassist.com/api
```

### Headers Requeridos

**Para endpoints protegidos:**
```javascript
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

**Para upload de archivos (multipart):**
```javascript
{
  "Authorization": "Bearer {token}",
  "Content-Type": "multipart/form-data",
  "Accept": "application/json"
}
```

### Tipos de Técnicos

```javascript
// En la respuesta del login:
{
  technical: {
    is_default: true   // Técnico JEFE (ve todos los tickets)
    is_default: false  // Técnico REGULAR (solo sus tickets)
  }
}
```

---

## 🔐 Autenticación

### 1. Login

**Endpoint:** `POST /api/tenant/login`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

**Request Body:**
```json
{
  "email": "technical@example.com",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "user": {
    "id": 5,
    "name": "Juan Pérez",
    "email": "technical@example.com",
    "roles": ["technical"],
    "technical_id": 5
  },
  "technical": {
    "id": 5,
    "name": "Juan Pérez",
    "email": "technical@example.com",
    "phone": "+51987654321",
    "photo": "https://adkassist.com/storage/technicals/juan.jpg",
    "shift": "morning",
    "status": true,
    "is_default": false
  },
  "token": "1|abcdefghijklmnopqrstuvwxyz..."
}
```

**Ejemplo JavaScript:**
```javascript
const login = async (email, password) => {
  const response = await fetch('https://adkassist.com/api/tenant/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  // Guardar token
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
  await AsyncStorage.setItem('technical', JSON.stringify(data.technical));
  
  return data;
};
```

### 2. Logout

**Endpoint:** `POST /api/tenant/logout`

**Headers:** Bearer Token requerido

**Response Success (200):**
```json
{
  "message": "Successfully logged out"
}
```

---

## 👥 Listado de Técnicos

### 3. Obtener Todos los Técnicos

**Endpoint:** `GET /api/technicals`

**Headers:** Bearer Token requerido

**Uso:** Solo para técnicos jefe (`is_default: true`)

**Response Success (200):**
```json
{
  "technicals": [
    {
      "id": 5,
      "name": "Juan Pérez",
      "email": "juan@technical.com",
      "photo": "https://adkassist.com/storage/technicals/juan.jpg",
      "shift": "morning",
      "status": true,
      "is_default": false
    },
    {
      "id": 8,
      "name": "María García",
      "email": "maria@technical.com",
      "photo": null,
      "shift": "afternoon",
      "status": true,
      "is_default": true
    }
  ]
}
```

**Valores de `shift`:**
- `morning` - Turno mañana
- `afternoon` - Turno tarde
- `night` - Turno noche

---

## 🎫 Tickets

### 4. Obtener Tickets del Técnico

**Endpoint:** `GET /api/technicals/{technicalId}/tickets?type={type}`

**Headers:** Bearer Token requerido

**Parámetros URL:**
- `technicalId` (required): ID del técnico
- `type` (optional): Filtro de tickets

**Valores de `type`:**
- `all` - Todos los tickets (default)
- `today` - Creados hoy
- `week` - De esta semana
- `month` - De este mes
- `open` - Estado abierto
- `in_progress` - En progreso
- `resolved` - Resueltos
- `closed` - Cerrados
- `recent` - Resueltos/cerrados últimos 7 días

**Comportamiento:**
- **Técnico Regular** (`is_default: false`): Solo ve sus tickets asignados
- **Técnico Jefe** (`is_default: true`): Ve TODOS los tickets del sistema

**Response Success (200):**
```json
[
  {
    "id": 38,
    "title": "Refrigerador no enfría",
    "description": "El refrigerador dejó de enfriar desde ayer",
    "category": "appliance",
    "status": "in_progress",
    "priority": "high",
    "created_at": "2025-11-20T10:30:00.000000Z",
    "updated_at": "2025-11-25T14:20:00.000000Z",
    "device": {
      "id": 45,
      "name": "Refrigerador Samsung",
      "brand": "Samsung",
      "model": "RT38K5930SL",
      "system": "Refrigeración",
      "device_type": "Electrodoméstico",
      "icon_id": 3,
      "device_image": "https://adkassist.com/storage/devices/refrigerator.png",
      "ubicacion": "Cocina",
      "name_device": {
        "id": 12,
        "name": "Refrigerador",
        "status": true,
        "image": "https://adkassist.com/storage/devices/refrigerator.png"
      }
    },
    "technical": {
      "id": 5,
      "name": "Juan Pérez",
      "email": "juan@technical.com",
      "phone": "+51987654321",
      "photo": "https://adkassist.com/storage/technicals/juan.jpg"
    },
    "histories_count": 8
  }
]
```

**Ejemplo JavaScript:**
```javascript
const getTickets = async (technicalId, type = 'all') => {
  const token = await AsyncStorage.getItem('token');
  
  const response = await fetch(
    `https://adkassist.com/api/technicals/${technicalId}/tickets?type=${type}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
  
  return await response.json();
};
```

### 5. Obtener Detalle de Ticket

**Endpoint:** `GET /api/tickets/{ticketId}/detail`

**Headers:** Bearer Token requerido

**❌ NO REQUIERE AUTENTICACIÓN** (endpoint público para técnicos)

**Response Success (200):**
```json
{
  "ticket": {
    "id": 38,
    "title": "Refrigerador no enfría",
    "description": "El refrigerador dejó de enfriar desde ayer",
    "category": "appliance",
    "status": "in_progress",
    "priority": "high",
    "created_at": "2025-11-20T10:30:00.000000Z",
    "updated_at": "2025-11-25T14:20:00.000000Z",
    "device": {
      "id": 45,
      "name": "Refrigerador Samsung",
      "brand": "Samsung",
      "model": "RT38K5930SL",
      "system": "Refrigeración",
      "device_type": "Electrodoméstico",
      "ubicacion": "Cocina",
      "icon_id": 3,
      "device_image": "https://adkassist.com/storage/devices/refrigerator.png",
      "name_device": {
        "id": 12,
        "name": "Refrigerador",
        "status": true,
        "image": "https://adkassist.com/storage/devices/refrigerator.png"
      }
    },
    "technical": {
      "id": 5,
      "name": "Juan Pérez",
      "email": "juan@technical.com",
      "phone": "+51987654321",
      "photo": "https://adkassist.com/storage/technicals/juan.jpg",
      "shift": "morning"
    },
    "member": {
      "id": 183,
      "name": "María García",
      "email": "maria.garcia@email.com",
      "phone": "+51912345678",
      "photo": "https://adkassist.com/storage/tenants/maria.jpg",
      "apartment": {
        "id": 45,
        "number": "501",
        "building": {
          "id": 8,
          "name": "Torre A",
          "address": "Av. Principal 123, San Isidro"
        }
      }
    },
    "histories": [
      {
        "id": 123,
        "action": "status_change",
        "description": "Ticket asignado a técnico",
        "user_name": "Sistema",
        "created_at": "2025-11-20T11:00:00.000000Z",
        "technical": {
          "id": 5,
          "name": "Juan Pérez"
        }
      },
      {
        "id": 124,
        "action": "comment",
        "description": "Se revisó el dispositivo, requiere cambio de compresor",
        "user_name": "Juan Pérez",
        "created_at": "2025-11-20T15:30:00.000000Z",
        "technical": {
          "id": 5,
          "name": "Juan Pérez"
        }
      }
    ]
  }
}
```

**Estados de Ticket:**
- `open` - Abierto
- `in_progress` - En progreso
- `resolved` - Resuelto
- `closed` - Cerrado
- `cancelled` - Cancelado

**Prioridades:**
- `low` - Baja
- `medium` - Media
- `high` - Alta
- `urgent` - Urgente

---

## ⚙️ Acciones de Tickets

### 6. Actualizar Estado de Ticket

**Endpoint:** `POST /api/tickets/{ticketId}/update-status`

**Headers:** Bearer Token requerido

**Request Body:**
```json
{
  "status": "in_progress",
  "comment": "Iniciando revisión del dispositivo"
}
```

**Transiciones Válidas:**
- `open` → `in_progress`, `cancelled`
- `in_progress` → `resolved`, `cancelled`
- `resolved` → `closed`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "ticket": {
    "id": 38,
    "status": "in_progress",
    "updated_at": "2025-11-25T15:30:00.000000Z"
  }
}
```

**Ejemplo JavaScript:**
```javascript
const updateTicketStatus = async (ticketId, status, comment) => {
  const token = await AsyncStorage.getItem('token');
  
  const response = await fetch(
    `https://adkassist.com/api/tickets/${ticketId}/update-status`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ status, comment })
    }
  );
  
  return await response.json();
};
```

### 7. Agregar Comentario/Historia

**Endpoint:** `POST /api/tickets/{ticketId}/add-history`

**Headers:** Bearer Token requerido

**Request Body:**
```json
{
  "action": "comment",
  "description": "Revisé el compresor y necesita reemplazo"
}
```

**Valores de `action`:**
- `comment` - Comentario general
- `status_change` - Cambio de estado
- `assignment` - Asignación
- `evidence_uploaded` - Evidencia subida
- `private_note` - Nota privada

**Response Success (200):**
```json
{
  "success": true,
  "message": "History added successfully"
}
```

### 8. Subir Evidencia (Archivo)

**Endpoint:** `POST /api/tickets/{ticketId}/upload-evidence`

**Headers:** Bearer Token + `Content-Type: multipart/form-data`

**Request Body (FormData):**
```javascript
const formData = new FormData();
formData.append('evidence', {
  uri: photoUri,
  type: 'image/jpeg',
  name: 'evidencia.jpg'
});
formData.append('description', 'Foto del compresor dañado');
```

**Archivos Aceptados:**
- Imágenes: `.jpg`, `.jpeg`, `.png`, `.gif`
- Videos: `.mp4`, `.mov`, `.avi`
- Tamaño máximo: 10MB

**Response Success (200):**
```json
{
  "success": true,
  "message": "Evidence uploaded successfully",
  "file_path": "ticket_evidence/1732901234_evidencia.jpg",
  "file_name": "1732901234_evidencia.jpg"
}
```

**Ejemplo JavaScript (React Native):**
```javascript
const uploadEvidence = async (ticketId, fileUri, description = '') => {
  const token = await AsyncStorage.getItem('token');
  
  const formData = new FormData();
  formData.append('evidence', {
    uri: fileUri,
    type: 'image/jpeg',
    name: 'evidencia.jpg'
  });
  
  if (description) {
    formData.append('description', description);
  }
  
  const response = await fetch(
    `https://adkassist.com/api/tickets/${ticketId}/upload-evidence`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: formData
    }
  );
  
  return await response.json();
};
```

### 9. Subir Evidencia (Base64) 🆕

**Endpoint:** `POST /api/tickets/{ticketId}/upload-evidence-base64`

**Headers:** Bearer Token requerido

**Uso:** Para Android cuando FormData no funciona correctamente

**Request Body:**
```json
{
  "evidence_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "file_name": "evidencia.jpg",
  "file_type": "image/jpeg",
  "file_size": 524288,
  "description": "Foto del compresor dañado"
}
```

**Tipos de Archivo Aceptados:**
- `image/jpeg`, `image/jpg`, `image/png`, `image/gif`
- `video/mp4`, `video/mov`, `video/avi`

**Tamaño Máximo:** 10MB (10485760 bytes)

**Response Success (200):**
```json
{
  "success": true,
  "message": "Evidence uploaded successfully",
  "file_path": "ticket_evidence/1732901234_abc123.jpg",
  "file_name": "1732901234_abc123.jpg",
  "file_url": "https://adkassist.com/storage/ticket_evidence/1732901234_abc123.jpg"
}
```

**Ejemplo JavaScript (Android):**
```javascript
const uploadEvidenceBase64 = async (ticketId, base64Data, fileName, fileType, fileSize, description = '') => {
  const token = await AsyncStorage.getItem('token');
  
  const response = await fetch(
    `https://adkassist.com/api/tickets/${ticketId}/upload-evidence-base64`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        evidence_base64: base64Data,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        description: description
      })
    }
  );
  
  return await response.json();
};

// Uso con expo-image-picker:
const pickAndUploadImage = async (ticketId) => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    base64: true
  });
  
  if (!result.canceled) {
    const asset = result.assets[0];
    
    await uploadEvidenceBase64(
      ticketId,
      asset.base64,
      asset.fileName || 'photo.jpg',
      'image/jpeg',
      asset.fileSize || 0,
      'Evidencia desde móvil'
    );
  }
};
```

### 10. Agregar Nota Privada

**Endpoint:** `POST /api/tickets/{ticketId}/add-private-note`

**Headers:** Bearer Token requerido

**Uso:** Notas visibles solo para técnicos, no para members

**Request Body:**
```json
{
  "note": "El cliente mencionó que el problema comenzó hace 3 días"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Private note added successfully"
}
```

**Ejemplo JavaScript:**
```javascript
const addPrivateNote = async (ticketId, note) => {
  const token = await AsyncStorage.getItem('token');
  
  const response = await fetch(
    `https://adkassist.com/api/tickets/${ticketId}/add-private-note`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ note })
    }
  );
  
  return await response.json();
};
```

### 11. Enviar Mensaje al Member

**Endpoint:** `POST /api/tickets/{ticketId}/send-message-to-technical`

**Headers:** Bearer Token requerido

**⚠️ IMPORTANTE:** Esta ruta usa `auth:sanctum` SIN middleware `tenant`, permitiendo acceso a técnicos

**Uso:** Técnico envía mensaje al member (usuario que creó el ticket)

**Request Body:**
```json
{
  "message": "Hola, necesito que esté presente mañana a las 10am para revisar el dispositivo"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "ticket_id": 38
}
```

---

## 📅 Appointments (Citas)

### 12. Obtener Citas del Técnico

**Endpoint:** `GET /api/technicals/{technicalId}/appointments?date={date}`

**Headers:** Bearer Token requerido

**Parámetros URL:**
- `technicalId` (required): ID del técnico
- `date` (optional): Fecha en formato `YYYY-MM-DD`

**Si no se proporciona `date`, devuelve todas las citas del técnico**

**Response Success (200):**
```json
[
  {
    "id": 15,
    "ticket_id": 38,
    "technical_id": 5,
    "title": "Revisión de refrigerador",
    "description": "Inspección y diagnóstico del sistema de refrigeración",
    "address": "Av. Principal 123, Torre A, Apto 501",
    "scheduled_for": "2025-11-26T10:00:00.000000Z",
    "estimated_duration": 60,
    "status": "scheduled",
    "started_at": null,
    "completed_at": null,
    "member_instructions": "Tocar el timbre 501",
    "notes": null,
    "created_at": "2025-11-25T14:00:00.000000Z",
    "ticket": {
      "id": 38,
      "title": "Refrigerador no enfría",
      "status": "in_progress",
      "priority": "high",
      "device": {
        "id": 45,
        "name": "Refrigerador Samsung"
      },
      "user": {
        "id": 183,
        "name": "María García",
        "email": "maria.garcia@email.com"
      },
      "apartment": {
        "id": 45,
        "number": "501",
        "building": {
          "id": 8,
          "name": "Torre A",
          "address": "Av. Principal 123, San Isidro"
        }
      }
    },
    "tenant": {
      "id": 183,
      "name": "María García",
      "email": "maria.garcia@email.com",
      "phone": "+51912345678"
    }
  }
]
```

**Estados de Appointment:**
- `scheduled` - Programada
- `in_progress` - En curso (técnico llegó)
- `awaiting_feedback` - Esperando calificación del member
- `completed` - Completada
- `cancelled` - Cancelada
- `no_show` - Member no estuvo presente

**Ejemplo JavaScript:**
```javascript
const getAppointments = async (technicalId, date = null) => {
  const token = await AsyncStorage.getItem('token');
  
  let url = `https://adkassist.com/api/technicals/${technicalId}/appointments`;
  if (date) {
    url += `?date=${date}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  return await response.json();
};

// Obtener citas de hoy
const todayDate = new Date().toISOString().split('T')[0]; // "2025-11-26"
const todayAppointments = await getAppointments(5, todayDate);
```

### 13. Obtener Detalle de Cita

**Endpoint:** `GET /api/appointments/{appointmentId}/details`

**Headers:** Bearer Token requerido

**Response Success (200):**
```json
{
  "id": 15,
  "ticket_id": 38,
  "technical_id": 5,
  "title": "Revisión de refrigerador",
  "description": "Inspección y diagnóstico del sistema de refrigeración",
  "address": "Av. Principal 123, Torre A, Apto 501",
  "scheduled_for": "2025-11-26T10:00:00.000000Z",
  "estimated_duration": 60,
  "status": "scheduled",
  "started_at": null,
  "completed_at": null,
  "completion_notes": null,
  "member_feedback": null,
  "rating": null,
  "service_rating": null,
  "member_instructions": "Tocar el timbre 501",
  "notes": null,
  "created_at": "2025-11-25T14:00:00.000000Z",
  "updated_at": "2025-11-25T14:00:00.000000Z",
  "ticket": {
    "id": 38,
    "title": "Refrigerador no enfría",
    "description": "El refrigerador dejó de enfriar desde ayer",
    "status": "in_progress",
    "priority": "high",
    "device": {
      "id": 45,
      "name": "Refrigerador Samsung",
      "ubicacion": "Cocina"
    }
  },
  "technical": {
    "id": 5,
    "name": "Juan Pérez",
    "email": "juan@technical.com",
    "phone": "+51987654321",
    "photo": "https://adkassist.com/storage/technicals/juan.jpg"
  },
  "member": {
    "id": 183,
    "name": "María García",
    "email": "maria.garcia@email.com",
    "phone": "+51912345678",
    "photo": "https://adkassist.com/storage/tenants/maria.jpg",
    "apartment": {
      "number": "501",
      "floor": "5",
      "building": {
        "name": "Torre A",
        "address": "Av. Principal 123, San Isidro"
      }
    }
  }
}
```

### 14. Crear Nueva Cita

**Endpoint:** `POST /api/tickets/{ticketId}/appointments`

**Headers:** Bearer Token requerido

**Request Body:**
```json
{
  "title": "Revisión de refrigerador",
  "description": "Inspección y diagnóstico del sistema de refrigeración",
  "address": "Av. Principal 123, Torre A, Apto 501",
  "scheduled_for": "2025-11-26 10:00:00",
  "estimated_duration": 60,
  "member_instructions": "Tocar el timbre 501",
  "notes": "Llevar herramientas especiales"
}
```

**Campos:**
- `title` (required): Título de la cita
- `description` (optional): Descripción detallada
- `address` (required): Dirección donde se realizará
- `scheduled_for` (required): Fecha y hora en formato `YYYY-MM-DD HH:MM:SS`
- `estimated_duration` (optional): Duración estimada en minutos (default: 60)
- `member_instructions` (optional): Instrucciones para el member
- `notes` (optional): Notas privadas del técnico

**Response Success (201):**
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "appointment": {
    "id": 15,
    "ticket_id": 38,
    "technical_id": 5,
    "title": "Revisión de refrigerador",
    "scheduled_for": "2025-11-26T10:00:00.000000Z",
    "status": "scheduled"
  }
}
```

### 15. Iniciar Cita

**Endpoint:** `POST /api/appointments/{appointmentId}/start`

**Headers:** Bearer Token requerido

**Uso:** Técnico marca que llegó al lugar

**Request Body:** Vacío `{}`

**Response Success (200):**
```json
{
  "success": true,
  "message": "Appointment started successfully",
  "appointment": {
    "id": 15,
    "status": "in_progress",
    "started_at": "2025-11-26T10:05:00.000000Z"
  }
}
```

### 16. Completar Cita

**Endpoint:** `POST /api/appointments/{appointmentId}/complete`

**Headers:** Bearer Token requerido

**Request Body:**
```json
{
  "completion_notes": "Se reemplazó el compresor. Refrigerador funcionando correctamente.",
  "rating": 5,
  "member_feedback": "Excelente servicio, muy profesional"
}
```

**Campos:**
- `completion_notes` (required): Notas de lo realizado
- `rating` (optional): Calificación del técnico (1-5)
- `member_feedback` (optional): Comentario del member

**Response Success (200):**
```json
{
  "success": true,
  "message": "Appointment completed successfully",
  "appointment": {
    "id": 15,
    "status": "awaiting_feedback",
    "completed_at": "2025-11-26T11:30:00.000000Z",
    "completion_notes": "Se reemplazó el compresor. Refrigerador funcionando correctamente."
  }
}
```

**⚠️ Nota:** El estado queda en `awaiting_feedback` hasta que el member califique el servicio.

### 17. Marcar No-Show (Member Ausente)

**Endpoint:** `POST /api/appointments/{appointmentId}/no-show`

**Headers:** Bearer Token requerido

**Uso:** Cuando el member no está presente en la cita programada

**Request Body:**
```json
{
  "reason": "Nadie atendió después de esperar 15 minutos"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Appointment marked as no-show",
  "appointment": {
    "id": 15,
    "status": "no_show"
  }
}
```

### 18. Cancelar Cita

**Endpoint:** `POST /api/appointments/{appointmentId}/cancel`

**Headers:** Bearer Token requerido

**Request Body:**
```json
{
  "reason": "El cliente solicitó reprogramar para otra fecha"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "appointment": {
    "id": 15,
    "status": "cancelled"
  }
}
```

### 19. Reprogramar Cita

**Endpoint:** `POST /api/appointments/{appointmentId}/reschedule`

**Headers:** Bearer Token requerido

**Request Body:**
```json
{
  "new_scheduled_for": "2025-11-27 14:00:00",
  "reason": "El cliente solicitó cambio de horario"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "appointment": {
    "id": 15,
    "scheduled_for": "2025-11-27T14:00:00.000000Z",
    "status": "scheduled"
  }
}
```

---

## 🔔 Notificaciones

### 20. Obtener Notificaciones

**Endpoint:** `GET /api/tenant/notifications`

**Headers:** Bearer Token requerido

**Response Success (200):**
```json
{
  "notifications": [
    {
      "id": "abc123-def456-ghi789",
      "type": "ticket_assigned",
      "title": "🎫 Nuevo ticket asignado",
      "message": "Se te ha asignado el ticket #38: Refrigerador no enfría",
      "read_at": null,
      "created_at": "2025-11-25T14:00:00.000000Z",
      "data": {
        "type": "ticket_assigned",
        "ticket_id": 38,
        "ticket_title": "Refrigerador no enfría",
        "priority": "high"
      }
    },
    {
      "id": "xyz789-abc123-def456",
      "type": "appointment_created",
      "title": "📅 Nueva cita programada",
      "message": "Tienes una cita programada para mañana a las 10:00 AM",
      "read_at": "2025-11-25T15:00:00.000000Z",
      "created_at": "2025-11-25T14:30:00.000000Z",
      "data": {
        "type": "appointment_created",
        "appointment_id": 15,
        "scheduled_for": "2025-11-26T10:00:00.000000Z"
      }
    }
  ],
  "unread_count": 5,
  "total_count": 23
}
```

**Tipos de Notificaciones:**
- `ticket_assigned` - Ticket asignado
- `ticket_status_changed` - Estado de ticket cambió
- `ticket_comment` - Nuevo comentario en ticket
- `appointment_created` - Nueva cita creada
- `appointment_started` - Cita iniciada
- `appointment_completed` - Cita completada
- `appointment_cancelled` - Cita cancelada
- `appointment_rescheduled` - Cita reprogramada

### 21. Marcar Notificación como Leída

**Endpoint:** `POST /api/tenant/notifications/{notificationId}/read`

**Headers:** Bearer Token requerido

**Response Success (200):**
```json
{
  "success": true,
  "notification_id": "abc123-def456-ghi789",
  "message": "Notificación marcada como leída"
}
```

### 22. Marcar Todas como Leídas

**Endpoint:** `POST /api/tenant/notifications/mark-all-read`

**Headers:** Bearer Token requerido

**Response Success (200):**
```json
{
  "success": true,
  "message": "Todas las notificaciones marcadas como leídas",
  "marked_count": 5
}
```

### 23. Registrar Token de Push Notifications

**Endpoint:** `POST /api/tenant/register-push-token`

**Headers:** Bearer Token requerido

**Request Body:**
```json
{
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "token_type": "expo",
  "platform": "android",
  "device_type": "phone",
  "device_name": "Samsung Galaxy A15",
  "app_ownership": "standalone",
  "is_standalone": true,
  "execution_environment": "standalone"
}
```

**Para APK Standalone con FCM:**
```json
{
  "push_token": "fGzKj5TvSU6R8H3...",
  "token_type": "fcm",
  "platform": "android",
  "device_type": "phone",
  "device_name": "Samsung Galaxy A15",
  "app_ownership": "standalone",
  "is_standalone": true,
  "execution_environment": "standalone"
}
```

**Valores de `token_type`:**
- `expo` - Para Expo Go
- `fcm` - Para APK standalone con Firebase

**Response Success (200):**
```json
{
  "success": true,
  "message": "Push token registered successfully",
  "token_id": 8
}
```

---

## ❌ Errores Comunes

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```
**Causa:** Token inválido o expirado
**Solución:** Hacer logout y pedir login nuevamente

### 403 Forbidden
```json
{
  "message": "You can only upload evidence to tickets assigned to you."
}
```
**Causa:** Intentando acceder a recurso sin permisos
**Solución:** Verificar que el técnico tenga acceso al ticket/cita

### 404 Not Found
```json
{
  "error": "Ticket not found"
}
```
**Causa:** Recurso no existe
**Solución:** Verificar que el ID sea correcto

### 422 Unprocessable Entity
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "status": ["The status field is required."],
    "completion_notes": ["The completion notes field is required."]
  }
}
```
**Causa:** Validación fallida
**Solución:** Revisar campos requeridos

### 500 Internal Server Error
```json
{
  "error": "Error al obtener detalle del ticket",
  "message": "Call to a member function on null"
}
```
**Causa:** Error en el servidor
**Solución:** Contactar soporte, revisar logs del servidor

---

## 📊 Resumen de Endpoints

### Autenticación
- ✅ `POST /api/tenant/login`
- ✅ `POST /api/tenant/logout`

### Técnicos
- ✅ `GET /api/technicals`

### Tickets
- ✅ `GET /api/technicals/{id}/tickets?type={type}`
- ✅ `GET /api/tickets/{id}/detail`

### Acciones de Tickets
- ✅ `POST /api/tickets/{id}/update-status`
- ✅ `POST /api/tickets/{id}/add-history`
- ✅ `POST /api/tickets/{id}/upload-evidence` (FILE)
- ✅ `POST /api/tickets/{id}/upload-evidence-base64` (BASE64) 🆕
- ✅ `POST /api/tickets/{id}/add-private-note`
- ✅ `POST /api/tickets/{id}/send-message-to-technical`

### Appointments
- ✅ `GET /api/technicals/{id}/appointments?date={date}`
- ✅ `GET /api/appointments/{id}/details`
- ✅ `POST /api/tickets/{id}/appointments`
- ✅ `POST /api/appointments/{id}/start`
- ✅ `POST /api/appointments/{id}/complete`
- ✅ `POST /api/appointments/{id}/no-show`
- ✅ `POST /api/appointments/{id}/cancel`
- ✅ `POST /api/appointments/{id}/reschedule`

### Notificaciones
- ✅ `GET /api/tenant/notifications`
- ✅ `POST /api/tenant/notifications/{id}/read`
- ✅ `POST /api/tenant/notifications/mark-all-read`
- ✅ `POST /api/tenant/register-push-token`

---

## 🚀 Próximos Pasos

1. **Implementar autenticación** con detección de `is_default`
2. **Crear dashboard diferenciado** (personal vs global)
3. **Implementar lista de tickets** con filtros
4. **Implementar detalle de ticket** con todas las acciones
5. **Implementar upload de evidencia** (usar base64 para Android)
6. **Implementar gestión de citas** con todos los estados
7. **Implementar notificaciones push**
8. **Testing completo**

---

**Última actualización**: 2025-11-29
**Versión**: 2.0
**Mejoras**: Agregado endpoint `/upload-evidence-base64` para soporte Android
