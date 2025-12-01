# Mobile Technical API Documentation

## Complete API Endpoints for Mobile Technical App

### Base URL
```
https://adkassist.com/api
```

---

## 📋 TABLE OF CONTENTS

1. [TICKET ENDPOINTS](#tickets-endpoints)
   - Get Ticket Detail
   - Resolve Ticket
   - Add Comment
2. [APPOINTMENT ENDPOINTS](#appointments-endpoints)
   - Get Technician's Appointments (List)
   - Get Appointment Detail
   - Create Appointment
   - Start Appointment
   - Complete Appointment
   - Cancel Appointment
   - Reschedule Appointment
   - Mark as No Show
3. [Authentication](#authentication)
4. [Error Handling](#error-handling)
5. [Mobile Implementation Examples](#mobile-implementation-examples)

---

## TICKETS ENDPOINTS

## 1. Resolver Ticket (Mark as Resolved)

**Endpoint:** `POST /api/tickets/{ticketId}/resolve`

**Autenticación:** Bearer Token (Sanctum)

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `resolution_notes` | string | **Sí** | Notas de resolución del ticket (máx. 1000 caracteres) |
| `evidence_base64` | string | No | Imagen/video en base64 como evidencia de resolución |
| `file_name` | string | Condicional* | Nombre del archivo (requerido si envías `evidence_base64`) |
| `file_type` | string | Condicional* | MIME type del archivo (requerido si envías `evidence_base64`) |
| `file_size` | integer | Condicional* | Tamaño del archivo en bytes (requerido si envías `evidence_base64`) |

*Requerido cuando se envía `evidence_base64`

**Valores válidos para `file_type`:**
- `image/jpeg`
- `image/png`
- `image/jpg`
- `image/gif`
- `video/mp4`
- `video/mov`
- `video/avi`

**Ejemplo Request (Sin evidencia):**
```json
{
  "resolution_notes": "Se reemplazó el router y se configuró la red WiFi. Todo funcionando correctamente."
}
```

**Ejemplo Request (Con evidencia):**
```json
{
  "resolution_notes": "Se reemplazó el router y se configuró la red WiFi. Todo funcionando correctamente.",
  "evidence_base64": "/9j/4AAQSkZJRgABAQEAYABgAAD...",
  "file_name": "router_instalado.jpg",
  "file_type": "image/jpeg",
  "file_size": 245678
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Ticket resolved successfully",
  "ticket": {
    "id": 82,
    "status": "resolved",
    "resolved_at": "2025-11-29T19:53:22.000000Z"
  }
}
```

**Error Responses:**

**403 Forbidden** - No eres el técnico asignado:
```json
{
  "success": false,
  "message": "You can only resolve tickets assigned to you"
}
```

**422 Validation Error:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "resolution_notes": ["The resolution notes field is required."],
    "file_type": ["The file type must be one of: image/jpeg, image/png..."]
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error resolving ticket: [error details]"
}
```

---

## 2. Agregar Comentario (Add Comment)

**Endpoint:** `POST /api/tickets/{ticketId}/comment`

**Autenticación:** Bearer Token (Sanctum)

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `comment` | string | **Sí** | Texto del comentario (máx. 1000 caracteres) |

**Ejemplo Request:**
```json
{
  "comment": "Llamé al usuario pero no contestó. Intentaré nuevamente mañana."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Comment added successfully"
}
```

**Error Responses:**

**403 Forbidden** - No eres el técnico asignado:
```json
{
  "success": false,
  "message": "You can only comment on tickets assigned to you"
}
```

**422 Validation Error:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "comment": ["The comment field is required."]
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error adding comment: [error details]"
}
```

---

## 3. Obtener Detalle del Ticket (Get Ticket Detail)

**Endpoint:** `GET /api/tickets/{ticketId}/detail`

**Autenticación:** No requiere (público para técnicos)

**Headers:**
```json
{
  "Accept": "application/json"
}
```

**Success Response (200 OK):**
```json
{
  "ticket": {
    "id": 82,
    "title": "Router no funciona",
    "description": "El router del apartamento no está funcionando desde ayer",
    "category": "networking",
    "status": "in_progress",
    "priority": "high",
    "created_at": "2025-11-28T10:30:00.000000Z",
    "updated_at": "2025-11-29T19:53:22.000000Z",
    "attachments": [
      {
        "type": "evidence",
        "file_path": "ticket_evidence/1764460402_router.png",
        "name": "1764460402_router.png",
        "original_name": "router_roto.png",
        "mime_type": "image/png",
        "file_size": 245678,
        "uploaded_by": "Juan Pérez",
        "uploaded_at": "2025-11-29T15:20:00",
        "description": "Evidence uploaded by Juan Pérez"
      }
    ],
    "active_appointment": {
      "id": 15,
      "title": "Visita técnica - Router no funciona",
      "status": "scheduled",
      "scheduled_for": "2025-11-30T10:00:00.000000Z",
      "estimated_duration": 60,
      "technical": {
        "id": 3,
        "name": "Carlos Técnico"
      }
    },
    "device": {
      "id": 15,
      "name": "Router TP-Link",
      "brand": "TP-Link",
      "model": "Archer C6",
      "system": "Router",
      "device_type": "Network Device",
      "ubicacion": "Sala de estar",
      "icon_id": 5,
      "device_image": "/storage/devices/router.png"
    },
    "technical": {
      "id": 3,
      "name": "Carlos Técnico",
      "email": "carlos@technical.com",
      "phone": "+1234567890",
      "photo": "/storage/photos/carlos.jpg",
      "shift": "morning"
    },
    "member": {
      "id": 25,
      "name": "María González",
      "email": "maria@example.com",
      "phone": "+0987654321",
      "photo": "/storage/photos/maria.jpg",
      "apartment": {
        "id": 12,
        "number": "501",
        "building": {
          "id": 2,
          "name": "Torre A",
          "address": "Av. Principal 123"
        }
      }
    },
    "histories": [
      {
        "id": 150,
        "action": "comment",
        "description": "Comment by Carlos Técnico: Revisando el router ahora",
        "user_name": "Carlos Técnico",
        "created_at": "2025-11-29T14:00:00.000000Z",
        "technical": {
          "id": 3,
          "name": "Carlos Técnico"
        }
      },
      {
        "id": 149,
        "action": "status_change_in_progress",
        "description": "Ticket status changed to in_progress by Carlos Técnico",
        "user_name": "Carlos Técnico",
        "created_at": "2025-11-29T11:00:00.000000Z",
        "technical": {
          "id": 3,
          "name": "Carlos Técnico"
        }
      }
    ]
  }
}
```

**Nota Importante sobre Attachments:**
- La URL completa de la imagen/video es: `https://adkassist.com/storage/{file_path}`
- Ejemplo: `https://adkassist.com/storage/ticket_evidence/1764460402_router.png`
- Usa el campo `mime_type` para determinar si es imagen o video
- `file_size` está en bytes

**Nota sobre Active Appointment:**
- `active_appointment` será `null` si el ticket no tiene citas activas
- Una cita activa puede estar en estados: `scheduled`, `in_progress`, o `awaiting_feedback`
- Si existe, incluye el ID, título, estado, fecha programada y técnico asignado
- Útil para mostrar si ya existe una cita programada antes de crear una nueva

---

## Flujo Recomendado en la App Móvil

### 1. Pantalla de Detalle del Ticket

```typescript
// Obtener detalle del ticket
const response = await fetch(`https://adkassist.com/api/tickets/${ticketId}/detail`, {
  headers: {
    'Accept': 'application/json'
  }
});

const data = await response.json();
const ticket = data.ticket;

// Mostrar attachments (imágenes/videos)
ticket.attachments.forEach(attachment => {
  const imageUrl = `https://adkassist.com/storage/${attachment.file_path}`;
  // Renderizar imagen o video según mime_type
  if (attachment.mime_type.startsWith('image/')) {
    // Mostrar imagen
  } else if (attachment.mime_type.startsWith('video/')) {
    // Mostrar video
  }
});
```

### 2. Botón "Agregar Comentario"

```typescript
const addComment = async (ticketId: number, comment: string) => {
  const response = await fetch(`https://adkassist.com/api/tickets/${ticketId}/comment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ comment })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const result = await response.json();
  // Mostrar toast: "Comment added successfully"
  // Recargar timeline del ticket
};
```

### 3. Botón "Marcar como Resuelto"

```typescript
const resolveTicket = async (
  ticketId: number, 
  notes: string,
  evidence?: {
    base64: string,
    fileName: string,
    mimeType: string,
    size: number
  }
) => {
  const body: any = {
    resolution_notes: notes
  };

  if (evidence) {
    body.evidence_base64 = evidence.base64;
    body.file_name = evidence.fileName;
    body.file_type = evidence.mimeType;
    body.file_size = evidence.size;
  }

  const response = await fetch(`https://adkassist.com/api/tickets/${ticketId}/resolve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const result = await response.json();
  // Mostrar toast: "Ticket resolved successfully"
  // Navegar de regreso a lista de tickets
};
```

### 4. Subir Imagen/Video como Evidencia (Android)

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const pickAndUploadEvidence = async (ticketId: number, notes: string) => {
  // Seleccionar imagen/video
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) return;

  const asset = result.assets[0];
  
  // Convertir a base64
  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Obtener información del archivo
  const fileInfo = await FileSystem.getInfoAsync(asset.uri);
  
  // Resolver ticket con evidencia
  await resolveTicket(ticketId, notes, {
    base64: base64,
    fileName: asset.fileName || `evidence_${Date.now()}.jpg`,
    mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
    size: fileInfo.size || 0
  });
};
```

---

## Permisos y Seguridad

### Quién puede usar estos endpoints:

1. **Resolver Ticket (`/resolve`):**
   - ✅ Técnico asignado al ticket
   - ✅ Técnicos con flag `is_default = true`
   - ❌ Otros técnicos
   - ❌ Usuarios no técnicos

2. **Agregar Comentario (`/comment`):**
   - ✅ Técnico asignado al ticket
   - ✅ Técnicos con flag `is_default = true`
   - ❌ Otros técnicos
   - ❌ Usuarios no técnicos

3. **Ver Detalle (`/detail`):**
   - ✅ Cualquier técnico (no requiere autenticación)

### Token de Autenticación

El token se obtiene del endpoint de login:
```
POST /api/auth/login
```

Y debe incluirse en todas las peticiones autenticadas como:
```
Authorization: Bearer {token}
```

---

## Testing con Postman/Thunder Client

### Ejemplo cURL - Resolver Ticket:

```bash
curl -X POST https://adkassist.com/api/tickets/82/resolve \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "resolution_notes": "Router reemplazado y configurado correctamente",
    "evidence_base64": "/9j/4AAQSkZJRg...",
    "file_name": "router_fixed.jpg",
    "file_type": "image/jpeg",
    "file_size": 245678
  }'
```

### Ejemplo cURL - Agregar Comentario:

```bash
curl -X POST https://adkassist.com/api/tickets/82/comment \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "comment": "Usuario no está en casa. Reagendaré para mañana."
  }'
```

---

## APPOINTMENTS ENDPOINTS

## 4. Get Technician's Appointments (List)

**Endpoint:** `GET /api/technicals/{technicalId}/appointments`

**Autenticación:** No requiere

**Headers:**
```json
{
  "Accept": "application/json"
}
```

**Query Parameters:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `date` | string | Filtrar por fecha (YYYY-MM-DD). Example: `2025-11-30` |
| `status` | string | Filtrar por estado: `scheduled`, `in_progress`, `completed`, `cancelled`, `no_show` |

**Ejemplo Request:**
```bash
GET /api/technicals/3/appointments?date=2025-11-30&status=scheduled
```

**Success Response (200 OK):**
```json
[
  {
    "id": 15,
    "title": "Reparación Router",
    "description": "Revisar y reparar router",
    "address": "Av. Principal 123, Apt 501",
    "scheduled_for": "2025-11-30T10:00:00.000000Z",
    "estimated_duration": 60,
    "estimated_end_time": "2025-11-30T11:00:00.000000Z",
    "status": "scheduled",
    "member_instructions": "Tocar el timbre 2 veces",
    "notes": "Cliente reporta intermitencia",
    "completion_notes": null,
    "started_at": null,
    "completed_at": null,
    "service_rating": null,
    "member_feedback": null,
    "ticket": {
      "id": 82,
      "title": "Router no funciona",
      "status": "in_progress",
      "priority": "high",
      "category": "networking",
      "device": {
        "id": 15,
        "name": "Router TP-Link",
        "ubicacion": "Sala de estar"
      }
    },
    "technical": {
      "id": 3,
      "name": "Carlos Técnico",
      "email": "carlos@technical.com",
      "phone": "+1234567890",
      "photo": "/storage/photos/carlos.jpg"
    },
    "member": {
      "id": 25,
      "name": "María González",
      "email": "maria@example.com",
      "phone": "+0987654321",
      "apartment": {
        "number": "501",
        "building": {
          "name": "Torre A",
          "address": "Av. Principal 123"
        }
      }
    }
  }
]
```

---

## 5. Get Appointment Detail

**Endpoint:** `GET /api/appointments/{appointmentId}/detail`

**Autenticación:** No requiere

**Headers:**
```json
{
  "Accept": "application/json"
}
```

**Success Response (200 OK):**
```json
{
  "appointment": {
    "id": 15,
    "title": "Reparación Router",
    "description": "Revisar y reparar router",
    "address": "Av. Principal 123, Apt 501",
    "scheduled_for": "2025-11-30T10:00:00.000000Z",
    "estimated_duration": 60,
    "estimated_end_time": "2025-11-30T11:00:00.000000Z",
    "status": "scheduled",
    "member_instructions": "Tocar el timbre 2 veces",
    "notes": "Cliente reporta intermitencia",
    "completion_notes": null,
    "started_at": null,
    "completed_at": null,
    "service_rating": null,
    "member_feedback": null,
    "ticket": {
      "id": 82,
      "title": "Router no funciona",
      "status": "in_progress",
      "priority": "high",
      "category": "networking",
      "device": {
        "id": 15,
        "name": "Router TP-Link",
        "ubicacion": "Sala de estar"
      },
      "user": {
        "id": 25,
        "name": "María González",
        "email": "maria@example.com"
      }
    },
    "technical": {
      "id": 3,
      "name": "Carlos Técnico",
      "email": "carlos@technical.com",
      "phone": "+1234567890",
      "photo": "/storage/photos/carlos.jpg"
    },
    "member": {
      "id": 25,
      "name": "María González",
      "email": "maria@example.com",
      "phone": "+0987654321",
      "apartment": {
        "number": "501",
        "building": {
          "name": "Torre A",
          "address": "Av. Principal 123"
        }
      }
    }
  }
}
```

---

## 6. Create Appointment

**Endpoint:** `POST /api/tickets/{ticketId}/appointments/create`

**Autenticación:** Bearer Token (Sanctum)

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `technical_id` | integer | **Sí** | ID del técnico asignado |
| `title` | string | **Sí** | Título de la cita (máx. 255 caracteres) |
| `description` | string | No | Descripción de la cita |
| `address` | string | No | Dirección donde se realizará la cita |
| `scheduled_for` | string (datetime) | **Sí** | Fecha/hora programada (ISO 8601, cualquier fecha) |
| `estimated_duration` | integer | **Sí** | Duración estimada en minutos (30-480) |
| `member_instructions` | string | No | Instrucciones para el miembro |
| `notes` | string | No | Notas internas del técnico |

**Ejemplo Request:**
```json
{
  "technical_id": 3,
  "title": "Visita técnica - Router no funciona",
  "description": "Revisión presencial del router en el apartamento",
  "address": "Av. Principal 123, Apt 501",
  "scheduled_for": "2025-11-30T10:00:00",
  "estimated_duration": 60,
  "member_instructions": "Por favor, asegúrese de estar disponible en el horario acordado",
  "notes": "Cliente reporta intermitencia frecuente"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "appointment": {
    "id": 15,
    "ticket_id": 82,
    "technical_id": 3,
    "title": "Visita técnica - Router no funciona",
    "scheduled_for": "2025-11-30T10:00:00.000000Z",
    "estimated_duration": 60,
    "status": "scheduled"
  }
}
```

**Error Responses:**

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You can only create appointments for tickets assigned to you"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Cannot schedule an appointment for this ticket in its current state"
}
```

**422 Validation Error:**
```json
{
  "success": false,
  "message": "The technician already has an appointment scheduled at this time"
}
```

```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "title": ["The title field is required."],
    "estimated_duration": ["The estimated duration field must be at least 30."]
  }
}
```

---

## 7. Start Appointment

**Endpoint:** `POST /api/appointments/{appointmentId}/start`

**Autenticación:** Bearer Token (Sanctum)

**Headers:**
```json
{
  "Authorization": "Bearer {token}",
  "Accept": "application/json"
}
```

**Body:** Vacío (no requiere parámetros)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Appointment started successfully",
  "appointment": {
    "id": 15,
    "status": "in_progress",
    "started_at": "2025-11-30T10:05:00.000000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Cannot start this appointment at this time. The appointment must be scheduled and within 15 minutes of the scheduled time."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You can only start appointments assigned to you"
}
```

