# 📱 Mobile App API - Guía Completa

## 📋 Información General

**Base URL:** `http://167.172.146.200/api`  
**Autenticación:** Laravel Sanctum (Bearer Token)  
**Formato:** JSON  

---

## 🔑 Autenticación (Members y Técnicos)

### Login Universal

**Endpoint:** `POST /api/tenant/login`  
**Autenticación:** No requerida

Ambos tipos de usuarios (members y técnicos) usan el **mismo endpoint de login**.

#### Request:
```json
{
  "email": "usuario@example.com",
  "password": "contraseña123"
}
```

#### Response para TÉCNICO:
```json
{
  "user": {
    "id": 5,
    "name": "Juan Pérez",
    "email": "juan@technical.com",
    "roles": ["technical"]
  },
  "technical": {
    "id": 5,
    "name": "Juan Pérez",
    "email": "juan@technical.com",
    "phone": "555-1234",
    "photo": "https://example.com/photo.jpg",
    "is_default": false,
    "shift": "morning",
    "status": "active"
  },
  "token": "5|abc123xyz..."
}
```

#### Response para MEMBER:
```json
{
  "user": {
    "id": 10,
    "name": "Carlos Ruiz",
    "email": "carlos@member.com",
    "roles": ["member"],
    "tenant_id": 15
  },
  "tenant": {
    "id": 15,
    "name": "Carlos Ruiz",
    "email": "carlos@member.com",
    "phone": "555-9999",
    "photo": "https://example.com/photo.jpg",
    "apartment_id": 20
  },
  "token": "10|xyz789abc..."
}
```

#### Implementación en React Native:

```javascript
// AuthService.js
export const login = async (email, password) => {
  const response = await fetch('http://167.172.146.200/api/tenant/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  
  // Guardar token
  await AsyncStorage.setItem('authToken', data.token);
  await AsyncStorage.setItem('userData', JSON.stringify(data.user));
  
  // Guardar datos específicos según el tipo
  if (data.user.roles.includes('technical')) {
    await AsyncStorage.setItem('technicalData', JSON.stringify(data.technical));
    await AsyncStorage.setItem('userType', 'technical');
    return { ...data, userType: 'technical' };
  } else if (data.user.roles.includes('member')) {
    await AsyncStorage.setItem('tenantData', JSON.stringify(data.tenant));
    await AsyncStorage.setItem('userType', 'member');
    return { ...data, userType: 'member' };
  }
};

// Uso en el componente de Login
const handleLogin = async () => {
  try {
    const data = await login(email, password);
    
    // Navegar según el tipo de usuario
    if (data.userType === 'technical') {
      navigation.navigate('TechnicalDashboard');
    } else {
      navigation.navigate('MemberDashboard');
    }
  } catch (error) {
    Alert.alert('Error', 'Login failed');
  }
};
```

### Logout

**Endpoint:** `POST /api/tenant/logout`  
**Autenticación:** Bearer Token requerido

```javascript
const logout = async () => {
  const token = await AsyncStorage.getItem('authToken');
  
  await fetch('http://167.172.146.200/api/tenant/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  // Limpiar storage
  await AsyncStorage.multiRemove([
    'authToken',
    'userData',
    'technicalData',
    'tenantData',
    'userType'
  ]);
};
```

---

## 👤 APIs para MEMBERS (Tenants)

### 1. Obtener Perfil
**Endpoint:** `GET /api/tenant/me`

```javascript
const getProfile = async () => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch('http://167.172.146.200/api/tenant/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  return await response.json();
};
```

### 2. Obtener Dispositivos
**Endpoint:** `GET /api/tenant/devices`

```javascript
const getDevices = async () => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch('http://167.172.146.200/api/tenant/devices', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  const data = await response.json();
  // Retorna: { own_devices: [...], shared_devices: [...] }
  return data;
};
```

### 3. Obtener Tickets
**Endpoint:** `GET /api/tenant/tickets?status={status}`

**Query Parameters:**
- `status`: `all`, `open`, `in_progress`, `resolved`, `closed` (default: `all`)

