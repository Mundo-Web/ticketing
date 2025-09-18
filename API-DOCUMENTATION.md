# API Documentation - Sistema de Ticketing para Tenants

## Información General

**Base URL:** `http://167.172.146.200/api`  
**Autenticación:** Laravel Sanctum (Bearer Token)  
**Formato de respuesta:** JSON  
**Versión:** 1.0  

## Autenticación

### 1. Login de Tenant

**Endpoint:** `POST /tenant/login`  
**Autenticación:** No requerida  

#### Request Body:
```json
{
    "email": "string (required)",
    "password": "string (required)"
}
```

#### Response Success (200):
```json
{
    "user": {
        "id": "integer",
        "name": "string",
        "email": "string",
        "tenant_id": "integer"
    },
    "tenant": {
        "id": "integer",
        "name": "string",
        "email": "string",
        "phone": "string|null",
        "photo": "string|null",
        "apartment_id": "integer"
    },
    "token": "string"
}
```

#### Response Error (422):
```json
{
    "message": "string",
    "errors": {
        "email": ["string"]
    }
}
```

#### Variables disponibles:
- `user.id`: ID único del usuario en el sistema
- `user.name`: Nombre completo del usuario
- `user.email`: Email del usuario
- `user.tenant_id`: ID del perfil de tenant asociado
- `tenant.id`: ID único del tenant
- `tenant.name`: Nombre del tenant
- `tenant.email`: Email del tenant
- `tenant.phone`: Teléfono del tenant (puede ser null)
- `tenant.photo`: URL de la foto del tenant (puede ser null)
- `tenant.apartment_id`: ID del apartamento al que pertenece
- `token`: Token de autenticación para usar en requests posteriores

---

### 2. Logout de Tenant

**Endpoint:** `POST /tenant/logout`  
**Autenticación:** Bearer Token requerido  

#### Headers:
```
Authorization: Bearer {token}
```

#### Response Success (200):
```json
{
    "message": "Successfully logged out"
}
```

---

## Información del Perfil

### 3. Obtener Perfil del Tenant

**Endpoint:** `GET /tenant/me`  
**Autenticación:** Bearer Token requerido  

#### Headers:
```
Authorization: Bearer {token}
```

#### Response Success (200):
```json
{
    "tenant": {
        "id": "integer",
        "name": "string",
        "email": "string",
        "phone": "string|null",
        "photo": "string|null",
        "apartment": {
            "id": "integer",
            "name": "string",
            "ubicacion": "string|null",
            "building": {
                "id": "integer",
                "name": "string",
                "address": "string|null",
                "description": "string|null",
                "location_link": "string|null",
                "image": "string|null"
            }
        }
    }
}
```

#### Variables disponibles:
- `tenant.apartment.id`: ID único del apartamento
- `tenant.apartment.name`: Nombre/número del apartamento (ej: "101", "A-5")
- `tenant.apartment.ubicacion`: Ubicación del apartamento (ej: "Primer piso")
- `tenant.apartment.building.id`: ID único del edificio
- `tenant.apartment.building.name`: Nombre del edificio
- `tenant.apartment.building.address`: Dirección del edificio
- `tenant.apartment.building.description`: Descripción del edificio
- `tenant.apartment.building.location_link`: Enlace a Google Maps u otro mapa
- `tenant.apartment.building.image`: URL de la imagen del edificio

---

## Gestión de Dispositivos

### 4. Obtener Dispositivos del Tenant

**Endpoint:** `GET /tenant/devices`  
**Autenticación:** Bearer Token requerido  

#### Response Success (200):
```json
{
    "own_devices": [
        {
            "id": "integer",
            "name": "string",
            "status": "boolean",
            "ubicacion": "string|null",
            "brand": "string|null",
            "model": "string|null",
            "system": "string|null",
            "device_type": "string|null",
            "icon_id": "string|null",
            "name_device": {
                "id": "integer",
                "name": "string",
                "status": "boolean"
            }
        }
    ],
    "shared_devices": [
        {
            "id": "integer",
            "name": "string",
            "status": "boolean",
            "ubicacion": "string|null",
            "brand": "string|null",
            "model": "string|null",
            "system": "string|null",
            "device_type": "string|null",
            "icon_id": "string|null",
            "name_device": {
                "id": "integer",
                "name": "string",
                "status": "boolean"
            },
            "owner": {
                "id": "integer",
                "name": "string",
                "email": "string"
            }
        }
    ]
}
```

