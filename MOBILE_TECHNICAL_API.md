# Mobile Technical API Documentation

## Nuevos Endpoints para App Móvil (Técnicos)

### Base URL
```
https://adkassist.com/api
```

---

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