```javascript
const getTickets = async (status = 'all') => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch(
    `http://167.172.146.200/api/tenant/tickets?status=${status}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
  
  return await response.json();
};
```

### 4. Crear Ticket
**Endpoint:** `POST /api/tenant/tickets`

```javascript
const createTicket = async (deviceId, category, title, description, attachments = []) => {
  const token = await AsyncStorage.getItem('authToken');
  
  const formData = new FormData();
  formData.append('device_id', deviceId);
  formData.append('category', category);
  formData.append('title', title);
  formData.append('description', description);
  
  // Agregar archivos adjuntos
  attachments.forEach((file, index) => {
    formData.append('attachments[]', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || `image_${index}.jpg`
    });
  });
  
  const response = await fetch('http://167.172.146.200/api/tenant/tickets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'multipart/form-data'
    },
    body: formData
  });
  
  return await response.json();
};
```

### 5. Ver Detalle de Ticket
**Endpoint:** `GET /api/tenant/tickets/{ticketId}`

```javascript
const getTicketDetail = async (ticketId) => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch(
    `http://167.172.146.200/api/tenant/tickets/${ticketId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
  
  return await response.json();
};
```

### 6. Enviar Mensaje al Técnico
**Endpoint:** `POST /api/tenant/tickets/{ticketId}/send-message-to-technical`

```javascript
const sendMessageToTechnical = async (ticketId, message) => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch(
    `http://167.172.146.200/api/tenant/tickets/${ticketId}/send-message-to-technical`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ message })
    }
  );
  
  return await response.json();
};
```

### 7. Obtener Notificaciones
**Endpoint:** `GET /api/tenant/notifications`

```javascript
const getNotifications = async () => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch('http://167.172.146.200/api/tenant/notifications', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  const data = await response.json();
  // Retorna: { notifications: [...], unread_count: 5 }
  return data;
};
```

### 8. Marcar Notificación como Leída
**Endpoint:** `POST /api/tenant/notifications/{notificationId}/read`

```javascript
const markNotificationAsRead = async (notificationId) => {
  const token = await AsyncStorage.getItem('authToken');
  
  await fetch(
    `http://167.172.146.200/api/tenant/notifications/${notificationId}/read`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
};
```

---

## 🔧 APIs para TÉCNICOS

### 1. Obtener Lista de Técnicos
**Endpoint:** `GET /api/technicals`

```javascript
const getTechnicals = async () => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch('http://167.172.146.200/api/technicals', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  const data = await response.json();
  // Retorna: { technicals: [...] }
  return data;
};
```

**Response:**
```json
{
  "technicals": [
    {
      "id": 5,
      "name": "Juan Pérez",
      "email": "juan@technical.com",
      "phone": "555-1234",
      "photo": "https://example.com/photo.jpg",
      "is_default": false,
      "shift": "morning",
      "status": "active"
    }
  ]
}
```

### 2. Obtener Tickets del Técnico
**Endpoint:** `GET /api/technicals/{technicalId}/tickets?type={type}`

**Query Parameters:**
- `type`: `all`, `today`, `week`, `month`, `open`, `in_progress`, `resolved`, `closed`, `recent`

```javascript
const getTechnicalTickets = async (technicalId, type = 'today') => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch(
    `http://167.172.146.200/api/technicals/${technicalId}/tickets?type=${type}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
  
  return await response.json();
};

// Uso
const technical = JSON.parse(await AsyncStorage.getItem('technicalData'));
const todayTickets = await getTechnicalTickets(technical.id, 'today');
const allTickets = await getTechnicalTickets(technical.id, 'all');
```

**Response:**
```json
[
  {
    "id": 123,
    "title": "Laptop not working",
    "status": "in_progress",
    "priority": "high",
    "created_at": "2025-01-18T10:00:00Z",
    "building": {
      "id": 1,
      "name": "Building A"
    },
    "apartment": {
      "id": 10,
      "number": "301"
    },
    "device": {
      "id": 5,
      "name": "MacBook Pro"
    }
  }
]
```

### 3. Ver Detalle de Ticket (Técnico)
**Endpoint:** `GET /api/tickets/{ticketId}/detail`

```javascript
const getTicketDetail = async (ticketId) => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch(
    `http://167.172.146.200/api/tickets/${ticketId}/detail`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
  
  return await response.json();
};
```

**Response:**
```json
{
  "id": 123,
  "title": "Laptop not working",
  "description": "The laptop won't turn on",
  "status": "in_progress",
  "priority": "high",
  "apartment": {
    "id": 10,
    "number": "301",
    "building": {
      "id": 1,
      "name": "Building A"
    }
  },
  "tenant": {
    "id": 15,
    "name": "Carlos Ruiz",
    "phone": "555-9999"
  },
  "messages": [
    {
      "id": 1,
      "message": "I tried restarting it",
      "type": "tenant",
      "created_at": "2025-01-18T10:05:00Z"
    }
  ],
  "evidences": [...],
  "appointments": [...]
}
```

### 4. Obtener Todos los Tenants
**Endpoint:** `GET /api/tenants/all`

```javascript
const getAllTenants = async () => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch('http://167.172.146.200/api/tenants/all', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  return await response.json();
};
```

### 5. Obtener Edificios
**Endpoint:** `GET /api/buildings`

```javascript
const getBuildings = async () => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch('http://167.172.146.200/api/buildings', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  return await response.json();
};
```

---

## 🔔 Notificaciones Push

### Registrar Token de Push
**Endpoint:** `POST /api/push-notifications/register`

```javascript
import * as Notifications from 'expo-notifications';

const registerPushToken = async () => {
  // Solicitar permisos
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status !== 'granted') {
    console.log('Permission not granted');
    return;
  }
  
  // Obtener token
  const tokenData = await Notifications.getExpoPushTokenAsync();
  const expoPushToken = tokenData.data;
  
  // Registrar en el backend
  const authToken = await AsyncStorage.getItem('authToken');
  
  await fetch('http://167.172.146.200/api/push-notifications/register', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      token: expoPushToken,
      platform: Platform.OS
    })
  });
};