#### Variables disponibles:
- `own_devices[]`: Array de dispositivos propios del tenant
- `shared_devices[]`: Array de dispositivos compartidos con el tenant
- `device.id`: ID único del dispositivo
- `device.name`: Nombre personalizado del dispositivo
- `device.status`: Estado del dispositivo (true = activo, false = inactivo)
- `device.ubicacion`: Ubicación física del dispositivo en el apartamento
- `device.brand`: Marca del dispositivo
- `device.model`: Modelo específico del dispositivo
- `device.system`: Sistema operativo o tipo de sistema
- `device.device_type`: Tipo de dispositivo (ej: "Television", "Air Conditioner")
- `device.icon_id`: ID del icono para mostrar en la interfaz
- `device.name_device`: Información completa del tipo de dispositivo
- `device.name_device.id`: ID único del tipo de dispositivo
- `device.name_device.name`: Nombre del tipo de dispositivo
- `device.name_device.status`: Estado del tipo de dispositivo
- `shared_devices[].owner`: Información del propietario original del dispositivo compartido

---

## Gestión de Tickets

### 5. Obtener Lista de Tickets

**Endpoint:** `GET /tenant/tickets`  
**Autenticación:** Bearer Token requerido  

#### Query Parameters (opcionales):
- `status`: Filtrar por estado (`all`, `open`, `in_progress`, `resolved`, `closed`, `cancelled`)

#### Ejemplo: `GET /tenant/tickets?status=open`

#### Response Success (200):
```json
{
    "tickets": [
        {
            "id": "integer",
            "title": "string",
            "description": "string",
            "category": "string",
            "status": "string",
            "priority": "string",
            "created_at": "timestamp",
            "updated_at": "timestamp",
            "device": {
                "id": "integer",
                "name": "string",
                "brand": "string|null",
                "model": "string|null",
                "system": "string|null",
                "device_type": "string|null"
            },
            "technical": {
                "id": "integer",
                "name": "string",
                "email": "string",
                "phone": "string|null"
            },
            "histories_count": "integer"
        }
    ]
}
```

#### Variables disponibles:
- `tickets[]`: Array de tickets del tenant
- `ticket.id`: ID único del ticket
- `ticket.title`: Título del ticket
- `ticket.description`: Descripción detallada del problema
- `ticket.category`: Categoría del ticket (ej: "Hardware", "Software", "Conectividad")
- `ticket.status`: Estado actual (`open`, `in_progress`, `resolved`, `closed`, `cancelled`)
- `ticket.priority`: Prioridad (`low`, `medium`, `high`, `urgent`)
- `ticket.created_at`: Fecha y hora de creación (ISO 8601)
- `ticket.updated_at`: Fecha y hora de última actualización (ISO 8601)
- `ticket.device`: Información del dispositivo relacionado
- `ticket.technical`: Información del técnico asignado (null si no hay técnico)
- `ticket.histories_count`: Número de entradas en el historial del ticket
- `ticket.attachments`: Array de archivos adjuntos (imágenes/videos) del ticket

---

### 6. Crear Nuevo Ticket

**Endpoint:** `POST /tenant/tickets`  
**Autenticación:** Bearer Token requerido  

#### Request Body (Multipart/Form-Data):
```json
{
    "device_id": "integer (required)",
    "category": "string (required)",
    "title": "string (required, max:255)",
    "description": "string (required)",
    "priority": "string (optional: low|medium|high|urgent, default: medium)",
    "attachments[]": "file[] (optional, max:5 files, 20MB each, jpeg|png|jpg|gif|webp|mp4|mov|avi|wmv)"
}
```

#### Response Success (201):
```json
{
    "ticket": {
        "id": "integer",
        "title": "string",
        "description": "string",
        "category": "string",
        "status": "string",
        "priority": "string",
        "created_at": "timestamp",
        "attachments": [
            {
                "filename": "string",
                "path": "string",
                "url": "string",
                "mime_type": "string",
                "size": "integer"
            }
        ]
    },
    "message": "Ticket created successfully with attachments"
}
```

