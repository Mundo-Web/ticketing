# 📱 API: Detalle de Ticket para Técnicos

## 🎯 Propósito

Endpoint que permite a los **técnicos** obtener el detalle completo de un ticket, incluyendo:
- Información del ticket
- Device asociado
- Member (usuario) que creó el ticket
- Apartamento y edificio del member
- Historial completo del ticket
- Técnico asignado

## 🔗 Endpoint

```
GET /api/tickets/{ticketId}/detail
```

### Base URL
```
https://adkassist.com/api/tickets/{ticketId}/detail
```

### Método
`GET`

### Autenticación
❌ **NO requiere autenticación**
- Endpoint público para técnicos
- No necesita token Bearer
- No necesita middleware

---

## 📥 Request

### URL Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `ticketId` | integer | ✅ Sí | ID del ticket a consultar |

### Headers

```json
{
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

### Ejemplo de Request

**JavaScript/React Native:**
```javascript
const ticketId = 38;

const response = await fetch(`https://adkassist.com/api/tickets/${ticketId}/detail`, {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

const data = await response.json();
console.log(data.ticket);
```

**cURL:**
```bash
curl -X GET "https://adkassist.com/api/tickets/38/detail" \
     -H "Accept: application/json"
```

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://adkassist.com/api/tickets/38/detail" `
    -Method GET `
    -Headers @{"Accept"="application/json"}
```

---

## 📤 Response

### Success Response (200 OK)

```json
{
    "ticket": {
        "id": 38,
        "title": "Refrigerador no enfría",
        "description": "El refrigerador dejó de enfriar desde ayer",
        "category": "appliance",
        "status": "pending",
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
            "email": "juan.perez@technical.com",
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

### Error Response (404 Not Found)

```json
{
    "error": "Ticket not found"
}
```

### Error Response (500 Internal Server Error)

```json
{
    "error": "Error al obtener detalle del ticket",
    "message": "Descripción detallada del error"
}
```

---

## 📊 Estructura de Datos

### Ticket Object

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | integer | No | ID único del ticket |
| `title` | string | No | Título del ticket |
| `description` | string | Sí | Descripción detallada |
| `category` | string | No | Categoría del ticket |
| `status` | string | No | Estado: `pending`, `in_progress`, `completed`, `cancelled` |
| `priority` | string | No | Prioridad: `low`, `medium`, `high`, `urgent` |
| `created_at` | datetime | No | Fecha de creación |
| `updated_at` | datetime | No | Última actualización |
| `device` | object | Sí | Información del dispositivo |
| `technical` | object | Sí | Técnico asignado |
| `member` | object | Sí | Usuario que creó el ticket |
| `histories` | array | No | Historial de cambios |

### Device Object

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | integer | No | ID del dispositivo |
| `name` | string | No | Nombre del dispositivo |
| `brand` | string | Sí | Marca |
| `model` | string | Sí | Modelo |
| `system` | string | Sí | Sistema (ej: "Refrigeración") |
| `device_type` | string | Sí | Tipo de dispositivo |
| `ubicacion` | string | Sí | Ubicación del dispositivo |
| `icon_id` | integer | Sí | ID del ícono |
| `device_image` | string | Sí | URL de la imagen |
| `name_device` | object | Sí | Información adicional del tipo |

### Technical Object

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | integer | No | ID del técnico |
| `name` | string | No | Nombre completo |
| `email` | string | No | Email |
| `phone` | string | Sí | Teléfono |
| `photo` | string | Sí | URL de la foto |
| `shift` | string | Sí | Turno: `morning`, `afternoon`, `night` |

### Member Object

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | integer | No | ID del usuario |
| `name` | string | No | Nombre completo |
| `email` | string | No | Email |
| `phone` | string | Sí | Teléfono |
| `photo` | string | Sí | URL de la foto |
| `apartment` | object | Sí | Información del apartamento |

### History Object

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | integer | No | ID del registro |
| `action` | string | No | Tipo de acción |
| `description` | string | Sí | Descripción de la acción |
| `user_name` | string | No | Usuario que realizó la acción |
| `created_at` | datetime | No | Fecha de la acción |
| `technical` | object | Sí | Técnico asociado (si aplica) |

---

## 🔧 Implementación en React Native

### Servicio API

```javascript
// services/technicalApi.js

const API_BASE_URL = 'https://adkassist.com/api';

export const technicalApi = {
    /**
     * Obtener detalle de un ticket
     * @param {number} ticketId - ID del ticket
     * @returns {Promise<Object>} Datos del ticket
     */
    async getTicketDetail(ticketId) {
        try {
            const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/detail`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Ticket no encontrado');
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.ticket;
            
        } catch (error) {
            console.error('Error fetching ticket detail:', error);
            throw error;
        }
    }
};
```

### Hook Personalizado

```javascript
// hooks/useTicketDetail.js

import { useState, useEffect } from 'react';
import { technicalApi } from '../services/technicalApi';

export const useTicketDetail = (ticketId) => {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTicketDetail = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const data = await technicalApi.getTicketDetail(ticketId);
                setTicket(data);
                
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (ticketId) {
            fetchTicketDetail();
        }
    }, [ticketId]);

    return { ticket, loading, error };
};
```

### Componente de Ejemplo

```javascript
// screens/TicketDetailScreen.js

import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useTicketDetail } from '../hooks/useTicketDetail';

const TicketDetailScreen = ({ route }) => {
    const { ticketId } = route.params;
    const { ticket, loading, error } = useTicketDetail(ticketId);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text>Cargando detalles del ticket...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.error}>Error: {error}</Text>
            </View>
        );
    }

    if (!ticket) {
        return (
            <View style={styles.centered}>
                <Text>No se encontró el ticket</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{ticket.title}</Text>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{ticket.status}</Text>
                </View>
            </View>

            {/* Device Info */}
            {ticket.device && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dispositivo</Text>
                    <Text>{ticket.device.name}</Text>
                    <Text>Marca: {ticket.device.brand}</Text>
                    <Text>Modelo: {ticket.device.model}</Text>
                    <Text>Ubicación: {ticket.device.ubicacion}</Text>
                </View>
            )}

            {/* Member Info */}
            {ticket.member && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Usuario</Text>
                    <Text>{ticket.member.name}</Text>
                    <Text>{ticket.member.email}</Text>
                    {ticket.member.apartment && (
                        <>
                            <Text>Apto: {ticket.member.apartment.number}</Text>
                            <Text>Edificio: {ticket.member.apartment.building?.name}</Text>
                        </>
                    )}
                </View>
            )}

            {/* Technical Info */}
            {ticket.technical && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Técnico Asignado</Text>
                    <Text>{ticket.technical.name}</Text>
                    <Text>{ticket.technical.email}</Text>
                    <Text>{ticket.technical.phone}</Text>
                </View>
            )}

            {/* History */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Historial</Text>
                {ticket.histories.map((history) => (
                    <View key={history.id} style={styles.historyItem}>
                        <Text style={styles.historyDate}>
                            {new Date(history.created_at).toLocaleString()}
                        </Text>
                        <Text>{history.description}</Text>
                        <Text style={styles.historyUser}>Por: {history.user_name}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        backgroundColor: 'white',
        padding: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    historyItem: {
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
        paddingLeft: 12,
        marginBottom: 12,
    },
    historyDate: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    historyUser: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    error: {
        color: 'red',
        fontSize: 16,
    },
});

export default TicketDetailScreen;
```

---

## ⚠️ Notas Importantes

### IDs de Tickets Válidos
Los tickets en producción tienen los siguientes IDs:
```
22, 25, 27, 29, 31, 32, 33, 34, 35, 36, 38, 39
```

**❌ NO usar IDs inexistentes** como 86, 87, etc. → Devolverá 404

### Manejo de Null Values
Todos los objetos anidados (`device`, `technical`, `member`, `apartment`, `building`) pueden ser `null`. Asegúrate de validar:

```javascript
// ✅ CORRECTO
if (ticket.member?.apartment?.building) {
    console.log(ticket.member.apartment.building.name);
}

// ❌ INCORRECTO (puede causar error)
console.log(ticket.member.apartment.building.name);
```

### CORS
Si desarrollas desde `localhost`, asegúrate de que el servidor tenga CORS habilitado. Los headers están configurados en `public/.htaccess`:

```apache
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, Accept, Origin"
```

---

## 🚀 Deploy y Testing

### 1. Verificar que el código esté en producción

```bash
# SSH al servidor
ssh adkhelpc@adkassist.com -p 65002
cd /home/adkhelpc/public_html

# Pull cambios
git pull origin main

# Cache routes
php artisan route:cache
php artisan config:cache
```

### 2. Probar endpoint

```bash
curl https://adkassist.com/api/tickets/38/detail
```

### 3. Verificar respuesta
- Status: `200 OK`
- Headers: `Access-Control-Allow-Origin: *`
- Content-Type: `application/json`
- Body: JSON con estructura de ticket

---

## 🐛 Troubleshooting

### Error 404 - Not Found
**Causa:** El código no está desplegado en producción o la ruta no está en el cache.

**Solución:**
```bash
php artisan route:cache
php artisan route:list --path=api/tickets
```

### Error 500 - Internal Server Error
**Causa:** Error en el eager loading o relación null.

**Solución:** Revisar logs de Laravel:
```bash
tail -f storage/logs/laravel.log
```

### Error CORS
**Causa:** Headers CORS no configurados o bloqueados por servidor.

**Solución:** Verificar que `public/.htaccess` tenga los headers CORS.

### Ticket not found
**Causa:** ID de ticket inválido o no existe.

**Solución:** Usar solo IDs válidos (22-39).

---

## 📞 Soporte

Para problemas con el API, contactar al equipo de backend con:
- ID del ticket que intentaste consultar
- Mensaje de error completo
- Timestamp del request
- Logs del servidor (si tienes acceso)
