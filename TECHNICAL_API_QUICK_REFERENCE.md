# 🚀 Technical APIs - Quick Reference

> Referencia rápida de todos los endpoints para técnicos

## 🔐 Autenticación

### Login
```
POST /api/tenant/login
Body: { "email": "...", "password": "..." }
Response: { "token": "...", "user": {...}, "technical": { "is_default": true/false } }
```

### Logout
```
POST /api/tenant/logout
Headers: Authorization: Bearer {token}
```

---

## 👨‍🔧 Técnicos

### Listar Técnicos
```
GET /api/technicals
Response: { "technicals": [...] }
```

---

## 🎫 Tickets

### 1. Obtener Tickets del Técnico
```
GET /api/technicals/{technical_id}/tickets?type={type}

Tipos: all, today, week, month, open, in_progress, resolved, closed, recent
```

### 2. Detalle de Ticket
```
GET /api/tickets/{ticket_id}/detail
```

### 3. Actualizar Estado
```
POST /api/tickets/{ticket_id}/update-status
Headers: Authorization: Bearer {token}
Body: { "status": "in_progress" }

Estados: open, in_progress, resolved, closed
```

### 4. Agregar al Historial
```
POST /api/tickets/{ticket_id}/add-history
Headers: Authorization: Bearer {token}
Body: { "action": "comment", "description": "..." }
```

### 5. Subir Evidencia
```
POST /api/tickets/{ticket_id}/upload-evidence
Headers: Authorization: Bearer {token}, Content-Type: multipart/form-data
Body (FormData): 
  - evidence: File (jpg, jpeg, png, gif, mp4, mov, avi - max 10MB)
  - description: string (opcional)
```

### 6. Nota Privada
```
POST /api/tickets/{ticket_id}/add-private-note
Headers: Authorization: Bearer {token}
Body: { "note": "..." }
```

### 7. Mensaje al Member
```
POST /api/tickets/{ticket_id}/send-message-to-technical
Headers: Authorization: Bearer {token}
Body: { "message": "..." }
```

---

## 📅 Appointments

### 1. Obtener Citas del Técnico
```
GET /api/technicals/{technical_id}/appointments?date={YYYY-MM-DD}

Si no se pasa date, retorna todas las citas
```

### 2. Detalle de Cita
```
GET /api/appointments/{appointment_id}/details
Headers: Authorization: Bearer {token}
```

### 3. Crear Cita
```
POST /api/tickets/{ticket_id}/appointments
Headers: Authorization: Bearer {token}
Body: {
  "technical_id": 2,
  "scheduled_for": "2024-01-15T14:00:00",
  "notes": "..."
}
```

### 4. Iniciar Cita
```
POST /api/appointments/{appointment_id}/start
Headers: Authorization: Bearer {token}

Cambia estado a: in_progress
```

### 5. Completar Cita
```
POST /api/appointments/{appointment_id}/complete
Headers: Authorization: Bearer {token}
Body: { "completion_notes": "..." }

Cambia estado a: awaiting_feedback (espera rating del member)
```

### 6. Marcar No-Show
```
POST /api/appointments/{appointment_id}/no-show
Headers: Authorization: Bearer {token}
Body: {
  "reason": "member_not_available",
  "description": "..." (opcional)
}

Razones válidas:
- member_not_available
- member_cancelled_last_minute
- access_denied
- other
```

### 7. Reprogramar
```
POST /api/appointments/{appointment_id}/reschedule
Headers: Authorization: Bearer {token}
Body: {
  "scheduled_for": "2024-01-16T10:00:00",
  "reason": "..."
}
```

### 8. Cancelar
```
POST /api/appointments/{appointment_id}/cancel
Headers: Authorization: Bearer {token}
Body: {
  "reason": "...",
  "description": "..." (opcional)
}
```

---

## 🔔 Notificaciones

### 1. Obtener Notificaciones
```
GET /api/tenant/notifications
Headers: Authorization: Bearer {token}
Response: { "notifications": [...], "unread_count": 5 }
```

### 2. Marcar como Leída
```
POST /api/tenant/notifications/{notification_id}/read
Headers: Authorization: Bearer {token}
```

### 3. Marcar Todas como Leídas
```
POST /api/tenant/notifications/mark-all-read
Headers: Authorization: Bearer {token}
```

### 4. Registrar Token Push
```
POST /api/tenant/register-push-token
Headers: Authorization: Bearer {token}
Body: {
  "token": "ExponentPushToken[...]",
  "device_type": "ios" | "android"
}
```

---

## 👥 Otros

### Obtener Todos los Tenants
```
GET /api/tenants/all
Response: [{ "id": 50, "name": "...", "apartment": {...} }]
```

---

## 📊 Estados

### Estados de Ticket
- `open` - Abierto
- `in_progress` - En progreso
- `resolved` - Resuelto
- `closed` - Cerrado

### Estados de Appointment
- `scheduled` - Programada
- `in_progress` - En progreso (técnico llegó)
- `awaiting_feedback` - Esperando feedback del member
- `completed` - Completada (con feedback)
- `cancelled` - Cancelada
- `no_show` - No se presentó

---

## 🔑 Códigos HTTP

- `200` - Éxito
- `401` - No autenticado
- `403` - No autorizado
- `404` - No encontrado
- `422` - Error de validación
- `500` - Error del servidor

---

## 💡 Tips

1. **Siempre incluir el header Authorization** en rutas protegidas
2. **El token se obtiene del login** y se guarda en AsyncStorage
3. **is_default determina el tipo de técnico** (regular vs jefe)
4. **Técnico regular solo ve SUS tickets/citas**
5. **Técnico jefe ve TODOS los tickets/citas**
6. **Appointment complete NO es final** - espera feedback del member
7. **Upload evidence max 10MB** - jpg, jpeg, png, gif, mp4, mov, avi

---

**Base URL**: `https://adkassist.com/api`

**Última actualización**: 2024-01-15