// Llamar en el App.js después del login
useEffect(() => {
  registerPushToken();
}, []);
```

### Configurar Listeners

```javascript
import * as Notifications from 'expo-notifications';

// Configurar cómo mostrar las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Listener para cuando se recibe una notificación
const notificationListener = Notifications.addNotificationReceivedListener(notification => {
  console.log('Notification received:', notification);
  // Actualizar badge, mostrar alerta, etc.
});

// Listener para cuando el usuario toca la notificación
const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
  const { ticket_id, type } = response.notification.request.content.data;
  
  // Navegar a la pantalla correspondiente
  if (ticket_id) {
    navigation.navigate('TicketDetail', { ticketId: ticket_id });
  }
});

// Limpiar listeners
useEffect(() => {
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}, []);
```

---

## 🎯 Ejemplos Completos

### Ejemplo 1: Dashboard de Member

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

const MemberDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const token = await AsyncStorage.getItem('authToken');
    
    try {
      // Cargar tickets
      const ticketsResponse = await fetch(
        'http://167.172.146.200/api/tenant/tickets',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      const ticketsData = await ticketsResponse.json();
      setTickets(ticketsData.tickets);

      // Cargar dispositivos
      const devicesResponse = await fetch(
        'http://167.172.146.200/api/tenant/devices',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      const devicesData = await devicesResponse.json();
      setDevices([...devicesData.own_devices, ...devicesData.shared_devices]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTicket = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
    >
      <Text>{item.title}</Text>
      <Text>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  if (loading) return <Text>Loading...</Text>;

  return (
    <View>
      <Text>My Devices ({devices.length})</Text>
      <Text>My Tickets ({tickets.length})</Text>
      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};
```

### Ejemplo 2: Dashboard de Técnico

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';

const TechnicalDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [technicalData, setTechnicalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const technical = JSON.parse(await AsyncStorage.getItem('technicalData'));
    setTechnicalData(technical);

    try {
      const response = await fetch(
        `http://167.172.146.200/api/technicals/${technical.id}/tickets?type=today`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      const todayTickets = await response.json();
      setTickets(todayTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTicket = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
    >
      <Text>{item.title}</Text>
      <Text>Priority: {item.priority}</Text>
      <Text>Building: {item.building.name}</Text>
      <Text>Apartment: {item.apartment.number}</Text>
    </TouchableOpacity>
  );

  if (loading) return <Text>Loading...</Text>;

  return (
    <View>
      <Text>Welcome, {technicalData?.name}!</Text>
      <Text>Today's Tickets ({tickets.length})</Text>
      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};
```

### Ejemplo 3: Crear Ticket con Fotos

```javascript
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const CreateTicket = ({ route }) => {
  const { deviceId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 5
    });

    if (result.assets) {
      setAttachments([...attachments, ...result.assets]);
    }
  };

  const submitTicket = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const formData = new FormData();
    
    formData.append('device_id', deviceId);
    formData.append('category', 'Hardware');
    formData.append('title', title);
    formData.append('description', description);
    
    attachments.forEach((file) => {
      formData.append('attachments[]', {
        uri: file.uri,
        type: file.type,
        name: file.fileName
      });
    });

    try {
      const response = await fetch('http://167.172.146.200/api/tenant/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        body: formData
      });

      if (response.ok) {
        Alert.alert('Success', 'Ticket created!');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create ticket');
    }
  };

  return (
    <View>
      <TextInput 
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput 
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Button title="Add Photos" onPress={pickImage} />
      <Text>Attachments: {attachments.length}</Text>
      <Button title="Create Ticket" onPress={submitTicket} />
    </View>
  );
};
```

---

## 📊 Diferencias Entre Members y Técnicos

| Característica | Members | Técnicos |
|---------------|---------|----------|
| **Login** | `POST /api/tenant/login` | `POST /api/tenant/login` (mismo) |
| **Token** | Sanctum Bearer Token | Sanctum Bearer Token (mismo) |
| **Response Login** | `{ user, tenant, token }` | `{ user, technical, token }` |
| **Detección** | `user.roles.includes('member')` | `user.roles.includes('technical')` |
| **Ver Tickets** | Solo sus propios tickets | Tickets asignados a él |
| **Crear Tickets** | ✅ Sí | ❌ No |
| **Actualizar Estado** | ❌ No | ✅ Sí |
| **Ver Todos Tenants** | ❌ No | ✅ Sí |
| **Notificaciones** | Tickets propios | Tickets asignados |

---

## ⚡ Tips de Implementación

### 1. Servicio de API Centralizado

```javascript
// services/api.js
const API_BASE_URL = 'http://167.172.146.200/api';