#### Response Error (422):
```json
{
    "message": "string",
    "errors": {
        "device_id": ["string"],
        "category": ["string"],
        "title": ["string"],
        "description": ["string"]
    }
}
```

---

### 7. Obtener Detalle de Ticket

**Endpoint:** `GET /tenant/tickets/{ticket_id}`  
**Autenticación:** Bearer Token requerido  

#### Response Success (200):
```json
{
    "ticket": {
        "id": "integer",
        "title": "string",
        "description": "string",
        "category": "string",
        "status": "string",
        "priority": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "device": {
            "id": "integer",
            "name": "string",
            "brand": "string|null",
            "model": "string|null",
            "system": "string|null",
            "device_type": "string|null",
            "ubicacion": "string|null"
        },
        "technical": {
            "id": "integer",
            "name": "string",
            "email": "string",
            "phone": "string|null"
        },
        "histories": [
            {
                "id": "integer",
                "action": "string",
                "description": "string",
                "user_name": "string",
                "created_at": "timestamp"
            }
        ]
    }
}
```

#### Variables adicionales disponibles:
- `ticket.histories[]`: Array completo del historial del ticket
- `history.id`: ID único de la entrada del historial
- `history.action`: Acción realizada (ej: "created", "assigned", "updated", "resolved")
- `history.description`: Descripción de la acción
- `history.user_name`: Nombre del usuario que realizó la acción
- `history.created_at`: Fecha y hora de la acción

---

## Información de Propiedad

### 8. Obtener Información del Apartamento

**Endpoint:** `GET /tenant/apartment`  
**Autenticación:** Bearer Token requerido  

#### Response Success (200):
```json
{
    "apartment": {
        "id": "integer",
        "name": "string",
        "ubicacion": "string|null",
        "status": "boolean",
        "other_tenants": [
            {
                "id": "integer",
                "name": "string",
                "email": "string",
                "phone": "string|null",
                "photo": "string|null"
            }
        ],
        "building": {
            "id": "integer",
            "name": "string",
            "address": "string|null",
            "description": "string|null",
            "location_link": "string|null",
            "image": "string|null"
        }
    }
}
```

#### Variables disponibles:
- `apartment.status`: Estado del apartamento (true = activo, false = inactivo)
- `apartment.other_tenants[]`: Array de otros inquilinos en el mismo apartamento
- `other_tenant.id`: ID del otro inquilino
- `other_tenant.name`: Nombre del otro inquilino
- `other_tenant.email`: Email del otro inquilino
- `other_tenant.phone`: Teléfono del otro inquilino
- `other_tenant.photo`: URL de la foto del otro inquilino

---

### 9. Obtener Información del Edificio

**Endpoint:** `GET /tenant/building`  
**Autenticación:** Bearer Token requerido  

#### Response Success (200):
```json
{
    "building": {
        "id": "integer",
        "name": "string",
        "managing_company": "string|null",
        "address": "string|null",
        "description": "string|null",
        "location_link": "string|null",
        "image": "string|null",
        "status": "boolean",
        "owner": {
            "id": "integer",
            "name": "string",
            "email": "string",
            "phone": "string|null",
            "photo": "string|null"
        }
    }
}
```

#### Variables disponibles:
- `building.managing_company`: Empresa administradora del edificio
- `building.status`: Estado del edificio (true = activo, false = inactivo)
- `building.owner`: Información completa del propietario/superintendente

---

### 10. Obtener Lista de Porteros/Conserjes

**Endpoint:** `GET /tenant/doormen`  
**Autenticación:** Bearer Token requerido  

#### Response Success (200):
```json
{
    "doormen": [
        {
            "id": "integer",
            "name": "string",
            "email": "string",
            "phone": "string|null",
            "photo": "string|null",
            "shift": "string"
        }
    ]
}
```

#### Variables disponibles:
- `doormen[]`: Array de porteros/conserjes del edificio
- `doorman.shift`: Turno de trabajo (`morning`, `afternoon`, `night`)

---

### 11. Obtener Información del Propietario

**Endpoint:** `GET /tenant/owner`  
**Autenticación:** Bearer Token requerido  

