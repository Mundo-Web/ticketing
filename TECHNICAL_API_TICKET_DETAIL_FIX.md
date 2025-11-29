# ✅ ENDPOINT ARREGLADO: Detalle de Ticket para Técnicos

## 🐛 Problema Identificado

El desarrollador móvil reportó **403 Forbidden** al intentar acceder al detalle del ticket usando:
```
GET /api/tenant/tickets/{id}
```

### ¿Por qué fallaba?

1. **Endpoint incorrecto**: `/api/tenant/tickets/{id}` es **SOLO para members**
2. **Middleware restrictivo**: Requiere `tenant` middleware que valida `tenant_id`
3. **Técnicos NO son tenants**: Por eso recibían 403 Forbidden

---

## ✅ Solución Implementada

### Endpoint Correcto para Técnicos

```
GET /api/tickets/{ticketId}/detail
```

**Autenticación**: ✅ NO requiere auth (público)  
**Middleware**: ❌ Sin restricciones de tenant  
**Uso**: Para técnicos únicamente

---

## 📋 Estructura Completa del Response

### Request

```bash
GET https://adkassist.com/api/tickets/123/detail
```

**Headers**: Ninguno necesario (público)

### Response Success (200)

```json
{
  "ticket": {
    "id": 123,
    "title": "Laptop not turning on",
    "description": "The laptop won't start after the last update",
    "category": "Hardware",
    "status": "in_progress",
    "priority": "high",
    "created_at": "2024-11-20T10:00:00.000000Z",
    "updated_at": "2024-11-20T14:30:00.000000Z",
    
    "device": {
      "id": 45,
      "name": "Dell Inspiron 15",
      "brand": "Dell",
      "model": "Inspiron 15 3000",
      "system": "Windows 11",
      "device_type": "Laptop",
      "ubicacion": "Living Room",
      "icon_id": 3,
      "device_image": "/storage/devices/laptop.png",
      "name_device": {
        "id": 2,
        "name": "Laptop",
        "status": true,
        "image": "/storage/device-types/laptop.svg"
      }
    },
    
    "technical": {
      "id": 5,
      "name": "Juan Pérez",
      "email": "juan@technical.com",
      "phone": "+1234567890",
      "photo": "/storage/technicals/juan.jpg",
      "shift": "morning"
    },
    
    "member": {
      "id": 25,
      "name": "María García",
      "email": "maria@example.com",
      "phone": "+9876543210",
      "photo": "/storage/members/maria.jpg",
      "apartment": {
        "id": 101,
        "number": "301",
        "building": {
          "id": 5,
          "name": "Torre A",
          "address": "Av. Principal 123, Lima"
        }
      }
    },
    
    "histories": [
      {
        "id": 450,
        "action": "status_changed",
        "description": "Status changed from 'open' to 'in_progress'",
        "user_name": "Juan Pérez",
        "created_at": "2024-11-20T11:00:00.000000Z",
        "technical": {
          "id": 5,
          "name": "Juan Pérez"
        }
      },
      {
        "id": 449,
        "action": "comment_added",
        "description": "I'll check the device this afternoon",
        "user_name": "Juan Pérez",
        "created_at": "2024-11-20T10:30:00.000000Z",
        "technical": {
          "id": 5,
          "name": "Juan Pérez"
        }
      },
      {
        "id": 448,
        "action": "ticket_created",
        "description": "Ticket created by member",
        "user_name": "María García",
        "created_at": "2024-11-20T10:00:00.000000Z",
        "technical": null
      }
    ]
  }
}
```

### Response Error (404)

```json
{
  "error": "Ticket not found"
}
```

### Response Error (500)

```json
{
  "error": "Error al obtener detalle del ticket",
  "message": "Database connection failed"
}
```

---

## 🔄 Timeline (Histories) Explicado

El array `histories` contiene **TODOS los eventos** del ticket en orden cronológico inverso (más reciente primero).

### Tipos de Acciones (action)

| Action | Descripción | user_name | technical |
|--------|-------------|-----------|-----------|
| `ticket_created` | Ticket creado | Member name | null |
| `status_changed` | Cambio de estado | Technical/Member | Technical object |
| `comment_added` | Comentario agregado | Technical/Member | Technical object si es técnico |
| `evidence_uploaded` | Evidencia subida | Technical/Member | Technical object si es técnico |
| `private_note_added` | Nota privada (solo técnicos) | Technical name | Technical object |
| `technical_assigned` | Técnico asignado | Admin/System | Technical object |
| `priority_changed` | Prioridad cambiada | Admin/Technical | Technical object |

### Ejemplo de Timeline Visual

```
┌─────────────────────────────────────────────────┐
│ 🟢 Status changed to "in_progress"             │
│ Juan Pérez (Technical)                          │
│ Nov 20, 2024 11:00 AM                          │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 💬 "I'll check the device this afternoon"      │
│ Juan Pérez (Technical)                          │
│ Nov 20, 2024 10:30 AM                          │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ ✨ Ticket created                               │
│ María García (Member)                           │
│ Nov 20, 2024 10:00 AM                          │
└─────────────────────────────────────────────────┘
```

---

## 💻 Código React Native

### Service Method

```javascript
// services/TechnicalService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://adkassist.com/api';

class TechnicalService {
  /**
   * Obtener detalle completo de un ticket (con timeline)
   */
  async getTicketDetail(ticketId) {
    try {
      // NO requiere token, pero si lo tienes puedes incluirlo
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.get(
        `${API_URL}/tickets/${ticketId}/detail`,
        {
          headers: {
            'Accept': 'application/json',
            // Token opcional pero recomendado
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }
      );
      
      return {
        success: true,
        ticket: response.data.ticket
      };
    } catch (error) {
      console.error('Error getting ticket detail:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener detalle del ticket'
      };
    }
  }
}

export default new TechnicalService();
```

