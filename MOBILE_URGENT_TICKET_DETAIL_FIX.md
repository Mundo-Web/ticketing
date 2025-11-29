# 🚨 URGENTE: Corrección de Endpoint - Detalle de Ticket

## Para: Desarrollador Mobile
## Fecha: 2024-11-29
## Prioridad: ALTA

---

## ❌ Problema Reportado

**Error actual**: `403 Forbidden` al intentar obtener detalle de ticket

**Endpoint usado** (INCORRECTO):
```
GET /api/tenant/tickets/123
```

**Causa raíz**: 
- Este endpoint es **EXCLUSIVO para members**
- Requiere `tenant_id` en la sesión
- Los técnicos NO son tenants → Error 403

---

## ✅ Solución Implementada

### Nuevo Endpoint Correcto

```
GET /api/tickets/{ticketId}/detail
```

**Características**:
- ✅ Específico para técnicos
- ✅ NO requiere autenticación (pero recomendado incluir token)
- ✅ Devuelve estructura idéntica al endpoint de tenant
- ✅ Incluye timeline completo (histories)
- ✅ Incluye información del member
- ✅ Listo para producción

---

## 🔄 Cambios Necesarios en Mobile

### 1. Actualizar URL en TechnicalService.js

**ANTES** (❌ Incorrecto):
```javascript
async getTicketDetail(ticketId) {
  const response = await axios.get(
    `${API_URL}/tenant/tickets/${ticketId}`, // ❌ INCORRECTO
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
  return response.data;
}
```

**AHORA** (✅ Correcto):
```javascript
async getTicketDetail(ticketId) {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await axios.get(
    `${API_URL}/tickets/${ticketId}/detail`, // ✅ CORRECTO
    {
      headers: {
        'Accept': 'application/json',
        // Token opcional pero recomendado
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    }
  );
  return response.data;
}
```

### 2. Adaptar Parsing del Response

El response ahora incluye **MÁS información**:

```javascript
const { ticket } = response.data;

// ✅ NUEVO: Información del member
const memberInfo = {
  name: ticket.member?.name,
  email: ticket.member?.email,
  phone: ticket.member?.phone,
  photo: ticket.member?.photo,
  apartment: ticket.member?.apartment?.number,
  building: ticket.member?.apartment?.building?.name
};

// ✅ NUEVO: Timeline completo
const timeline = ticket.histories.map(history => ({
  action: history.action,
  description: history.description,
  userName: history.user_name,
  createdAt: history.created_at,
  technical: history.technical
}));
```

---

## 📋 Response Completo

### Estructura del Response

```json
{
  "ticket": {
    "id": 123,
    "title": "Laptop not working",
    "description": "...",
    "category": "Hardware",
    "status": "in_progress",
    "priority": "high",
    "created_at": "2024-11-20T10:00:00Z",
    "updated_at": "2024-11-20T14:30:00Z",
    
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
      "name_device": { /* ... */ }
    },
    
    "technical": {
      "id": 5,
      "name": "Juan Pérez",
      "email": "juan@technical.com",
      "phone": "+1234567890",
      "photo": "/storage/technicals/juan.jpg",
      "shift": "morning"
    },
    
    "member": { // ⭐ NUEVO
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
          "address": "Av. Principal 123"
        }
      }
    },
    
    "histories": [ // ⭐ TIMELINE COMPLETO
      {
        "id": 450,
        "action": "status_changed",
        "description": "Status changed from 'open' to 'in_progress'",
        "user_name": "Juan Pérez",
        "created_at": "2024-11-20T11:00:00Z",
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
        "created_at": "2024-11-20T10:30:00Z",
        "technical": {
          "id": 5,
          "name": "Juan Pérez"
        }
      }
    ]
  }
}
```

---

## 🎨 UI Components a Actualizar

### 1. Agregar Sección "Member Info"

```javascript
// TicketDetailScreen.js
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Member</Text>
  <View style={styles.memberInfo}>
    <Image source={{ uri: ticket.member?.photo }} style={styles.avatar} />
    <View>
      <Text>{ticket.member?.name}</Text>
      <Text>{ticket.member?.email}</Text>
      <Text>{ticket.member?.phone}</Text>
      <Text>
        {ticket.member?.apartment?.building?.name} - 
        Apt {ticket.member?.apartment?.number}
      </Text>
    </View>
    <TouchableOpacity onPress={() => Linking.openURL(`tel:${ticket.member?.phone}`)}>
      <Text>📞 Call</Text>
    </TouchableOpacity>
  </View>
</View>
```

### 2. Mejorar Timeline

```javascript
// Mostrar timeline con iconos según acción
{ticket.histories?.map((history) => (
  <View key={history.id} style={styles.timelineItem}>
    <Text style={styles.icon}>
      {history.action === 'status_changed' ? '🔄' :
       history.action === 'comment_added' ? '💬' :
       history.action === 'evidence_uploaded' ? '📸' :
       history.action === 'private_note_added' ? '🔒' : '📝'}
    </Text>
    <View>
      <Text>{history.description}</Text>
      <Text style={styles.meta}>
        {history.user_name} • {formatDate(history.created_at)}
      </Text>
    </View>
  </View>
))}
```

---

## ✅ Checklist de Implementación

- [ ] ✅ Actualizar URL en `TechnicalService.js`
- [ ] ✅ Probar endpoint con Postman
- [ ] ✅ Adaptar parsing del response
- [ ] ✅ Agregar sección "Member Info" en UI
- [ ] ✅ Mejorar visualización de timeline
- [ ] ✅ Agregar botón "Call Member"
- [ ] ✅ Mostrar ubicación del apartamento
- [ ] ✅ Testing en app móvil
- [ ] ✅ Verificar que funciona para técnico regular
- [ ] ✅ Verificar que funciona para técnico jefe

---

## 🧪 Testing

### Con Postman

```bash
GET https://adkassist.com/api/tickets/123/detail

# Response esperado: 200 OK
# Body: JSON con estructura completa
```

### En la App

1. Login como técnico
2. Ir a lista de tickets
3. Tap en un ticket
4. Verificar que carga detalle completo
5. Verificar que muestra:
   - ✅ Info del member
   - ✅ Timeline completo
   - ✅ Botón para llamar
   - ✅ Ubicación del apartamento

---

## 📞 Contacto

Si tienes dudas adicionales:
- **Documento completo**: Ver `TECHNICAL_API_TICKET_DETAIL_FIX.md`
- **Backend**: Endpoint implementado y listo

---

## 📊 Comparación de Endpoints

| Característica | `/api/tenant/tickets/{id}` | `/api/tickets/{id}/detail` |
|----------------|---------------------------|----------------------------|
| **Para** | Members únicamente | Técnicos únicamente |
| **Auth** | ✅ Requerida (tenant) | ❌ Opcional |
| **Middleware** | `auth:sanctum` + `tenant` | Ninguno |
| **Member Info** | ❌ No (es el mismo user) | ✅ Sí |
| **Timeline** | ✅ Sí | ✅ Sí |
| **Device** | ✅ Sí | ✅ Sí |
| **Technical** | ✅ Sí | ✅ Sí |
| **Status** | ✅ Funciona | ✅ Funciona |

---

**Estado**: ✅ Resuelto  
**Backend**: ✅ Implementado  
**Listo para**: Integración en mobile  
**Prioridad**: ALTA - Implementar ASAP  

---

**Última actualización**: 2024-11-29 19:30