class ApiService {
  static async getHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  static async get(endpoint) {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    
    if (response.status === 401) {
      // Token expirado, hacer logout
      await AsyncStorage.clear();
      navigation.navigate('Login');
      throw new Error('Session expired');
    }
    
    return await response.json();
  }

  static async post(endpoint, data) {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    return await response.json();
  }
}

export default ApiService;

// Uso
const tickets = await ApiService.get('/tenant/tickets');
const result = await ApiService.post('/tenant/tickets/123/send-message-to-technical', {
  message: 'Hello'
});
```

### 2. Hook Personalizado para Auth

```javascript
// hooks/useAuth.js
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      const type = await AsyncStorage.getItem('userType');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setUserType(type);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await ApiService.post('/tenant/logout');
    await AsyncStorage.clear();
    setUser(null);
    setUserType(null);
  };

  return { user, userType, loading, logout, checkAuth };
};

// Uso en componentes
const { user, userType } = useAuth();

if (userType === 'technical') {
  // Mostrar UI de técnico
} else {
  // Mostrar UI de member
}
```

### 3. Manejo de Errores Global

```javascript
// utils/errorHandler.js
export const handleApiError = (error, navigation) => {
  if (error.message === 'Session expired') {
    Alert.alert('Session Expired', 'Please login again');
    navigation.navigate('Login');
  } else if (error.message === 'Network request failed') {
    Alert.alert('Network Error', 'Check your internet connection');
  } else {
    Alert.alert('Error', error.message || 'Something went wrong');
  }
};

// Uso
try {
  await ApiService.get('/tenant/tickets');
} catch (error) {
  handleApiError(error, navigation);
}
```

---

## 🚀 Checklist de Implementación

### Autenticación
- [ ] Implementar login con detección de tipo de usuario
- [ ] Guardar token y datos en AsyncStorage
- [ ] Implementar logout
- [ ] Manejar sesión expirada (401 response)

### Para Members
- [ ] Dashboard con dispositivos y tickets
- [ ] Crear tickets con fotos
- [ ] Ver detalle de ticket
- [ ] Enviar mensajes al técnico
- [ ] Recibir notificaciones push

### Para Técnicos
- [ ] Dashboard con tickets de hoy
- [ ] Ver todos los tickets asignados
- [ ] Ver detalle de ticket con info del member
- [ ] Marcar estado de ticket
- [ ] Ver lista de tenants
- [ ] Recibir notificaciones push

### General
- [ ] Configurar notificaciones push
- [ ] Manejo de errores global
- [ ] Loading states
- [ ] Pull to refresh
- [ ] Caché de datos
- [ ] Modo offline básico

---

## 📞 Soporte

Para más información sobre endpoints específicos, consulta el código del backend en:
- `routes/api.php` - Definición de rutas
- `app/Http/Controllers/Api/TenantController.php` - APIs de members
- `app/Http/Controllers/Api/TechnicalController.php` - APIs de técnicos

---

## 🔥 Puntos Clave

1. ✅ **Un solo login** para members y técnicos
2. ✅ **Mismo token** (Sanctum Bearer Token)
3. ✅ **Detección por roles** (`user.roles` array)
4. ✅ **Response diferente** según el tipo de usuario
5. ✅ **Notificaciones push funcionan igual** para ambos

¡Listo para implementar! 🚀