---

## 8. Complete Appointment

**Endpoint:** `POST /api/appointments/{appointmentId}/complete`

**Autenticación:** Bearer Token (Sanctum)

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `completion_notes` | string | **Sí** | Notas de completación (máx. 1000 caracteres) |

**Ejemplo Request:**
```json
{
  "completion_notes": "Router reemplazado y configurado. WiFi funcionando correctamente. Se entregó recibo al cliente."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Visit completed successfully. Member will provide feedback.",
  "appointment": {
    "id": 15,
    "status": "awaiting_feedback",
    "completed_at": "2025-11-30T11:30:00.000000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Cannot complete this appointment in its current state. The appointment must be in progress."
}
```

---

## 9. Cancel Appointment

**Endpoint:** `POST /api/appointments/{appointmentId}/cancel`

**Autenticación:** Bearer Token (Sanctum)

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reason` | string | **Sí** | Razón de la cancelación (máx. 500 caracteres) |

**Ejemplo Request:**
```json
{
  "reason": "Cliente solicitó cancelar la cita por emergencia familiar"
}
```

**Success Response (200 OK):**
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

---

## 10. Reschedule Appointment

**Endpoint:** `POST /api/appointments/{appointmentId}/reschedule`

**Autenticación:** Bearer Token (Sanctum)

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `new_scheduled_for` | string (datetime) | **Sí** | Nueva fecha/hora (ISO 8601) |
| `reason` | string | No | Razón del reagendamiento (máx. 500 caracteres) |

**Ejemplo Request:**
```json
{
  "new_scheduled_for": "2025-12-01T14:00:00",
  "reason": "Cliente no estará disponible mañana en la mañana"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "appointment": {
    "id": 15,
    "status": "scheduled",
    "old_scheduled_for": "2025-11-30T10:00:00.000000Z",
    "new_scheduled_for": "2025-12-01T14:00:00.000000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Cannot reschedule this appointment in its current state."
}
```

---

## 11. Mark as No Show

**Endpoint:** `POST /api/appointments/{appointmentId}/no-show`

**Autenticación:** Bearer Token (Sanctum)

**Body Parameters:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `reason` | string | **Sí** | Razón del no show (máx. 255 caracteres) |
| `description` | string | No | Descripción adicional (máx. 500 caracteres) |

**Valores sugeridos para `reason`:**
- `member_not_home` - Member Not Home
- `no_response` - No Response
- `refused_service` - Refused Service
- `wrong_time` - Wrong Time
- `emergency` - Member Emergency
- `technical_issue` - Technical Issue
- `weather` - Weather Conditions
- `other` - Other

**Ejemplo Request:**
```json
{
  "reason": "member_not_home",
  "description": "Toqué el timbre 3 veces y llamé 2 veces. Sin respuesta."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Appointment marked as No Show successfully",
  "appointment": {
    "id": 15,
    "status": "no_show",
    "no_show_reason": "member_not_home"
  }
}
```

---

## APPOINTMENTS ENDPOINTS

---

## AUTHENTICATION

### Token de Autenticación

El token se obtiene del endpoint de login:
```
POST /api/auth/login
```

Y debe incluirse en todas las peticiones autenticadas como:
```
Authorization: Bearer {token}
```

---

## ERROR HANDLING

### Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 400 | Bad Request - Error de lógica de negocio |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 422 | Validation Error - Error de validación |
| 500 | Internal Server Error - Error del servidor |

### Estructura de Respuestas de Error

**Validation Error (422):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

**Business Logic Error (400/403):**
```json
{
  "success": false,
  "message": "Cannot perform this action at this time"
}
```

---

## MOBILE IMPLEMENTATION EXAMPLES

### Complete Appointment Workflow in React Native

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://adkassist.com/api';

// Get auth token from storage
const getAuthToken = async () => {
  return await AsyncStorage.getItem('auth_token');
};

// 1. Get Today's Appointments
const getTodayAppointments = async (technicalId: number) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  const response = await fetch(
    `${API_BASE_URL}/technicals/${technicalId}/appointments?date=${today}&status=scheduled`,
    {
      headers: { 'Accept': 'application/json' }
    }
  );
  
  const appointments = await response.json();
  return appointments;
};

// 2. Create New Appointment
const createAppointment = async (
  ticketId: number,
  appointmentData: {
    technical_id: number;
    title: string;
    description?: string;
    address?: string;
    scheduled_for: string; // ISO 8601
    estimated_duration: number;
    member_instructions?: string;
    notes?: string;
  }
) => {
  const token = await getAuthToken();
  
  const response = await fetch(
    `${API_BASE_URL}/tickets/${ticketId}/appointments/create`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// 3. Start Appointment
const startAppointment = async (appointmentId: number) => {
  const token = await getAuthToken();
  
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/start`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// 4. Complete Appointment
const completeAppointment = async (
  appointmentId: number,
  completionNotes: string
) => {
  const token = await getAuthToken();
  
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/complete`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ completion_notes: completionNotes })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// 5. Mark as No Show
const markNoShow = async (
  appointmentId: number,
  reason: string,
  description?: string
) => {
  const token = await getAuthToken();
  
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/no-show`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ reason, description })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// 6. Reschedule Appointment
const rescheduleAppointment = async (
  appointmentId: number,
  newScheduledFor: string, // ISO 8601
  reason?: string
) => {
  const token = await getAuthToken();
  
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/reschedule`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ new_scheduled_for: newScheduledFor, reason })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// 7. Cancel Appointment
const cancelAppointment = async (
  appointmentId: number,
  reason: string
) => {
  const token = await getAuthToken();
  
  const response = await fetch(
    `${API_BASE_URL}/appointments/${appointmentId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ reason })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// Example: Full Appointment Flow in Component
