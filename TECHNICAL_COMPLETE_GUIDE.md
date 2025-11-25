# 📱 Guía Completa: Technical Mobile App - APIs y Funcionalidades

> **Documento Completo y Actualizado** - Todas las APIs, endpoints y funcionalidades para técnicos en React Native.

## 📑 Tabla de Contenidos

### 🚀 Getting Started
1. [Resumen Ejecutivo](#-resumen-ejecutivo)
2. [Arquitectura del Sistema](#️-arquitectura-del-sistema)

### 🔐 Autenticación
3. [Login Unificado](#-login-unificado)
4. [Tipos de Técnicos](#-tipos-de-técnicos)
5. [Detección de Tipo](#-detección-de-tipo)

### 📊 APIs Completas
6. [APIs de Autenticación](#-apis-de-autenticación)
7. [APIs de Tickets](#️-apis-de-tickets)
8. [APIs de Appointments](#-apis-de-appointments)
9. [APIs de Notificaciones](#-apis-de-notificaciones)
10. [APIs de Técnicos](#-apis-de-técnicos)

### 💻 Implementación
11. [Estructura de Código](#-estructura-de-código)
12. [Ejemplos de Uso](#-ejemplos-de-uso)

---

## 🎯 Resumen Ejecutivo

### ¿Qué es este proyecto?

Sistema completo de gestión de tickets y citas para **técnicos** en app móvil React Native (Expo). La app funciona para **members (tenants)** y **técnicos** usando el mismo endpoint de login.

### ✅ Backend Completamente Implementado

- ✅ Login unificado para members y técnicos
- ✅ Detección automática de tipo de usuario (member/technical)
- ✅ Diferenciación entre técnico regular y técnico jefe (is_default)
- ✅ Todas las APIs de tickets (CRUD, acciones, evidencia, notas)
- ✅ Todas las APIs de appointments (crear, iniciar, completar, cancelar, reprogramar, no-show)
- ✅ Sistema de notificaciones completo
- ✅ Push notifications con Expo

### 🔑 Conceptos Clave

**Técnico Regular (`is_default: false`)**:
- Ve solo SUS tickets asignados
- Ve solo SUS citas programadas
- Puede actualizar estado, subir evidencia, agregar notas
- Dashboard personal con sus estadísticas

**Técnico Jefe (`is_default: true`)**:
- Ve TODOS los tickets del sistema
- Ve TODAS las citas de todos los técnicos
- Puede asignar/reasignar tickets
- Dashboard global con estadísticas del equipo
- Puede enviar instrucciones a otros técnicos

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

**Backend**
- Framework: Laravel 10+
- Autenticación: Laravel Sanctum (Token-based)
- Base de datos: MySQL
- APIs: RESTful JSON
- Broadcasting: Pusher (notificaciones en tiempo real)

**Mobile**
- Framework: React Native (Expo)
- Navegación: React Navigation
- HTTP Client: Axios
- Storage: AsyncStorage
- Notificaciones: Expo Notifications + FCM
- Estado: Context API / Redux

### Base URL

```
https://adkassist.com/api
```

### Autenticación

Todas las rutas protegidas requieren el header:
```
Authorization: Bearer {token}
```

El token se obtiene del endpoint `/api/tenant/login`.

---

## 🔐 Login Unificado

### Endpoint: `POST /api/tenant/login`

**URL Completa**: `https://adkassist.com/api/tenant/login`

Tanto **members** como **técnicos** usan el **mismo endpoint**. El backend detecta automáticamente el tipo de usuario.

### Request

```json
{
  "email": "technical@example.com",
  "password": "password123"
}
```

### Response - Técnico Regular (`is_default: false`)

```json
{
  "token": "1|abc123xyz...",
  "user": {
    "id": 5,
    "name": "Juan Pérez",
    "email": "technical@example.com",
    "roles": ["technical"]
  },
  "technical": {
    "id": 2,
    "name": "Juan Pérez",
    "email": "technical@example.com",
    "phone": "+1234567890",
    "photo": "/storage/technicals/juan.jpg",
    "is_default": false,
    "shift": "morning",
    "status": true
  }
}
```

### Response - Técnico Jefe (`is_default: true`)

```json
{
  "token": "3|xyz789def...",
  "user": {
    "id": 3,
    "name": "Pedro García",
    "email": "chief@example.com",
    "roles": ["technical"]
  },
  "technical": {
    "id": 1,
    "name": "Pedro García",
    "email": "chief@example.com",
    "phone": "+9876543210",
    "photo": "/storage/technicals/pedro.jpg",
    "is_default": true,
    "shift": "full_day",
    "status": true
  }
}
```

### Response - Member (para comparación)

```json
{
  "token": "2|def456uvw...",
  "user": {
    "id": 10,
    "name": "María García",
    "email": "member@example.com",
    "roles": ["member"]
  },
  "tenant": {
    "id": 15,
    "name": "María García",
    "email": "member@example.com",
    "phone": "+9876543210",
    "photo": "/storage/tenants/maria.jpg",
    "apartment_id": 101
  }
}
```

### Códigos de Error

- `422` - Credenciales incorrectas
- `422` - Usuario no tiene rol de member o technical
- `422` - Perfil de técnico no encontrado

---

## 👥 Tipos de Técnicos

El campo `is_default` en la tabla `technicals` determina el tipo y los permisos:

### Comparación Completa

| Característica | 🔴 Técnico Regular<br>(`is_default: false`) | 🟢 Técnico Jefe<br>(`is_default: true`) |
|----------------|---------------------------------------------|------------------------------------------|
| **Dashboard** | Personal - Solo sus estadísticas | Global - Todo el sistema |
| **Ve Tickets** | Solo SUS tickets asignados | TODOS los tickets del sistema |
| **Ve Citas** | Solo SUS citas programadas | TODAS las citas de todos |
| **Puede Asignar** | ❌ No puede asignar tickets | ✅ Puede asignar a cualquiera |
| **Ve Técnicos** | ❌ No ve lista de técnicos | ✅ Ve todos + estadísticas |
| **Filtros** | Solo de sus datos | Puede filtrar por técnico |
| **Gestión** | Solo sus asignaciones | Todo el equipo |

---

## 🔑 APIs de Autenticación

### 1. Login

**Endpoint**: `POST /api/tenant/login`

**Request**:
```json
{
  "email": "technical@example.com",
  "password": "password123"
}
```

**Response**: Ver sección [Login Unificado](#-login-unificado)

### 2. Logout

**Endpoint**: `POST /api/tenant/logout`

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

---

## 🎫 APIs de Tickets

### 1. Obtener Lista de Técnicos

**Endpoint**: `GET /api/technicals`

**Descripción**: Lista todos los técnicos (para vista de jefe o asignación)

**Headers**: No requiere autenticación

**Response**:
```json
{
  "technicals": [
    {
      "id": 1,
      "name": "Pedro García",
      "email": "chief@example.com",
      "photo": "/storage/technicals/pedro.jpg",
      "shift": "full_day",
      "status": true,
      "is_default": true
    },
    {
      "id": 2,
      "name": "Juan Pérez",
      "email": "technical@example.com",
      "photo": "/storage/technicals/juan.jpg",
      "shift": "morning",
      "status": true,
      "is_default": false
    }
  ]
}
```

### 2. Obtener Tickets de un Técnico

**Endpoint**: `GET /api/technicals/{technical_id}/tickets`

**Query Parameters**:
- `type` (opcional): Filtro de tickets
  - `all` - Todos los tickets (default)
  - `today` - Tickets creados hoy
  - `week` - Tickets de esta semana
  - `month` - Tickets de este mes
  - `open` - Tickets abiertos
  - `in_progress` - Tickets en progreso
  - `resolved` - Tickets resueltos
  - `closed` - Tickets cerrados
  - `recent` - Tickets completados en últimos 7 días

**Headers**: No requiere autenticación

**Ejemplo**: `GET /api/technicals/2/tickets?type=today`

**Response**:
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
      "name": "Laptop Dell"
    },
    "apartment": {
      "id": 101,
      "number": "301"
    }
  }
]
```

### 3. Obtener Detalle de un Ticket

**Endpoint**: `GET /api/tickets/{ticket_id}/detail`

**Headers**: No requiere autenticación

**Response**:
```json
{
  "id": 123,
  "title": "Laptop no enciende",
  "description": "La laptop no responde al presionar el botón de encendido",
  "status": "in_progress",
  "priority": "high",
  "created_at": "2024-01-15T10:30:00.000000Z",
  "resolved_at": null,
  "building": {
    "id": 5,
    "name": "Edificio Central",
    "address": "Av. Principal 123"
  },
  "device": {
    "id": 42,
    "name": "Laptop Dell",
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
    "phone": "+1234567890"
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
    }
  ],
  "comments": [
    {
      "id": 789,
      "comment": "Revisando el equipo",
      "created_at": "2024-01-15T11:05:00.000000Z",
      "user": {
        "id": 5,
        "name": "Juan Pérez"
      }
    }
  ]
}
```

### 4. Actualizar Estado de Ticket

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

**Valores válidos para status**:
- `open` - Abierto
- `in_progress` - En progreso
- `resolved` - Resuelto
- `closed` - Cerrado

**Response**:
```json
{
  "success": true
}
```

### 5. Agregar Entrada al Historial

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
  "description": "Revisé el equipo, parece ser problema de batería"
}
```

**Response**:
```json
{
  "success": true,
  "message": "History entry added successfully"
}
```

### 6. Subir Evidencia (Foto/Video)

**Endpoint**: `POST /api/tickets/{ticket_id}/upload-evidence`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request** (FormData):
```
evidence: [File] (jpg, jpeg, png, gif, mp4, mov, avi - max 10MB)
description: "Foto del problema detectado" (opcional)
```

**Response**:
```json
{
  "success": true,
  "message": "Evidence uploaded successfully",
  "file_path": "ticket_evidence/1705318200_photo.jpg",
  "file_name": "1705318200_photo.jpg"
}
```

### 7. Agregar Nota Privada

**Endpoint**: `POST /api/tickets/{ticket_id}/add-private-note`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "note": "El cliente mencionó que el problema empezó después de una actualización"
}
```

**Nota**: Las notas privadas solo son visibles para técnicos y administradores.

**Response**:
```json
{
  "success": true,
  "message": "Private note added successfully"
}
```

### 8. Enviar Mensaje al Member

**Endpoint**: `POST /api/tickets/{ticket_id}/send-message-to-technical`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "message": "Hola, necesito que me proporciones más información sobre el problema"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message sent successfully to member"
}
```

---

## 📅 APIs de Appointments

### 1. Obtener Citas de un Técnico

**Endpoint**: `GET /api/technicals/{technical_id}/appointments`

**Query Parameters**:
- `date` (opcional): Fecha en formato YYYY-MM-DD
  - Si se proporciona, filtra citas de esa fecha
  - Si no se proporciona, retorna todas las citas del técnico

**Headers**: No requiere autenticación

**Ejemplo**: `GET /api/technicals/2/appointments?date=2024-01-15`

**Response**:
```json
[
  {
    "id": 45,
    "ticket_id": 123,
    "technical_id": 2,
    "scheduled_for": "2024-01-15T14:00:00.000000Z",
    "status": "scheduled",
    "started_at": null,
    "completed_at": null,
    "completion_notes": null,
    "member_rating": null,
    "member_feedback": null,
    "ticket": {
      "id": 123,
      "title": "Laptop no enciende",
      "status": "in_progress",
      "priority": "high",
      "device": {
        "id": 42,
        "name": "Laptop Dell"
      },
      "apartment": {
        "id": 101,
        "number": "301",
        "building": {
          "id": 5,
          "name": "Edificio Central",
          "address": "Av. Principal 123"
        }
      },
      "user": {
        "id": 50,
        "name": "María García",
        "email": "maria@example.com"
      }
    },
    "tenant": {
      "id": 50,
      "name": "María García",
      "email": "maria@example.com",
      "phone": "+1234567890"
    }
  }
]
```

**Estados de Appointment**:
- `scheduled` - Programada
- `in_progress` - En progreso (técnico llegó)
- `awaiting_feedback` - Esperando feedback del member
- `completed` - Completada (con feedback del member)
- `cancelled` - Cancelada
- `no_show` - No se presentó el member

### 2. Obtener Detalle de una Cita

**Endpoint**: `GET /api/appointments/{appointment_id}/details`

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "id": 45,
  "ticket_id": 123,
  "technical_id": 2,
  "scheduled_for": "2024-01-15T14:00:00.000000Z",
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
    "description": "La laptop no responde",
    "status": "in_progress",
    "priority": "high",
    "device": {
      "id": 42,
      "name": "Laptop Dell",
      "brand": {
        "id": 3,
        "name": "Dell"
      }
    },
    "apartment": {
      "id": 101,
      "number": "301",
      "building": {
        "id": 5,
        "name": "Edificio Central",
        "address": "Av. Principal 123"
      }
    },
    "tenant": {
      "id": 50,
      "name": "María García",
      "email": "maria@example.com",
      "phone": "+1234567890"
    }
  }
}
```

### 3. Crear Cita para un Ticket

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
  "scheduled_for": "2024-01-15T14:00:00",
  "notes": "Revisar batería y fuente de poder"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "appointment": {
    "id": 45,
    "ticket_id": 123,
    "technical_id": 2,
    "scheduled_for": "2024-01-15T14:00:00.000000Z",
    "status": "scheduled",
    "notes": "Revisar batería y fuente de poder"
  }
}
```

### 4. Iniciar Cita (Técnico Llega)

**Endpoint**: `POST /api/appointments/{appointment_id}/start`

**Headers**:
```
Authorization: Bearer {token}
```

**Request**: No requiere body

**Response**:
```json
{
  "success": true,
  "message": "Visita iniciada exitosamente",
  "appointment": {
    "id": 45,
    "status": "in_progress",
    "started_at": "2024-01-15T14:05:00.000000Z"
  }
}
```

### 5. Completar Cita

**Endpoint**: `POST /api/appointments/{appointment_id}/complete`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request**:
```json
{
  "completion_notes": "Se reemplazó la batería. El equipo ahora funciona correctamente."
}
```

**Nota**: Después de completar, el estado cambia a `awaiting_feedback`. El member debe proporcionar rating y feedback para que cambie a `completed`.

**Response**:
```json
{
  "success": true,
  "message": "Visit completed. Waiting for member feedback.",
  "appointment": {
    "id": 45,
    "status": "awaiting_feedback",
    "completed_at": "2024-01-15T15:30:00.000000Z",
    "completion_notes": "Se reemplazó la batería. El equipo ahora funciona correctamente."
  }
}
```

### 6. Marcar No-Show

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
  "description": "El member no estaba en el apartamento a la hora programada"
}
```

**Razones válidas**:
- `member_not_available` - Member no disponible
- `member_cancelled_last_minute` - Member canceló a último minuto
- `access_denied` - Acceso denegado
- `other` - Otra razón

**Response**:
```json
{
  "success": true,
  "message": "Appointment marked as No Show successfully",
  "appointment": {
    "id": 45,
    "status": "no_show",
    "no_show_reason": "member_not_available",
    "no_show_description": "El member no estaba en el apartamento a la hora programada",
    "marked_no_show_at": "2024-01-15T14:10:00.000000Z"
  }
}
```

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
  "reason": "technical_unavailable",
  "description": "Emergencia en otro edificio"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "appointment": {
    "id": 45,
    "status": "cancelled",
    "cancelled_at": "2024-01-15T13:00:00.000000Z"
  }
}
```

### 8. Reprogramar Cita

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
  "reason": "Member requested different time"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "appointment": {
    "id": 45,
    "scheduled_for": "2024-01-16T10:00:00.000000Z",
    "status": "scheduled"
  }
}
```

---

## 🔔 APIs de Notificaciones

### 1. Obtener Notificaciones

**Endpoint**: `GET /api/tenant/notifications`

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "notifications": [
    {
      "id": 123,
      "title": "🎫 Nuevo Ticket Asignado",
      "message": "Se te ha asignado el ticket #456: Laptop no enciende",
      "type": "ticket_assigned",
      "is_read": false,
      "created_at": "2024-01-15T10:00:00.000000Z",
      "data": {
        "ticket_id": 456,
        "ticket_title": "Laptop no enciende",
        "priority": "high"
      }
    }
  ],
  "unread_count": 5
}
```

**Tipos de notificaciones para técnicos**:
- `ticket_assigned` - Ticket asignado
- `ticket_status_changed` - Estado de ticket cambió
- `appointment_scheduled` - Cita programada
- `appointment_reminder` - Recordatorio de cita (1 hora antes)
- `member_message` - Mensaje del member
- `instruction_received` - Instrucción del jefe técnico

### 2. Marcar Notificación como Leída

**Endpoint**: `POST /api/tenant/notifications/{notification_id}/read`

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 3. Marcar Todas como Leídas

**Endpoint**: `POST /api/tenant/notifications/mark-all-read`

**Headers**:
```
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "count": 5
}
```

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

**Valores válidos para device_type**:
- `ios`
- `android`

**Response**:
```json
{
  "success": true,
  "message": "Push token registered successfully"
}
```

---

## 👨‍🔧 APIs de Técnicos

### 1. Obtener Todos los Tenants

**Endpoint**: `GET /api/tenants/all`

**Descripción**: Lista todos los tenants (members) para crear tickets en su nombre

**Headers**: No requiere autenticación

**Response**:
```json
[
  {
    "id": 50,
    "name": "María García",
    "email": "maria@example.com",
    "phone": "+1234567890",
    "apartment_id": 101,
    "apartment": {
      "id": 101,
      "number": "301",
      "building_id": 5
    }
  }
]
```

---

## 💻 Estructura de Código

### Service para APIs de Técnicos

```javascript
// services/TechnicalService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://adkassist.com/api';

class TechnicalService {
  // Obtener token
  async getToken() {
    return await AsyncStorage.getItem('authToken');
  }

  // Obtener ID del técnico actual
  async getCurrentTechnicalId() {
    const technicalData = await AsyncStorage.getItem('technical');
    if (technicalData) {
      const technical = JSON.parse(technicalData);
      return technical.id;
    }
    return null;
  }

  // Obtener si es técnico default
  async isDefaultTechnical() {
    const isDefault = await AsyncStorage.getItem('isDefaultTechnical');
    return isDefault === 'true';
  }

  // ==================== TICKETS ====================

  // Obtener tickets del técnico
  async getMyTickets(technicalId, type = 'all') {
    const token = await this.getToken();
    const response = await axios.get(
      `${API_URL}/technicals/${technicalId}/tickets`,
      {
        params: { type },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Obtener detalle de ticket
  async getTicketDetail(ticketId) {
    const token = await this.getToken();
    const response = await axios.get(
      `${API_URL}/tickets/${ticketId}/detail`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Actualizar estado de ticket
  async updateTicketStatus(ticketId, status) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/tickets/${ticketId}/update-status`,
      { status },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Subir evidencia
  async uploadEvidence(ticketId, file, description = null) {
    const token = await this.getToken();
    const formData = new FormData();
    formData.append('evidence', {
      uri: file.uri,
      type: file.type,
      name: file.fileName || 'evidence.jpg'
    });
    if (description) {
      formData.append('description', description);
    }

    const response = await axios.post(
      `${API_URL}/tickets/${ticketId}/upload-evidence`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Agregar nota privada
  async addPrivateNote(ticketId, note) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/tickets/${ticketId}/add-private-note`,
      { note },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Enviar mensaje al member
  async sendMessageToMember(ticketId, message) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/tickets/${ticketId}/send-message-to-technical`,
      { message },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // ==================== APPOINTMENTS ====================

  // Obtener citas del técnico
  async getMyAppointments(technicalId, date = null) {
    const token = await this.getToken();
    const params = {};
    if (date) {
      // Convertir Date a YYYY-MM-DD
      const dateStr = date.toISOString().split('T')[0];
      params.date = dateStr;
    }

    const response = await axios.get(
      `${API_URL}/technicals/${technicalId}/appointments`,
      {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Obtener detalle de cita
  async getAppointmentDetails(appointmentId) {
    const token = await this.getToken();
    const response = await axios.get(
      `${API_URL}/appointments/${appointmentId}/details`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Crear cita
  async createAppointment(ticketId, technicalId, scheduledFor, notes = null) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/tickets/${ticketId}/appointments`,
      {
        technical_id: technicalId,
        scheduled_for: scheduledFor,
        notes
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Iniciar cita
  async startAppointment(appointmentId) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/appointments/${appointmentId}/start`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Completar cita
  async completeAppointment(appointmentId, completionNotes) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/appointments/${appointmentId}/complete`,
      { completion_notes: completionNotes },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Marcar no-show
  async markNoShow(appointmentId, reason, description = null) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/appointments/${appointmentId}/no-show`,
      {
        reason,
        description
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Cancelar cita
  async cancelAppointment(appointmentId, reason, description = null) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/appointments/${appointmentId}/cancel`,
      {
        reason,
        description
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Reprogramar cita
  async rescheduleAppointment(appointmentId, scheduledFor, reason) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/appointments/${appointmentId}/reschedule`,
      {
        scheduled_for: scheduledFor,
        reason
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // ==================== NOTIFICACIONES ====================

  // Obtener notificaciones
  async getNotifications() {
    const token = await this.getToken();
    const response = await axios.get(
      `${API_URL}/tenant/notifications`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Marcar notificación como leída
  async markNotificationAsRead(notificationId) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/tenant/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Marcar todas como leídas
  async markAllNotificationsAsRead() {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/tenant/notifications/mark-all-read`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // Registrar token de push
  async registerPushToken(pushToken, deviceType) {
    const token = await this.getToken();
    const response = await axios.post(
      `${API_URL}/tenant/register-push-token`,
      {
        token: pushToken,
        device_type: deviceType
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }

  // ==================== TÉCNICOS ====================

  // Obtener lista de técnicos (para jefe)
  async getAllTechnicals() {
    const token = await this.getToken();
    const response = await axios.get(
      `${API_URL}/technicals`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data.technicals;
  }

  // Obtener lista de tenants (para crear tickets)
  async getAllTenants() {
    const token = await this.getToken();
    const response = await axios.get(
      `${API_URL}/tenants/all`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }
}

export default new TechnicalService();
```

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Cargar Dashboard de Técnico Regular

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import TechnicalService from '../services/TechnicalService';

const TechnicalDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });
  const [todayTickets, setTodayTickets] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const technicalId = await TechnicalService.getCurrentTechnicalId();
      
      // Cargar todos los tickets para estadísticas
      const allTickets = await TechnicalService.getMyTickets(technicalId, 'all');
      
      // Calcular estadísticas
      setStats({
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'open').length,
        inProgress: allTickets.filter(t => t.status === 'in_progress').length,
        resolved: allTickets.filter(t => t.status === 'resolved').length
      });
      
      // Cargar tickets de hoy
      const tickets = await TechnicalService.getMyTickets(technicalId, 'today');
      setTodayTickets(tickets);
      
      // Cargar citas de hoy
      const appointments = await TechnicalService.getMyAppointments(technicalId, new Date());
      setTodayAppointments(appointments);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <ScrollView 
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadDashboard} />
      }
    >
      <View>
        <Text>Total: {stats.total}</Text>
        <Text>Abiertos: {stats.open}</Text>
        <Text>En Progreso: {stats.inProgress}</Text>
        <Text>Resueltos: {stats.resolved}</Text>
      </View>
      
      <View>
        <Text>Tickets de Hoy ({todayTickets.length})</Text>
        {todayTickets.map(ticket => (
          <Text key={ticket.id}>{ticket.title}</Text>
        ))}
      </View>
      
      <View>
        <Text>Citas de Hoy ({todayAppointments.length})</Text>
        {todayAppointments.map(apt => (
          <Text key={apt.id}>{apt.ticket.title}</Text>
        ))}
      </View>
    </ScrollView>
  );
};

export default TechnicalDashboard;
```

### Ejemplo 2: Actualizar Estado de Ticket

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import TechnicalService from '../services/TechnicalService';

const UpdateTicketStatus = ({ ticketId, currentStatus, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus) => {
    try {
      setLoading(true);
      await TechnicalService.updateTicketStatus(ticketId, newStatus);
      Alert.alert('Éxito', 'Estado actualizado correctamente');
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text>Estado actual: {currentStatus}</Text>
      
      {currentStatus === 'open' && (
        <TouchableOpacity 
          onPress={() => updateStatus('in_progress')}
          disabled={loading}
        >
          <Text>Iniciar Trabajo</Text>
        </TouchableOpacity>
      )}
      
      {currentStatus === 'in_progress' && (
        <TouchableOpacity 
          onPress={() => updateStatus('resolved')}
          disabled={loading}
        >
          <Text>Marcar como Resuelto</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UpdateTicketStatus;
```

### Ejemplo 3: Iniciar y Completar Cita

```javascript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import TechnicalService from '../services/TechnicalService';

const AppointmentActions = ({ appointment, onSuccess }) => {
  const [completionNotes, setCompletionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);
      await TechnicalService.startAppointment(appointment.id);
      Alert.alert('Éxito', 'Visita iniciada');
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!completionNotes.trim()) {
      Alert.alert('Error', 'Por favor ingresa notas de completación');
      return;
    }

    try {
      setLoading(true);
      await TechnicalService.completeAppointment(appointment.id, completionNotes);
      Alert.alert('Éxito', 'Visita completada. Esperando feedback del member.');
      if (onSuccess) onSuccess();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {appointment.status === 'scheduled' && (
        <TouchableOpacity onPress={handleStart} disabled={loading}>
          <Text>Iniciar Visita</Text>
        </TouchableOpacity>
      )}

      {appointment.status === 'in_progress' && (
        <View>
          <TextInput
            placeholder="Notas de completación..."
            value={completionNotes}
            onChangeText={setCompletionNotes}
            multiline
          />
          <TouchableOpacity onPress={handleComplete} disabled={loading}>
            <Text>Completar Visita</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AppointmentActions;
```

---

## 🔒 Seguridad y Permisos

### Permisos por Endpoint

| Endpoint | Técnico Regular | Técnico Jefe | Autenticación |
|----------|----------------|--------------|---------------|
| `GET /api/technicals` | ✅ | ✅ | No requerida |
| `GET /api/technicals/{id}/tickets` | ✅ Solo sus tickets | ✅ Todos | No requerida |
| `GET /api/technicals/{id}/appointments` | ✅ Solo sus citas | ✅ Todas | No requerida |
| `POST /api/tickets/{id}/update-status` | ✅ Solo sus tickets | ✅ Todos | Requerida |
| `POST /api/tickets/{id}/upload-evidence` | ✅ Solo sus tickets | ✅ Todos | Requerida |
| `POST /api/tickets/{id}/add-private-note` | ✅ | ✅ | Requerida |
| `POST /api/appointments/{id}/start` | ✅ Solo sus citas | ✅ Todas | Requerida |
| `POST /api/appointments/{id}/complete` | ✅ Solo sus citas | ✅ Todas | Requerida |

### Validaciones del Backend

1. **Tickets**: Solo el técnico asignado, técnico default o super-admin pueden modificar
2. **Appointments**: Solo el técnico asignado puede iniciar/completar
3. **Evidencia**: Max 10MB, formatos: jpg, jpeg, png, gif, mp4, mov, avi
4. **Notas privadas**: Solo técnicos pueden agregar

---

## 📊 Códigos de Estado HTTP

- `200` - Éxito
- `401` - No autenticado (token inválido o expirado)
- `403` - No autorizado (sin permisos)
- `404` - Recurso no encontrado
- `422` - Error de validación
- `500` - Error del servidor

---

## 🎯 Próximos Pasos

1. **Implementar AuthService** con detección de tipo de usuario
2. **Crear TechnicalService** con todos los métodos de API
3. **Implementar navegación** diferenciada (Regular vs Jefe)
4. **Crear pantallas** de Dashboard, Tickets, Appointments
5. **Integrar push notifications** con Expo
6. **Testing** completo de todas las funcionalidades

---

**Última actualización**: 2024-01-15

**Versión del documento**: 2.0 - Completo y Actualizado