#### Response Success (200):
```json
{
    "owner": {
        "id": "integer",
        "name": "string",
        "email": "string",
        "phone": "string|null",
        "photo": "string|null"
    }
}
```

---

## Gestión de Contraseñas

### 12. Cambiar Contraseña

**Endpoint:** `POST /tenant/change-password`  
**Autenticación:** Bearer Token requerido  

#### Request Body:
```json
{
    "current_password": "string (required)",
    "new_password": "string (required, min:8)",
    "new_password_confirmation": "string (required, must match new_password)"
}
```

#### Response Success (200):
```json
{
    "message": "Password changed successfully"
}
```

#### Response Error (400):
```json
{
    "error": "Current password is incorrect"
}
```

#### Response Error (422):
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "new_password": [
            "The new password must be at least 8 characters."
        ],
        "new_password_confirmation": [
            "The new password confirmation does not match."
        ]
    }
}
```

#### Variables disponibles:
- `current_password`: Contraseña actual del usuario
- `new_password`: Nueva contraseña (mínimo 8 caracteres)
- `new_password_confirmation`: Confirmación de la nueva contraseña

---

### 13. Solicitar Reset de Contraseña

**Endpoint:** `POST /tenant/reset-password-request`  
**Autenticación:** Bearer Token requerido  

#### Request Body:
No requiere body. El sistema utiliza la información del token para identificar al usuario.

#### Response Success (200):
```json
{
    "message": "Password has been reset. Check your email for the temporary password."
}
```

#### Response Error (500):
```json
{
    "error": "Failed to reset password"
}
```

#### Funcionalidad:
- **Contraseña temporal**: Se genera automáticamente usando el email del usuario como contraseña
- **Actualización**: La contraseña se actualiza inmediatamente en la base de datos
- **Notificación por email**: Se envía un email automático con:
  - La nueva contraseña temporal
  - Instrucciones para cambiar la contraseña
  - Recordatorio de que es una contraseña temporal
- **Acceso inmediato**: El usuario puede hacer login inmediatamente con la nueva contraseña temporal
- **Recomendación**: Se recomienda al usuario cambiar la contraseña temporal después del login

#### Flujo recomendado:
1. Usuario solicita reset de contraseña desde la app
2. Sistema genera contraseña temporal = email del usuario
3. Se actualiza la contraseña en BD
4. Se envía email con la nueva contraseña
5. Usuario recibe email y hace login con la contraseña temporal
6. Usuario cambia la contraseña usando el endpoint `/tenant/change-password`

---





---

## Códigos de Estado HTTP

| Código | Descripción | Uso |
|--------|-------------|-----|
| 200 | OK | Solicitud exitosa |
| 201 | Created | Recurso creado exitosamente |
| 401 | Unauthorized | Token inválido o faltante |
| 403 | Forbidden | Sin permisos para el recurso |
| 404 | Not Found | Recurso no encontrado |
| 422 | Unprocessable Entity | Error de validación |
| 500 | Internal Server Error | Error del servidor |

---

## Formato de Fechas

Todas las fechas se devuelven en formato **ISO 8601**:
```
2024-01-15T10:30:00.000000Z
```

---

## Estructura de Errores

### Error de Validación (422):
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "field_name": [
            "Error message 1",
            "Error message 2"
        ]
    }
}
```

### Error General:
```json
{
    "error": "Error message",
    "message": "Additional details"
}
```

---

## Ejemplo de Flujo de Integración

### 1. Autenticación:
```javascript
// Login
const loginResponse = await fetch('/api/tenant/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'tenant@example.com',
        password: 'password'
    })
});

const { token, user, tenant } = await loginResponse.json();
// Guardar token para requests posteriores
```

### 2. Obtener datos del tenant:
```javascript
// Configurar headers con token
const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

// Obtener perfil
const profile = await fetch('/api/tenant/me', { headers });

// Obtener dispositivos
const devices = await fetch('/api/tenant/devices', { headers });

// Obtener tickets
const tickets = await fetch('/api/tenant/tickets', { headers });
```