const AppointmentDetailScreen = ({ appointmentId }) => {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStartAppointment = async () => {
    try {
      setLoading(true);
      const result = await startAppointment(appointmentId);
      Alert.alert('Success', 'Appointment started successfully');
      // Refresh appointment data
      await loadAppointmentDetail();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAppointment = async () => {
    // Show modal to get completion notes
    Alert.prompt(
      'Complete Appointment',
      'Enter completion notes:',
      async (notes) => {
        if (!notes.trim()) {
          Alert.alert('Error', 'Completion notes are required');
          return;
        }
        
        try {
          setLoading(true);
          const result = await completeAppointment(appointmentId, notes);
          Alert.alert('Success', result.message);
          // Navigate back to appointments list
        } catch (error) {
          Alert.alert('Error', error.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleNoShow = async () => {
    // Show picker for reason
    const reasons = [
      { label: 'Member Not Home', value: 'member_not_home' },
      { label: 'No Response', value: 'no_response' },
      { label: 'Refused Service', value: 'refused_service' },
      { label: 'Wrong Time', value: 'wrong_time' },
      { label: 'Other', value: 'other' }
    ];
    
    // After user selects reason and enters description
    try {
      setLoading(true);
      const result = await markNoShow(
        appointmentId,
        selectedReason,
        description
      );
      Alert.alert('Success', 'Appointment marked as No Show');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Appointment details UI */}
      
      {/* Action buttons based on status */}
      {appointment?.status === 'scheduled' && (
        <>
          <Button
            title="Start Appointment"
            onPress={handleStartAppointment}
            disabled={loading}
          />
          <Button
            title="Mark as No Show"
            onPress={handleNoShow}
            disabled={loading}
          />
        </>
      )}
      
      {appointment?.status === 'in_progress' && (
        <Button
          title="Complete Appointment"
          onPress={handleCompleteAppointment}
          disabled={loading}
        />
      )}
    </View>
  );
};
```

### Creating Appointment with Date Picker

```typescript
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateAppointmentScreen = ({ ticketId }) => {
  const [formData, setFormData] = useState({
    technical_id: 3,
    title: '',
    description: '',
    address: '',
    scheduled_for: new Date(),
    estimated_duration: 60,
    member_instructions: '',
    notes: ''
  });

  const handleCreate = async () => {
    try {
      // Convert date to ISO 8601 string
      const scheduledForISO = formData.scheduled_for.toISOString();
      
      const result = await createAppointment(ticketId, {
        ...formData,
        scheduled_for: scheduledForISO
      });
      
      Alert.alert('Success', 'Appointment created successfully');
      // Navigate back or refresh
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView>
      <TextInput
        placeholder="Title"
        value={formData.title}
        onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
      />
      
      <DateTimePicker
        value={formData.scheduled_for}
        mode="datetime"
        onChange={(event, date) => {
          if (date) {
            setFormData(prev => ({ ...prev, scheduled_for: date }));
          }
        }}
        minimumDate={new Date()} // Prevent past dates
      />
      
      <TextInput
        placeholder="Address"
        value={formData.address}
        onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
      />
      
      <TextInput
        placeholder="Duration (minutes)"
        keyboardType="numeric"
        value={String(formData.estimated_duration)}
        onChangeText={(text) => setFormData(prev => ({ 
          ...prev, 
          estimated_duration: parseInt(text) || 60 
        }))}
      />
      
      <TextInput
        placeholder="Member Instructions"
        multiline
        value={formData.member_instructions}
        onChangeText={(text) => setFormData(prev => ({ 
          ...prev, 
          member_instructions: text 
        }))}
      />
      
      <Button title="Create Appointment" onPress={handleCreate} />
    </ScrollView>
  );
};
```

---

## UI/UX RECOMMENDATIONS

### Appointment Status Colors

```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled':
      return '#3B82F6'; // Blue
    case 'in_progress':
      return '#F59E0B'; // Amber
    case 'completed':
      return '#10B981'; // Green
    case 'awaiting_feedback':
      return '#8B5CF6'; // Purple
    case 'cancelled':
      return '#6B7280'; // Gray
    case 'no_show':
      return '#EF4444'; // Red
    default:
      return '#6B7280';
  }
};
```

### Time Constraint Validation (Client-Side)

```typescript
// Check if appointment can be started (within 15 minutes)
const canStartAppointment = (scheduledFor: string): boolean => {
  const scheduled = new Date(scheduledFor);
  const now = new Date();
  const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000);
  
  return scheduled <= fifteenMinutesFromNow && scheduled >= now;
};

// Show countdown timer until appointment can be started
const TimeUntilStartable = ({ scheduledFor }) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      const scheduled = new Date(scheduledFor);
      const fifteenMinsBefore = new Date(scheduled.getTime() - 15 * 60000);
      const now = new Date();
      
      if (now >= fifteenMinsBefore) {
        setTimeLeft('Can start now!');
      } else {
        const diff = fifteenMinsBefore.getTime() - now.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        setTimeLeft(`Available in ${hours}h ${minutes}m`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [scheduledFor]);
  
  return <Text>{timeLeft}</Text>;
};
```

---

## Flujo de Trabajo Appointments en App Móvil

### 1. Ver Lista de Appointments

```typescript
const getAppointments = async (technicalId: number, date?: string, status?: string) => {
  let url = `https://adkassist.com/api/technicals/${technicalId}/appointments`;
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (status) params.append('status', status);
  if (params.toString()) url += `?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  
  return await response.json();
};
```

### 2. Ver Detalle de Appointment

```typescript
const getAppointmentDetail = async (appointmentId: number) => {
  const response = await fetch(`https://adkassist.com/api/appointments/${appointmentId}/detail`, {
    headers: { 'Accept': 'application/json' }
  });
  
  const data = await response.json();
  return data.appointment;
};
```

---

---

## APPOINTMENT STATUS FLOW

| Current Status | Available Actions |
|----------------|-------------------|
| `scheduled` | Start, Cancel, Reschedule, Mark No Show |
| `in_progress` | Complete, Cancel, Mark No Show |
| `awaiting_feedback` | None (waiting for member) |
| `completed` | None (final state) |
| `cancelled` | None (final state) |
| `no_show` | Reschedule |

---

## PERMISSIONS

### Quién puede usar estos endpoints:

**Tickets:**
- ✅ Técnico asignado al ticket
- ✅ Técnicos con flag `is_default = true`
- ❌ Otros técnicos
- ❌ Usuarios no técnicos

**Appointments:**
- ✅ Técnico asignado a la cita
- ✅ Técnicos con flag `is_default = true` (pueden ver y gestionar todas las citas)
- ❌ Otros técnicos
- ❌ Usuarios no técnicos

**View Endpoints (Detail/List):**
- ✅ Cualquier técnico (no requiere autenticación)

---

## LOGS Y DEBUGGING

Logs en `/var/www/laravel/storage/logs/laravel.log`:

**Tickets:**
- `🔧 Resolve ticket endpoint called`
- `💬 Add comment endpoint called`
- `✅ Ticket resolved successfully`
- `✅ Comment added successfully`

**Appointments:**
- `📅 Create appointment endpoint called`
- `📅 Get appointments endpoint called`
- `▶️ Start appointment endpoint called`
- `✅ Complete appointment endpoint called`
- `❌ Cancel appointment endpoint called`
- `🔄 Reschedule appointment endpoint called`
- `⚠️ Mark no-show endpoint called`

---

## TESTING CON POSTMAN/CURL

### Ejemplo cURL - Create Appointment:

```bash
curl -X POST https://adkassist.com/api/tickets/82/appointments/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "technical_id": 3,
    "title": "Visita técnica - Router no funciona",
    "description": "Revisión presencial del router",
    "address": "Av. Principal 123, Apt 501",
    "scheduled_for": "2025-12-01T10:00:00",
    "estimated_duration": 60,
    "member_instructions": "Tocar timbre 2 veces",
    "notes": "Cliente reporta intermitencia"
  }'
```

### Ejemplo cURL - Resolver Ticket:

```bash
curl -X POST https://adkassist.com/api/tickets/82/resolve \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "resolution_notes": "Router reemplazado y configurado correctamente",
    "evidence_base64": "/9j/4AAQSkZJRg...",
    "file_name": "router_fixed.jpg",
    "file_type": "image/jpeg",
    "file_size": 245678
  }'
```

### Ejemplo cURL - Start Appointment:

```bash
curl -X POST https://adkassist.com/api/appointments/15/start \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Accept: application/json"
```

---

## SUMMARY - ALL ENDPOINTS

### Tickets (3 endpoints)
1. ✅ `GET /api/tickets/{id}/detail` - Get ticket detail with attachments
2. ✅ `POST /api/tickets/{id}/resolve` - Resolve ticket with optional evidence
3. ✅ `POST /api/tickets/{id}/comment` - Add comment to ticket

### Appointments (8 endpoints)
1. ✅ `GET /api/technicals/{id}/appointments` - List technician's appointments
2. ✅ `GET /api/appointments/{id}/detail` - Get appointment detail
3. ✅ `POST /api/tickets/{id}/appointments/create` - **NEW** Create appointment
4. ✅ `POST /api/appointments/{id}/start` - Start appointment
5. ✅ `POST /api/appointments/{id}/complete` - Complete appointment
6. ✅ `POST /api/appointments/{id}/cancel` - Cancel appointment
7. ✅ `POST /api/appointments/{id}/reschedule` - Reschedule appointment
8. ✅ `POST /api/appointments/{id}/no-show` - Mark as no show

**Total: 11 endpoints completos y documentados**

---

## CAMBIOS RECIENTES (30 Nov 2025)

### ✅ Nuevo Endpoint Agregado:
- **POST /api/tickets/{ticketId}/appointments/create** - Crear nuevas citas desde la app móvil

### ✅ Funcionalidades Completas:
1. CRUD completo de appointments para app móvil
2. Validación de conflictos de horario
3. Validación de permisos (técnico asignado o is_default)
4. Restricción de tiempo: appointments solo pueden iniciarse dentro de 15 minutos
5. Soporte para técnicos con `is_default = true` (ven y gestionan todas las citas)
6. Notificaciones automáticas cuando se crea una cita

### 📱 Listo para Implementación Móvil:
- Todos los endpoints probados y funcionando
- Documentación completa con ejemplos en TypeScript/React Native
- Manejo de errores en inglés
- Validaciones del lado del servidor
- Logs detallados para debugging

---

## SOPORTE

Para dudas o problemas con la API, revisar:
1. Logs del servidor: `/var/www/laravel/storage/logs/laravel.log`
2. Esta documentación
3. Contactar al backend developer

---

## PRÓXIMOS PASOS PARA EL DESARROLLADOR MÓVIL

1. **Implementar pantalla de lista de citas** con filtros por fecha y estado
2. **Implementar pantalla de detalle de cita** con información completa
3. **Implementar pantalla de crear cita** con validación de fecha/hora futura
4. **Agregar botones de acción** según el estado de la cita (Start, Complete, Cancel, etc.)
5. **Implementar validación de 15 minutos** del lado del cliente con countdown timer
6. **Mostrar indicador visual** de tiempo hasta que la cita pueda iniciarse
7. **Implementar manejo de errores** con mensajes claros al usuario
8. **Agregar confirmaciones** antes de acciones irreversibles (Cancel, No Show)
9. **Implementar refresh automático** de la lista después de cada acción
10. **Agregar notificaciones push** cuando se crea/modifica una cita

**¡La API está completa y lista para usar! 🚀**
