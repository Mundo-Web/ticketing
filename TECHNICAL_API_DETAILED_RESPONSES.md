# 📱 API REFERENCE - Respuestas Detalladas para Mobile Developer

> Documentación completa con ejemplos **REALES** de cada respuesta API

## 📑 Índice

1. [Autenticación](#autenticación)
2. [Técnicos](#técnicos)
3. [Tickets](#tickets)
4. [Appointments](#appointments)
5. [Notificaciones](#notificaciones)
6. [Códigos de Error](#códigos-de-error)

---

## 🔐 AUTENTICACIÓN

### 1. Login

**Endpoint**: `POST /api/tenant/login`

**Request**:
```json
{
  "email": "technical@example.com",
  "password": "password123"
}
```

**Response Success (Técnico Regular)**:
```json
{
  "user": {
    "id": 5,
    "name": "Juan Pérez",
    "email": "technical@example.com",
    "roles": ["technical"],
    "technical_id": 2
  },
  "token": "1|abc123xyz789def456ghi012jkl345mno678pqr901stu234vwx567yza890bcd123",
  "technical": {
    "id": 2,
    "name": "Juan Pérez",
    "email": "technical@example.com",
    "phone": "+51987654321",
    "photo": "/storage/technicals/juan_perez.jpg",
    "is_default": false,
    "shift": "morning",
    "status": true
  }
}
```

**Response Success (Técnico Jefe)**:
```json
{
  "user": {
    "id": 3,
    "name": "Pedro García",
    "email": "chief@example.com",
    "roles": ["technical"],
    "technical_id": 1
  },
  "token": "3|xyz789def456ghi012jkl345mno678pqr901stu234vwx567yza890bcd123efg456",
  "technical": {
    "id": 1,
    "name": "Pedro García",
    "email": "chief@example.com",
    "phone": "+51912345678",
    "photo": "/storage/technicals/pedro_garcia.jpg",
    "is_default": true,
    "shift": "full_day",
    "status": true
  }
}
```

**Response Success (Member - para comparación)**:
```json
{
  "user": {
    "id": 10,
    "name": "María García",
    "email": "member@example.com",
    "roles": ["member"],
    "tenant_id": 15
  },
  "token": "2|def456uvw789xyz012abc345def678ghi901jkl234mno567pqr890stu123vwx456",
  "tenant": {
    "id": 15,
    "name": "María García",
    "email": "member@example.com",
    "phone": "+51998765432",
    "photo": "/storage/tenants/maria_garcia.jpg",
    "apartment_id": 101
  }
}
```

**Response Error (Credenciales incorrectas)**:
```json
{
  "message": "The provided credentials are incorrect.",
  "errors": {
    "email": ["The provided credentials are incorrect."]
  }
}
```
**Status**: `422 Unprocessable Entity`

**Response Error (No es member ni technical)**:
```json
{
  "message": "Access denied. Not a valid mobile account.",
  "errors": {
    "email": ["Access denied. Not a valid mobile account."]
  }
}
```
**Status**: `422 Unprocessable Entity`

**Response Error (Perfil de técnico no encontrado)**:
```json
{
  "message": "Technical profile not found.",
  "errors": {
    "email": ["Technical profile not found."]
  }
}
```
**Status**: `422 Unprocessable Entity`

---

### 2. Logout

**Endpoint**: `POST /api/tenant/logout`

**Headers**:
```
Authorization: Bearer {token}
```

**Response Success**:
```json
{
  "message": "Successfully logged out"
}
```
**Status**: `200 OK`

---

## 👨‍🔧 TÉCNICOS

### 1. Listar Todos los Técnicos

**Endpoint**: `GET /api/technicals`

**Headers**: No requiere autenticación

**Response Success**:
```json
{
  "technicals": [
    {
      "id": 1,
      "name": "Pedro García",
      "email": "chief@example.com",
      "photo": "/storage/technicals/pedro_garcia.jpg",
      "shift": "full_day",
      "status": true,
      "is_default": true
    },
    {
      "id": 2,
      "name": "Juan Pérez",
      "email": "technical@example.com",
      "photo": "/storage/technicals/juan_perez.jpg",
      "shift": "morning",
      "status": true,
      "is_default": false
    },
    {
      "id": 3,
      "name": "Carlos López",
      "email": "carlos@example.com",
      "photo": null,
      "shift": "afternoon",
      "status": true,
      "is_default": false
    }
  ]
}
```
**Status**: `200 OK`

**Campos**:
- `id`: ID del técnico
- `name`: Nombre completo
- `email`: Email
- `photo`: Ruta de la foto (puede ser `null`)
- `shift`: Turno (`morning`, `afternoon`, `full_day`)
- `status`: Activo (`true`) o Inactivo (`false`)
- `is_default`: `true` = Jefe, `false` = Regular

---

### 2. Obtener Tickets de un Técnico

**Endpoint**: `GET /api/technicals/{technical_id}/tickets?type={type}`

**Query Parameters**:
- `type` (opcional): `all`, `today`, `week`, `month`, `open`, `in_progress`, `resolved`, `closed`, `recent`

**Ejemplo**: `GET /api/technicals/2/tickets?type=today`

**Response Success**:
```json
[
  {
    "id": 123,
    "title": "Laptop no enciende",
    "status": "in_progress",
    "priority": "high",
    "created_at": "2024-01-15T10:30:00.000000Z",
    "building_id": 5,
    "device_id": 42,
    "apartment_id": 101,
    "building": {
      "id": 5,
      "name": "Edificio Central"
    },
    "device": {
      "id": 42,
      "name": "Laptop Dell Latitude"
    },
    "apartment": {
      "id": 101,
      "number": "301"
    }
  },
  {
    "id": 124,
    "title": "Impresora no imprime",
    "status": "open",
    "priority": "medium",
    "created_at": "2024-01-15T14:20:00.000000Z",
    "building_id": 5,
    "device_id": 45,
    "apartment_id": 102,
    "building": {
      "id": 5,
      "name": "Edificio Central"
    },
    "device": {
      "id": 45,
      "name": "Impresora HP LaserJet"
    },
    "apartment": {
      "id": 102,
      "number": "302"
    }
  }
]
```
**Status**: `200 OK`

**Nota**: El array puede estar vacío `[]` si no hay tickets.

---

### 3. Obtener Detalle de un Ticket

**Endpoint**: `GET /api/tickets/{ticket_id}/detail`

**Ejemplo**: `GET /api/tickets/123/detail`

**Response Success**:
```json
{
  "id": 123,
  "code": "TCK-00123",
  "title": "Laptop no enciende",
  "description": "La laptop no responde al presionar el botón de encendido. Ya intenté conectarla a diferentes tomas de corriente.",
  "status": "in_progress",
  "priority": "high",
  "category": "Hardware",
  "source": "mobile",
  "created_at": "2024-01-15T10:30:00.000000Z",
  "updated_at": "2024-01-15T11:00:00.000000Z",
  "resolved_at": null,
  "closed_at": null,
  "building": {
    "id": 5,
    "name": "Edificio Central",
    "address": "Av. Principal 123, Lima"
  },
  "device": {
    "id": 42,
    "name": "Laptop Dell Latitude",
    "brand": {
      "id": 3,
      "name": "Dell"
    },
    "model": {
      "id": 15,
      "name": "Latitude 5420"
    }
  },
  "apartment": {
    "id": 101,
    "number": "301"
  },
  "tenant": {
    "id": 50,
    "name": "María García",
    "email": "maria@example.com",
    "phone": "+51998765432"
  },
  "history": [
    {
      "id": 456,
      "action": "status_updated",
      "description": "Status updated to in_progress by Juan Pérez",
      "created_at": "2024-01-15T11:00:00.000000Z",
      "user": {
        "id": 5,
        "name": "Juan Pérez"
      }
    },
    {
      "id": 455,
      "action": "technical_assigned",
      "description": "Ticket assigned to Juan Pérez",
      "created_at": "2024-01-15T10:35:00.000000Z",
      "user": {
        "id": 1,
        "name": "Admin"
      }
    },
    {
      "id": 454,
      "action": "created",
      "description": "Ticket created by María García",
      "created_at": "2024-01-15T10:30:00.000000Z",
      "user": {
        "id": 50,
        "name": "María García"
      }
    }
  ],
  "comments": []
}
```
**Status**: `200 OK`

**Si el ticket está resuelto**, incluye:
```json
{
  "id": 125,
  "status": "resolved",
  "resolved_at": "2024-01-15T16:00:00.000000Z",
  "resolution_time": 5,
  "rating": 5,
  "feedback": "Excellent technical support."
}
```

**Response Error (Ticket no encontrado)**:
```json
{
  "message": "No query results for model [App\\Models\\Ticket] 999"
}
```
**Status**: `404 Not Found`

---

### 4. Obtener Citas de un Técnico

**Endpoint**: `GET /api/technicals/{technical_id}/appointments?date={YYYY-MM-DD}`

**Query Parameters**:
- `date` (opcional): Fecha en formato `YYYY-MM-DD`. Si no se proporciona, retorna todas las citas.

**Ejemplo**: `GET /api/technicals/2/appointments?date=2024-01-15`

**Response Success**:
```json
[
  {
    "id": 45,
    "ticket_id": 123,
    "technical_id": 2,
    "scheduled_for": "2024-01-15T14:00:00.000000Z",
    "estimated_duration": 60,
    "status": "scheduled",
    "started_at": null,
    "completed_at": null,
    "completion_notes": null,
    "member_rating": null,
    "member_feedback": null,
    "no_show_reason": null,
    "no_show_description": null,
    "ticket": {
      "id": 123,
      "title": "Laptop no enciende",
      "status": "in_progress",
      "priority": "high",
      "user_id": 50,
      "device_id": 42,
      "device": {
        "id": 42,
        "name": "Laptop Dell Latitude"
      },
      "apartment": {
        "id": 101,
        "number": "301",
        "building_id": 5,
        "building": {
          "id": 5,
          "name": "Edificio Central",
          "address": "Av. Principal 123, Lima"
        }
      },
      "user": {
        "id": 50,
        "name": "María García",
        "email": "maria@example.com",
        "tenant": {
          "user_id": 50,
          "phone": "+51998765432"
        }
      }
    },
    "tenant": {
      "id": 50,
      "name": "María García",
      "email": "maria@example.com",
      "phone": "+51998765432"
    }
  },
  {
    "id": 46,
    "ticket_id": 124,
    "technical_id": 2,
    "scheduled_for": "2024-01-15T16:30:00.000000Z",
    "estimated_duration": 45,
    "status": "in_progress",
    "started_at": "2024-01-15T16:32:00.000000Z",
    "completed_at": null,
    "completion_notes": null,
    "member_rating": null,
    "member_feedback": null,
    "no_show_reason": null,
    "no_show_description": null,
    "ticket": {
      "id": 124,
      "title": "Impresora no imprime",
      "status": "in_progress",
      "priority": "medium",
      "user_id": 51,
      "device_id": 45,
      "device": {
        "id": 45,
        "name": "Impresora HP LaserJet"
      },
      "apartment": {
        "id": 102,
        "number": "302",
        "building_id": 5,
        "building": {
          "id": 5,
          "name": "Edificio Central",
          "address": "Av. Principal 123, Lima"
        }
      },
      "user": {
        "id": 51,
        "name": "Carlos Rodríguez",
        "email": "carlos@example.com",
        "tenant": {
          "user_id": 51,
          "phone": "+51987654321"
        }
      }
    },
    "tenant": {
      "id": 51,
      "name": "Carlos Rodríguez",
      "email": "carlos@example.com",
      "phone": "+51987654321"
    }
  }
]
```
**Status**: `200 OK`

**Estados posibles de Appointment**:
- `scheduled` - Programada
- `in_progress` - En progreso (técnico llegó)
- `awaiting_feedback` - Esperando feedback del member
- `completed` - Completada (con feedback)
- `cancelled` - Cancelada
- `no_show` - No se presentó

---

## 🎫 TICKETS

### 1. Actualizar Estado de Ticket

**Endpoint**: `POST /api/tickets/{ticket_id}/update-status`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "status": "in_progress"
}
```

**Valores válidos para `status`**:
- `open`
- `in_progress`
- `resolved`
- `closed`
- `cancelled`

**Response Success**:
```json
{
  "success": true
}
```
**Status**: `200 OK`

**Response Error (No autorizado)**:
```json
{
  "message": "Unauthenticated."
}
```
**Status**: `401 Unauthorized`

---

### 2. Agregar al Historial

**Endpoint**: `POST /api/tickets/{ticket_id}/add-history`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "action": "comment",
  "description": "Revisé el equipo, parece ser problema de batería. Programaré visita para reemplazo."
}
```

**Response Success**:
```json
{
  "success": true,
  "message": "History entry added successfully"
}
```
**Status**: `200 OK`

---

### 3. Subir Evidencia (Foto/Video)

**Endpoint**: `POST /api/tickets/{ticket_id}/upload-evidence`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request (FormData)**:
```
evidence: [File] (archivo de imagen o video)
description: "Foto del problema detectado en la batería" (opcional)
```

**Formatos permitidos**:
- Imágenes: `jpg`, `jpeg`, `png`, `gif`
- Videos: `mp4`, `mov`, `avi`
- Tamaño máximo: **10MB**

**Response Success**:
```json
{
  "success": true,
  "message": "Evidence uploaded successfully",
  "file_path": "ticket_evidence/1705318200_problema_bateria.jpg",
  "file_name": "1705318200_problema_bateria.jpg"
}
```
**Status**: `200 OK`

**Response Error (Archivo muy grande)**:
```json
{
  "message": "The evidence must not be greater than 10240 kilobytes.",
  "errors": {
    "evidence": ["The evidence must not be greater than 10240 kilobytes."]
  }
}
```
**Status**: `422 Unprocessable Entity`

**Response Error (Formato no permitido)**:
```json
{
  "message": "The evidence must be a file of type: jpg, jpeg, png, gif, mp4, mov, avi.",
  "errors": {
    "evidence": ["The evidence must be a file of type: jpg, jpeg, png, gif, mp4, mov, avi."]
  }
}
```
**Status**: `422 Unprocessable Entity`

**Response Error (No autorizado - no es el técnico asignado)**:
```json
{
  "message": "You can only upload evidence to tickets assigned to you."
}
```
**Status**: `403 Forbidden`

---

### 4. Agregar Nota Privada

**Endpoint**: `POST /api/tickets/{ticket_id}/add-private-note`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "note": "El cliente mencionó que el problema empezó después de una actualización de Windows. Revisar drivers."
}
```

**Nota**: Las notas privadas **solo son visibles para técnicos y administradores**. Los members NO las ven.

**Response Success**:
```json
{
  "success": true,
  "message": "Private note added successfully"
}
```
**Status**: `200 OK`

**Response Error (No es técnico)**:
```json
{
  "message": "Only technicians can add private notes."
}
```
**Status**: `403 Forbidden`

---

### 5. Enviar Mensaje al Member

**Endpoint**: `POST /api/tickets/{ticket_id}/send-message-to-technical`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "message": "Hola María, necesito que me confirmes si la laptop tiene garantía vigente. Gracias."
}
```

**Nota**: A pesar del nombre del endpoint, este envía un mensaje **DEL técnico AL member**.

**Response Success**:
```json
{
  "success": true,
  "message": "Message sent successfully to member"
}
```
**Status**: `200 OK`

---

## 📅 APPOINTMENTS

### 1. Obtener Detalle de una Cita

**Endpoint**: `GET /api/appointments/{appointment_id}/details`

**Headers**:
```
Authorization: Bearer {token}
```

**Response Success**:
```json
{
  "appointment": {
    "id": 45,
    "ticket_id": 123,
    "technical_id": 2,
    "scheduled_by": 1,
    "title": "Revisión de laptop",
    "description": "Revisar problema de encendido",
    "address": null,
    "scheduled_for": "2024-01-15T14:00:00.000000Z",
    "estimated_duration": 60,
    "status": "scheduled",
    "started_at": null,
    "completed_at": null,
    "completion_notes": null,
    "member_instructions": "Por favor tocar el timbre del apartamento 301",
    "notes": "Llevar batería de repuesto",
    "member_rating": null,
    "member_feedback": null,
    "no_show_reason": null,
    "no_show_description": null,
    "marked_no_show_at": null,
    "marked_no_show_by": null,
    "cancelled_at": null,
    "cancellation_reason": null,
    "created_at": "2024-01-15T11:30:00.000000Z",
    "updated_at": "2024-01-15T11:30:00.000000Z",
    "ticket": {
      "id": 123,
      "code": "TCK-00123",
      "title": "Laptop no enciende",
      "description": "La laptop no responde",
      "status": "in_progress",
      "priority": "high",
      "device": {
        "id": 42,
        "name": "Laptop Dell Latitude",
        "brand": {
          "id": 3,
          "name": "Dell"
        },
        "tenants": [
          {
            "id": 50,
            "name": "María García",
            "email": "maria@example.com",
            "phone": "+51998765432",
            "apartment": {
              "id": 101,
              "name": "Apt 301",
              "building": {
                "id": 5,
                "name": "Edificio Central",
                "address": "Av. Principal 123, Lima"
              }
            }
          }
        ]
      },
      "user": {
        "id": 50,
        "name": "María García",
        "email": "maria@example.com",
        "tenant": {
          "user_id": 50,
          "name": "María García",
          "email": "maria@example.com",
          "phone": "+51998765432",
          "apartment": {
            "id": 101,
            "name": "Apt 301",
            "building": {
              "id": 5,
              "name": "Edificio Central",
              "address": "Av. Principal 123, Lima"
            }
          }
        }
      }
    },
    "technical": {
      "id": 2,
      "name": "Juan Pérez",
      "email": "technical@example.com",
      "phone": "+51987654321",
      "photo": "/storage/technicals/juan_perez.jpg",
      "shift": "morning",
      "status": true,
      "is_default": false
    }
  },
  "googleMapsApiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "success": true
}
```
**Status**: `200 OK`

**Response Error (Cita no encontrada)**:
```json
{
  "error": "Appointment not found"
}
```
**Status**: `404 Not Found`

---

### 2. Crear Cita

**Endpoint**: `POST /api/tickets/{ticket_id}/appointments`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "technical_id": 2,
  "title": "Revisión de laptop",
  "description": "Revisar problema de encendido y reemplazar batería si es necesario",
  "address": "Av. Principal 123, Apt 301, Lima",
  "scheduled_for": "2024-01-15T14:00:00",
  "estimated_duration": 60,
  "member_instructions": "Por favor tocar el timbre del apartamento 301",
  "notes": "Llevar batería de repuesto Dell compatible"
}
```

**Campos**:
- `technical_id` (requerido): ID del técnico
- `title` (requerido): Título de la cita
- `description` (opcional): Descripción
- `address` (opcional): Dirección
- `scheduled_for` (requerido): Fecha y hora en formato ISO 8601
- `estimated_duration` (requerido): Duración en minutos (30-480)
- `member_instructions` (opcional): Instrucciones para el member
- `notes` (opcional): Notas internas

**Response Success**:
```json
{
  "success": true,
  "message": "Appointment successfully scheduled",
  "appointment": {
    "id": 45,
    "ticket_id": 123,
    "technical_id": 2,
    "scheduled_by": 5,
    "title": "Revisión de laptop",
    "description": "Revisar problema de encendido y reemplazar batería si es necesario",
    "address": "Av. Principal 123, Apt 301, Lima",
    "scheduled_for": "2024-01-15T14:00:00.000000Z",
    "estimated_duration": 60,
    "status": "scheduled",
    "member_instructions": "Por favor tocar el timbre del apartamento 301",
    "notes": "Llevar batería de repuesto Dell compatible",
    "created_at": "2024-01-15T11:30:00.000000Z",
    "updated_at": "2024-01-15T11:30:00.000000Z",
    "ticket": {
      "id": 123,
      "title": "Laptop no enciende",
      "status": "in_progress"
    },
    "technical": {
      "id": 2,
      "name": "Juan Pérez",
      "email": "technical@example.com"
    }
  }
}
```
**Status**: `200 OK`

**Response Error (Conflicto de horario)**:
```json
{
  "message": "The technician already has an appointment scheduled at this time.",
  "errors": {
    "scheduled_for": ["The technician already has an appointment scheduled at this time."]
  }
}
```
**Status**: `422 Unprocessable Entity`

**Response Error (Ticket no puede tener cita)**:
```json
{
  "message": "Cannot schedule an appointment for this ticket in its current state.",
  "errors": {
    "ticket": ["Cannot schedule an appointment for this ticket in its current state."]
  }
}
```
**Status**: `422 Unprocessable Entity`

---

### 3. Iniciar Cita

**Endpoint**: `POST /api/appointments/{appointment_id}/start`

**Headers**:
```
Authorization: Bearer {token}
```

**Request**: No requiere body

**Response Success**:
```json
{
  "success": true,
  "message": "Visita iniciada exitosamente",
  "appointment": {
    "id": 45,
    "ticket_id": 123,
    "technical_id": 2,
    "status": "in_progress",
    "scheduled_for": "2024-01-15T14:00:00.000000Z",
    "started_at": "2024-01-15T14:05:00.000000Z",
    "completed_at": null,
    "created_at": "2024-01-15T11:30:00.000000Z",
    "updated_at": "2024-01-15T14:05:00.000000Z"
  }
}
```
**Status**: `200 OK`

**Response Error (Solo citas programadas pueden iniciarse)**:
```json
{
  "success": false,
  "message": "Only scheduled appointments can be started"
}
```
**Status**: `400 Bad Request`

---

### 4. Completar Cita

**Endpoint**: `POST /api/appointments/{appointment_id}/complete`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "completion_notes": "Se reemplazó la batería. El equipo ahora funciona correctamente. Se recomienda al usuario no dejar la laptop conectada permanentemente."
}
```

**Nota**: Después de completar, el estado cambia a `awaiting_feedback`. El member debe dar rating y feedback para que cambie a `completed`.

**Response Success**:
```json
{
  "success": true,
  "message": "Visit completed. Waiting for member feedback.",
  "appointment": {
    "id": 45,
    "ticket_id": 123,
    "technical_id": 2,
    "status": "awaiting_feedback",
    "scheduled_for": "2024-01-15T14:00:00.000000Z",
    "started_at": "2024-01-15T14:05:00.000000Z",
    "completed_at": "2024-01-15T15:30:00.000000Z",
    "completion_notes": "Se reemplazó la batería. El equipo ahora funciona correctamente. Se recomienda al usuario no dejar la laptop conectada permanentemente.",
    "member_rating": null,
    "member_feedback": null,
    "created_at": "2024-01-15T11:30:00.000000Z",
    "updated_at": "2024-01-15T15:30:00.000000Z"
  }
}
```
**Status**: `200 OK`

**Response Error (Solo citas en progreso pueden completarse)**:
```json
{
  "success": false,
  "message": "Only in-progress appointments can be completed"
}
```
**Status**: `400 Bad Request`

**Response Error (Notas de completación requeridas)**:
```json
{
  "message": "The completion notes field is required.",
  "errors": {
    "completion_notes": ["The completion notes field is required."]
  }
}
```
**Status**: `422 Unprocessable Entity`

---

### 5. Marcar No-Show

**Endpoint**: `POST /api/appointments/{appointment_id}/no-show`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "reason": "member_not_available",
  "description": "El member no estaba en el apartamento a la hora programada. Toqué el timbre varias veces sin respuesta."
}
```

**Razones válidas**:
- `member_not_available` - Member no disponible
- `member_cancelled_last_minute` - Member canceló a último minuto
- `access_denied` - Acceso denegado
- `other` - Otra razón

**Response Success**:
```json
{
  "success": true,
  "message": "Appointment marked as No Show successfully",
  "appointment": {
    "id": 45,
    "ticket_id": 123,
    "technical_id": 2,
    "status": "no_show",
    "scheduled_for": "2024-01-15T14:00:00.000000Z",
    "started_at": null,
    "completed_at": null,
    "no_show_reason": "member_not_available",
    "no_show_description": "El member no estaba en el apartamento a la hora programada. Toqué el timbre varias veces sin respuesta.",
    "marked_no_show_at": "2024-01-15T14:10:00.000000Z",
    "marked_no_show_by": 5,
    "created_at": "2024-01-15T11:30:00.000000Z",
    "updated_at": "2024-01-15T14:10:00.000000Z"
  }
}
```
**Status**: `200 OK`

**Response Error (Razón requerida)**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "reason": ["The reason field is required."]
  }
}
```
**Status**: `422 Unprocessable Entity`

---

### 6. Reprogramar Cita

**Endpoint**: `POST /api/appointments/{appointment_id}/reschedule`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "scheduled_for": "2024-01-16T10:00:00",
  "reason": "Member solicitó cambio de horario por compromiso laboral"
}
```

**Response Success**:
```json
{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "appointment": {
    "id": 45,
    "ticket_id": 123,
    "technical_id": 2,
    "status": "scheduled",
    "scheduled_for": "2024-01-16T10:00:00.000000Z",
    "estimated_duration": 60,
    "created_at": "2024-01-15T11:30:00.000000Z",
    "updated_at": "2024-01-15T15:45:00.000000Z"
  }
}
```
**Status**: `200 OK`

**Nota**: Se envían notificaciones automáticas al member y al técnico sobre el cambio de horario.

---

### 7. Cancelar Cita

**Endpoint**: `POST /api/appointments/{appointment_id}/cancel`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "reason": "Emergencia en otro edificio",
  "description": "Se requiere atención urgente en Edificio Norte"
}
```

**Response Success**:
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "appointment": {
    "id": 45,
    "ticket_id": 123,
    "technical_id": 2,
    "status": "cancelled",
    "scheduled_for": "2024-01-15T14:00:00.000000Z",
    "cancelled_at": "2024-01-15T13:00:00.000000Z",
    "cancellation_reason": "Emergencia en otro edificio - Se requiere atención urgente en Edificio Norte",
    "created_at": "2024-01-15T11:30:00.000000Z",
    "updated_at": "2024-01-15T13:00:00.000000Z"
  }
}
```
**Status**: `200 OK`

---

## 🔔 NOTIFICACIONES

### 1. Obtener Notificaciones

**Endpoint**: `GET /api/tenant/notifications`

**Headers**:
```
Authorization: Bearer {token}
```

**Response Success**:
```json
{
  "notifications": [
    {
      "id": "9a5f2b3c-1d4e-5f6a-7b8c-9d0e1f2a3b4c",
      "type": "ticket_assigned",
      "title": "🎫 Nuevo Ticket Asignado",
      "message": "Se te ha asignado el ticket #TCK-00123: Laptop no enciende",
      "data": {
        "ticket_id": 123,
        "ticket_code": "TCK-00123",
        "ticket_title": "Laptop no enciende",
        "priority": "high",
        "building_name": "Edificio Central",
        "apartment_number": "301"
      },
      "is_read": false,
      "created_at": "2024-01-15T10:35:00.000000Z",
      "read_at": null
    },
    {
      "id": "8b4e1a2d-3c5f-6e7a-8b9c-0d1e2f3a4b5c",
      "type": "appointment_reminder",
      "title": "⏰ Recordatorio de Cita",
      "message": "Tienes una cita en 1 hora: Revisión de laptop en Apt 301",
      "data": {
        "appointment_id": 45,
        "ticket_id": 123,
        "scheduled_for": "2024-01-15T14:00:00.000000Z",
        "address": "Av. Principal 123, Apt 301, Lima",
        "member_name": "María García",
        "member_phone": "+51998765432"
      },
      "is_read": false,
      "created_at": "2024-01-15T13:00:00.000000Z",
      "read_at": null
    },
    {
      "id": "7c3d0a1b-2e4f-5d6a-7c8b-9e0d1f2a3b4c",
      "type": "member_message",
      "title": "💬 Mensaje del Cliente",
      "message": "María García te envió un mensaje en el ticket #TCK-00123",
      "data": {
        "ticket_id": 123,
        "ticket_code": "TCK-00123",
        "sender_name": "María García",
        "message_preview": "Hola, ¿a qué hora llegarás?"
      },
      "is_read": true,
      "created_at": "2024-01-15T13:45:00.000000Z",
      "read_at": "2024-01-15T13:50:00.000000Z"
    }
  ],
  "unread_count": 2
}
```
**Status**: `200 OK`

**Tipos de notificaciones para técnicos**:
- `ticket_assigned` - Ticket asignado
- `ticket_status_changed` - Estado de ticket cambió
- `appointment_scheduled` - Cita programada
- `appointment_reminder` - Recordatorio de cita (1 hora antes)
- `appointment_rescheduled` - Cita reprogramada
- `member_message` - Mensaje del member
- `instruction_received` - Instrucción del jefe técnico

---

### 2. Marcar Notificación como Leída

**Endpoint**: `POST /api/tenant/notifications/{notification_id}/read`

**Headers**:
```
Authorization: Bearer {token}
```

**Response Success**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```
**Status**: `200 OK`

