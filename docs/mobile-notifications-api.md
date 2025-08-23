# API de Notificaciones para Aplicación Móvil (React Native)

## Descripción General

Esta documentación describe los endpoints API disponibles para la aplicación móvil React Native para gestionar notificaciones de members en tiempo real.

## Autenticación

Todos los endpoints requieren autenticación mediante **Laravel Sanctum**. El token debe incluirse en el header:

```
Authorization: Bearer {token}
```

## Base URL

```
http://localhost/api/tenant/
```

## Endpoints Disponibles

### 1. Obtener Notificaciones

**GET** `/notifications`

#### Descripción
Obtiene todas las notificaciones del member autenticado, ordenadas por fecha de creación (más recientes primero).

#### Headers
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-notification-id",
      "type": "ticket_assigned",
      "title": "Técnico Asignado",
      "message": "Se ha asignado un técnico a tu ticket #123",
      "data": {
        "ticket_id": 123,
        "technical_name": "Juan Pérez",
        "type": "ticket_assigned"
      },
      "read_at": null,
      "created_at": "2024-01-20T10:30:00.000000Z",
      "formatted_date": "hace 2 horas"
    }
  ],
  "unread_count": 5
}
```

#### Respuesta de Error (401)
```json
{
  "success": false,
  "message": "Unauthenticated."
}
```

### 2. Marcar Notificación como Leída

**POST** `/notifications/{id}/read`

#### Descripción
Marca una notificación específica como leída.

#### Parámetros de URL
- `id` (string, required): ID de la notificación

#### Headers
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

#### Respuesta de Error (404)
```json
{
  "success": false,
  "message": "Notificación no encontrada"
}
```

### 3. Marcar Todas las Notificaciones como Leídas

**POST** `/notifications/read-all`

#### Descripción
Marca todas las notificaciones no leídas del member como leídas.

#### Headers
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Todas las notificaciones han sido marcadas como leídas",
  "updated_count": 5
}
```

## Notificaciones en Tiempo Real

### Configuración de Broadcasting

Para recibir notificaciones en tiempo real, la aplicación móvil debe conectarse a los siguientes canales de Pusher:

#### Canal Privado (Recomendado)
```
Canal: private-mobile-notifications.{user_id}
Evento: mobile.notification.created
```

#### Canal Público (Para pruebas)
```
Canal: mobile-notifications-public.{user_id}
Evento: mobile.notification.created
```

### Configuración de Pusher en React Native

```javascript
import Pusher from 'pusher-js/react-native';

// Configuración de Pusher
const pusher = new Pusher('your-pusher-key', {
  cluster: 'your-cluster',
  authEndpoint: 'http://localhost/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
});

// Suscribirse al canal privado
const channel = pusher.subscribe(`private-mobile-notifications.${userId}`);

// Escuchar eventos de notificación
channel.bind('mobile.notification.created', (data) => {
  console.log('Nueva notificación:', data);
  // Actualizar estado de la aplicación
  // Mostrar notificación push local
});
```

### Estructura del Evento en Tiempo Real

```json
{
  "notification": {
    "id": "uuid-notification-id",
    "type": "App\\Notifications\\TicketNotification",
    "notifiable_type": "App\\Models\\User",
    "notifiable_id": 123,
    "data": {
      "ticket_id": 456,
      "type": "ticket_assigned",
      "title": "Técnico Asignado",
      "message": "Se ha asignado un técnico a tu ticket #456"
    },
    "read_at": null,
    "created_at": "2024-01-20T10:30:00.000000Z",
    "updated_at": "2024-01-20T10:30:00.000000Z"
  },
  "user_id": 123,
  "timestamp": "2024-01-20T10:30:00.000000Z",
  "platform": "mobile"
}
```

## Tipos de Notificaciones

### ticket_assigned
- **Cuándo**: Se asigna un técnico a un ticket del member
- **Datos**: `ticket_id`, `technical_name`, información del ticket

### ticket_status_updated
- **Cuándo**: Cambia el estado de un ticket (resuelto, cerrado, etc.)
- **Datos**: `ticket_id`, `old_status`, `new_status`

### member_message_response
- **Cuándo**: Un técnico responde a un mensaje del member
- **Datos**: `ticket_id`, `message`, `technical_name`

## Ejemplo de Implementación en React Native

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Pusher from 'pusher-js/react-native';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadTokenAndUserId();
  }, []);

  useEffect(() => {
    if (token && userId) {
      fetchNotifications();
      setupPusher();
    }
  }, [token, userId]);

  const loadTokenAndUserId = async () => {
    const storedToken = await AsyncStorage.getItem('auth_token');
    const storedUserId = await AsyncStorage.getItem('user_id');
    setToken(storedToken);
    setUserId(storedUserId);
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost/api/tenant/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const setupPusher = () => {
    const pusher = new Pusher('your-pusher-key', {
      cluster: 'your-cluster',
      authEndpoint: 'http://localhost/broadcasting/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const channel = pusher.subscribe(`private-mobile-notifications.${userId}`);
    
    channel.bind('mobile.notification.created', (data) => {
      console.log('Nueva notificación en tiempo real:', data);
      
      // Agregar nueva notificación al estado
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Mostrar notificación push local (opcional)
      // showLocalNotification(data.notification);
    });
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost/api/tenant/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        // Actualizar estado local
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read_at: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <View>
      <Text>Notificaciones ({unreadCount} no leídas)</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem 
            notification={item} 
            onPress={() => markAsRead(item.id)}
          />
        )}
      />
    </View>
  );
};

export default NotificationsScreen;
```

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren un token válido de Sanctum
2. **Roles**: Solo users con rol 'member' pueden acceder a estos endpoints
3. **Tiempo Real**: Las notificaciones se envían automáticamente cuando ocurren eventos relacionados con tickets
4. **Canales**: Se recomienda usar el canal privado para producción
5. **Rate Limiting**: Los endpoints pueden tener límites de velocidad aplicados
6. **Logs**: Todas las operaciones se registran para debugging

## Configuración del Entorno

### Variables de Entorno Requeridas
```
PUSHER_APP_ID=your-app-id
PUSHER_APP_KEY=your-app-key
PUSHER_APP_SECRET=your-app-secret
PUSHER_APP_CLUSTER=your-cluster
```

### Dependencias de React Native
```bash
npm install pusher-js
npm install @react-native-async-storage/async-storage
```