### 3. Crear ticket con archivos adjuntos:
```javascript
// Crear FormData para archivos
const formData = new FormData();
formData.append('device_id', '1');
formData.append('category', 'Hardware');
formData.append('title', 'Device not working');
formData.append('description', 'The device stopped working this morning');
formData.append('priority', 'medium');

// Agregar archivos (imágenes/videos)
formData.append('attachments[]', imageFile1);
formData.append('attachments[]', videoFile1);

const newTicket = await fetch('/api/tenant/tickets', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        // NO incluir 'Content-Type' para FormData
    },
    body: formData
});
```

### 4. Cambiar contraseña:
```javascript
const changePassword = await fetch('/api/tenant/change-password', {
    method: 'POST',
    headers,
    body: JSON.stringify({
        current_password: 'old_password',
        new_password: 'new_secure_password',
        new_password_confirmation: 'new_secure_password'
    })
});
```

### 5. Solicitar reset de contraseña:
```javascript
const resetPassword = await fetch('/api/tenant/reset-password-request', {
    method: 'POST',
    headers
});

const result = await resetPassword.json();
console.log(result.message); // "Password has been reset. Check your email for the temporary password."
```

### 6. Obtener notificaciones:
```javascript
const notifications = await fetch('/api/tenant/notifications', { headers });
const notifData = await notifications.json();

console.log(notifData.notifications); 
// Array de notificaciones del usuario
```

---

## Notas Importantes para Desarrolladores

1. **Autenticación**: Todos los endpoints excepto `/tenant/login` requieren el header `Authorization: Bearer {token}`

2. **Tipos de datos**:
   - `integer`: Números enteros
   - `string`: Cadenas de texto
   - `boolean`: true/false
   - `timestamp`: Fecha en formato ISO 8601
   - `string|null`: Puede ser string o null

3. **Arrays**: Los campos que terminan en `[]` son arrays que pueden estar vacíos

4. **Filtros**: El endpoint de tickets soporta filtrado por status usando query parameters

5. **Relaciones**: Los datos están relacionados jerárquicamente: Tenant → Apartment → Building

6. **Seguridad**: El middleware valida que cada tenant solo acceda a sus propios datos

7. **Rate Limiting**: Considera implementar rate limiting en producción

8. **CORS**: Configurar CORS si la app móvil está en un dominio diferente

9. **Gestión de contraseñas**:
   - **Contraseña por defecto**: Nuevos usuarios tienen como contraseña inicial su dirección de email
   - **Contraseña temporal**: Al resetear, se genera una contraseña temporal igual al email
   - **Notificaciones por email**: Se envían automáticamente al resetear contraseñas
   - **Cambio recomendado**: Usuarios deben cambiar contraseñas temporales después del login

10. **Sistema de emails**:
    - **Reset de contraseña**: Email automático con nueva contraseña temporal
    - **Nuevos usuarios**: Email de bienvenida con credenciales iniciales
    - **Templates**: HTML responsivo con diseño profesional

11. **Gestión de archivos adjuntos**:
    - **Formatos soportados**: Imágenes (JPEG, PNG, GIF, WebP) y Videos (MP4, MOV, AVI, WMV)
    - **Límite de tamaño**: 20MB por archivo, máximo 5 archivos por request
    - **Almacenamiento**: Los archivos se guardan en `storage/app/public/ticket_attachments/`
    - **URLs públicas**: Se generan automáticamente para acceso directo
    - **Metadata**: Se almacena información completa (nombre, tamaño, tipo MIME, fecha)

12. **Tipos de dispositivos (Name Devices)**:
    - **Propósito**: Categorización estándar de dispositivos (TV, AC, Refrigerator, etc.)
    - **Relación**: Device → name_device (belongsTo)
    - **Estados**: Solo se muestran tipos activos (status = true)
    - **Uso**: Para formularios, filtros y validaciones

13. **Estructura de respuestas mejorada**:
    - **Dispositivos**: Incluyen información completa de `name_device` y `icon_id`
    - **Tickets**: Incluyen array de `attachments` con URLs públicas
    - **Consistencia**: Todos los endpoints siguen el mismo formato de respuesta

Esta documentación proporciona toda la información necesaria para integrar la API en cualquier aplicación frontend, especialmente React Native, con soporte completo para archivos multimedia y gestión avanzada de dispositivos.