---

### 3. Marcar Todas como Leídas

**Endpoint**: `POST /api/tenant/notifications/mark-all-read`

**Headers**:
```
Authorization: Bearer {token}
```

**Response Success**:
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "count": 5
}
```
**Status**: `200 OK`

---

### 4. Registrar Token de Push Notification

**Endpoint**: `POST /api/tenant/register-push-token`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_type": "ios"
}
```

**Valores válidos para `device_type`**:
- `ios`
- `android`

**Response Success**:
```json
{
  "success": true,
  "message": "Push token registered successfully"
}
```
**Status**: `200 OK`

---

## ❌ CÓDIGOS DE ERROR

### Errores Comunes

#### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```
**Causa**: Token no proporcionado o inválido

**Solución**: Verificar que el header `Authorization: Bearer {token}` esté presente y el token sea válido.

---

#### 403 Forbidden
```json
{
  "message": "You can only upload evidence to tickets assigned to you."
}
```
**Causa**: El técnico intenta realizar una acción en un ticket que no le está asignado.

**Solución**: Verificar que el técnico esté asignado al ticket o sea técnico default/super-admin.

---

#### 404 Not Found
```json
{
  "message": "No query results for model [App\\Models\\Ticket] 999"
}
```
**Causa**: El recurso solicitado no existe.