### Screen Component

```javascript
// screens/Technical/TicketDetailScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Linking
} from 'react-native';
import TechnicalService from '../../services/TechnicalService';

const TicketDetailScreen = ({ route, navigation }) => {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicketDetail();
  }, [ticketId]);

  const loadTicketDetail = async () => {
    setLoading(true);
    const result = await TechnicalService.getTicketDetail(ticketId);
    
    if (result.success) {
      setTicket(result.ticket);
    } else {
      Alert.alert('Error', result.error);
    }
    setLoading(false);
  };

  const callMember = () => {
    if (ticket?.member?.phone) {
      Linking.openURL(`tel:${ticket.member.phone}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ticket no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header del Ticket */}
      <View style={styles.header}>
        <Text style={styles.title}>{ticket.title}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, styles[`badge_${ticket.status}`]]}>
            <Text style={styles.badgeText}>{ticket.status}</Text>
          </View>
          <View style={[styles.badge, styles[`badge_${ticket.priority}`]]}>
            <Text style={styles.badgeText}>{ticket.priority}</Text>
          </View>
        </View>
      </View>

      {/* Descripción */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>{ticket.description}</Text>
      </View>

      {/* Información del Member */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Member</Text>
        <View style={styles.memberInfo}>
          {ticket.member?.photo && (
            <Image 
              source={{ uri: ticket.member.photo }} 
              style={styles.avatar}
            />
          )}
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>{ticket.member?.name}</Text>
            <Text style={styles.memberEmail}>{ticket.member?.email}</Text>
            <Text style={styles.memberPhone}>{ticket.member?.phone}</Text>
            {ticket.member?.apartment && (
              <Text style={styles.memberLocation}>
                {ticket.member.apartment.building?.name} - Apt {ticket.member.apartment.number}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.callButton}
            onPress={callMember}
          >
            <Text style={styles.callButtonText}>📞 Llamar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Información del Device */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device</Text>
        <View style={styles.deviceInfo}>
          {ticket.device?.device_image && (
            <Image 
              source={{ uri: ticket.device.device_image }} 
              style={styles.deviceImage}
            />
          )}
          <View style={styles.deviceDetails}>
            <Text style={styles.deviceName}>{ticket.device?.name}</Text>
            <Text style={styles.deviceBrand}>
              {ticket.device?.brand} {ticket.device?.model}
            </Text>
            <Text style={styles.deviceLocation}>📍 {ticket.device?.ubicacion}</Text>
          </View>
        </View>
      </View>

      {/* Timeline (Histories) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        {ticket.histories?.map((history) => (
          <View key={history.id} style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <Text>
                {history.action === 'status_changed' ? '🔄' :
                 history.action === 'comment_added' ? '💬' :
                 history.action === 'evidence_uploaded' ? '📸' :
                 history.action === 'private_note_added' ? '🔒' :
                 history.action === 'ticket_created' ? '✨' : '📝'}
              </Text>
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyDescription}>{history.description}</Text>
              <Text style={styles.historyMeta}>
                {history.user_name} • {new Date(history.created_at).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Botones de Acción */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {/* Cambiar estado */}}
        >
          <Text style={styles.actionButtonText}>Cambiar Estado</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {/* Agregar comentario */}}
        >
          <Text style={styles.actionButtonText}>Agregar Comentario</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  badges: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badge_open: {
    backgroundColor: '#3B82F6',
  },
  badge_in_progress: {
    backgroundColor: '#F59E0B',
  },
  badge_resolved: {
    backgroundColor: '#10B981',
  },
  badge_high: {
    backgroundColor: '#EF4444',
  },
  badgeText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  memberDetails: {
    flex: 1,
    marginLeft: 15,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  memberPhone: {
    fontSize: 14,
    color: '#666',
  },
  memberLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  callButton: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceImage: {
    width: 50,
    height: 50,
  },
  deviceDetails: {
    marginLeft: 15,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceBrand: {
    fontSize: 14,
    color: '#666',
  },
  deviceLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  historyIcon: {
    width: 30,
    marginRight: 10,
  },
  historyContent: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  historyMeta: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    padding: 20,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TicketDetailScreen;
```

---

## ✅ Resumen para Mobile Developer

### ❌ ANTES (Incorrecto)

```javascript
// ❌ NO USAR - Solo para members
GET /api/tenant/tickets/123
// Error: 403 Forbidden
```

### ✅ AHORA (Correcto)

```javascript
// ✅ USAR - Para técnicos
GET /api/tickets/123/detail
// Success: 200 OK
```

### 🔑 Diferencias Clave

| Característica | Tenant Endpoint | Technical Endpoint |
|----------------|-----------------|---------------------|
| URL | `/api/tenant/tickets/{id}` | `/api/tickets/{id}/detail` |
| Auth | ✅ Requerida (tenant) | ❌ No requerida |
| Middleware | `auth:sanctum` + `tenant` | Ninguno |
| Usuario | Solo el member dueño | Cualquier técnico |
| Timeline | ✅ Incluido | ✅ Incluido |
| Member Info | ❌ No incluido | ✅ Incluido |

---

## 📝 Actualizar Documentación

El desarrollador móvil debe actualizar en su código:

1. ✅ Cambiar URL de endpoint
2. ✅ Adaptar parsing del response
3. ✅ Mostrar timeline correctamente
4. ✅ Agregar info del member
5. ✅ Botón para llamar al member

---

**Problema resuelto** ✅  
**Fecha**: 2024-11-29  
**Endpoint listo para producción** 🚀
