# Mobile Technical API Documentation

## Nuevos Endpoints para App Móvil (Técnicos)

### Base URL
```
https://adkassist.com/api
```

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

## 7. Obtener Appointments de un Técnico

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
| `date` | string | Filtrar por fecha (YYYY-MM-DD) |
| `status` | string | Filtrar por estado (scheduled, in_progress, completed, cancelled, no_show) |

**Ejemplo Request:**
```
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

## 8. Obtener Detalle de Appointment

**Endpoint:** `GET /api/appointments/{appointmentId}/detail`

**Autenticación:** No requiere

**Headers:**
```json
{
  "Accept": "application/json"
}
```

**Success Response:** Igual estructura que el array anterior pero dentro de objeto `{ "appointment": {...} }`

---

## 9. Iniciar Appointment (Start)

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

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You can only start appointments assigned to you"
}
```

---

## 10. Completar Appointment (Complete)

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

---

## 11. Cancelar Appointment

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

## 12. Reagendar Appointment

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

---

## 13. Marcar como No Show

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

### 3. Flujo Completo de Visita

```typescript
// 1. Técnico llega y empieza la cita
const startAppointment = async (appointmentId: number, token: string) => {
  const response = await fetch(`https://adkassist.com/api/appointments/${appointmentId}/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  return await response.json();
};

// 2. Técnico completa el trabajo
const completeAppointment = async (appointmentId: number, notes: string, token: string) => {
  const response = await fetch(`https://adkassist.com/api/appointments/${appointmentId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ completion_notes: notes })
  });
  
  return await response.json();
};

// 3. Si cliente no está: marcar como no show
const markNoShow = async (appointmentId: number, reason: string, description: string, token: string) => {
  const response = await fetch(`https://adkassist.com/api/appointments/${appointmentId}/no-show`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ reason, description })
  });
  
  return await response.json();
};
```

---

## Estados de Appointments

| Estado | Descripción | Acciones Disponibles |
|--------|-------------|---------------------|
| `scheduled` | Agendado | Start, Cancel, Reschedule, No Show |
| `in_progress` | En progreso | Complete, Cancel, No Show |
| `awaiting_feedback` | Esperando feedback del cliente | - |
| `completed` | Completado con feedback | - |
| `cancelled` | Cancelado | - |
| `no_show` | Cliente no se presentó | Reschedule |

---

## Logs y Debugging

Logs de appointments en `/var/www/laravel/storage/logs/laravel.log`:

- `📅 Get appointments endpoint called`
- `▶️ Start appointment endpoint called`
- `✅ Complete appointment endpoint called`
- `❌ Cancel appointment endpoint called`
- `🔄 Reschedule appointment endpoint called`
- `⚠️ Mark no-show endpoint called`

---

## Cambios Recientes (30 Nov 2025)

### ✅ Agregado:
1. Endpoints completos de appointments para app móvil
2. Funcionalidad de start, complete, cancel, reschedule y no-show
3. Filtros por fecha y status en listado de appointments
4. Validación de permisos (solo técnico asignado o is_default)
5. Soporte para técnicos con `is_default = true` (ven y gestionan todos los appointments)

---

## Logs y Debugging

El backend registra todas las operaciones en `/var/www/laravel/storage/logs/laravel.log`:

- `🔧 Resolve ticket endpoint called` - Cuando se llama al endpoint de resolver
- `💬 Add comment endpoint called` - Cuando se llama al endpoint de comentario
- `✅ Ticket resolved successfully` - Resolución exitosa
- `✅ Comment added successfully` - Comentario agregado
- `❌ Error resolving ticket` - Error en resolución
- `❌ Error adding comment` - Error en comentario

---

## Cambios Recientes (29 Nov 2025)

### ✅ Corregidos:
1. Campo `attachments` ahora usa `file_path` en lugar de `path`
2. Campo `attachments` ahora usa `file_size` en lugar de `size`
3. Endpoint `/api/tickets/{id}/detail` ahora devuelve array `attachments`

### ⚠️ IMPORTANTE para desarrollador móvil:
- Los attachments antiguos (creados antes de hoy) pueden tener campo `path` en lugar de `file_path`
- Manejar ambos casos en el código móvil:
```typescript
const filePath = attachment.file_path || attachment.path;
const fileSize = attachment.file_size || attachment.size;
```

---

## Soporte

Para dudas o problemas con la API, contactar al backend developer o revisar los logs del servidor.