**Solución**: Verificar que el ID sea correcto.

---

#### 422 Unprocessable Entity
```json
{
  "message": "The evidence must not be greater than 10240 kilobytes.",
  "errors": {
    "evidence": ["The evidence must not be greater than 10240 kilobytes."]
  }
}
```
**Causa**: Error de validación.

**Solución**: Revisar los datos enviados y corregir según el mensaje de error.

---

#### 500 Internal Server Error
```json
{
  "message": "Server Error"
}
```
**Causa**: Error interno del servidor.

**Solución**: Contactar al equipo de backend. Revisar logs del servidor.

---

## 📝 NOTAS IMPORTANTES

### 1. Autenticación

- **Todos los endpoints protegidos** requieren el header `Authorization: Bearer {token}`
- El token se obtiene del endpoint `/api/tenant/login`
- El token **no expira** a menos que se llame a `/api/tenant/logout`
- Guardar el token en `AsyncStorage` para persistencia

### 2. Fechas y Horas

- Todas las fechas están en formato **ISO 8601** con timezone UTC
- Ejemplo: `2024-01-15T14:00:00.000000Z`
- Para enviar fechas, usar el mismo formato
- Convertir a hora local en el cliente

### 3. Archivos

- **Upload de evidencia**: Max 10MB, formatos: jpg, jpeg, png, gif, mp4, mov, avi
- Los archivos se guardan en `/storage/ticket_evidence/`
- La URL completa es: `https://adkassist.com/storage/ticket_evidence/{file_name}`

### 4. Estados

**Ticket**:
- `open` → `in_progress` → `resolved` → `closed`
- Puede ir a `cancelled` desde cualquier estado

**Appointment**:
- `scheduled` → `in_progress` → `awaiting_feedback` → `completed`
- Puede ir a `cancelled` o `no_show` desde `scheduled` o `in_progress`

### 5. Permisos

- **Técnico Regular**: Solo puede modificar tickets asignados a él
- **Técnico Jefe** (`is_default: true`): Puede modificar cualquier ticket
- **Super Admin**: Puede hacer todo

### 6. Notificaciones Push

- Registrar el token de Expo al hacer login
- Las notificaciones se envían automáticamente cuando:
  - Se asigna un ticket
  - Cambia el estado de un ticket
  - Se programa/reprograma una cita
  - 1 hora antes de una cita
  - El member envía un mensaje

---

**Última actualización**: 2024-01-15
**Versión**: 3.0 - Respuestas Detalladas
**Autor**: Equipo de Desarrollo
