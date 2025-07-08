# API Documentation for Tenant Mobile App

Este documento describe cómo usar la API REST para la aplicación móvil de tenants/inquilinos.

## Autenticación

La API utiliza Laravel Sanctum para autenticación mediante tokens.

### Base URL
```
http://tu-dominio.com/api
```

## Endpoints

### 1. Autenticación

#### Login
Autentica un tenant y devuelve un token de acceso.

**POST** `/tenant/login`

**Body:**
```json
{
    "email": "tenant@example.com",
    "password": "password"
}
```

**Response Success (200):**
```json
{
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "tenant@example.com",
        "tenant_id": 1
    },
    "tenant": {
        "id": 1,
        "name": "John Doe",
        "email": "tenant@example.com",
        "phone": "+1234567890",
        "photo": "path/to/photo.jpg",
        "apartment_id": 1
    },
    "token": "1|abcd1234..."
}
```

**Response Error (422):**
```json
{
    "message": "The provided credentials are incorrect.",
    "errors": {
        "email": ["The provided credentials are incorrect."]
    }
}
```

#### Logout
Cierra la sesión del tenant.

**POST** `/tenant/logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "message": "Successfully logged out"
}
```

### 2. Perfil del Tenant

#### Obtener información del tenant autenticado
**GET** `/tenant/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "tenant": {
        "id": 1,
        "name": "John Doe",
        "email": "tenant@example.com",
        "phone": "+1234567890",
        "photo": "path/to/photo.jpg",
        "apartment": {
            "id": 1,
            "name": "Apt 101",
            "ubicacion": "First floor",
            "building": {
                "id": 1,
                "name": "Building A",
                "address": "123 Main St",
                "description": "Modern residential building",
                "location_link": "https://maps.google.com/...",
                "image": "path/to/building.jpg"
            }
        }
    }
}
```

### 3. Dispositivos (Devices)

#### Obtener todos los dispositivos del tenant
Incluye dispositivos propios y compartidos.

**GET** `/tenant/devices`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "own_devices": [
        {
            "id": 1,
            "name": "Smart TV Living Room",
            "status": true,
            "ubicacion": "Living Room",
            "brand": "Samsung",
            "model": "QLED 55\"",
            "system": "Tizen",
            "device_type": "Television"
        }
    ],
    "shared_devices": [
        {
            "id": 2,
            "name": "Air Conditioner",
            "status": true,
            "ubicacion": "Bedroom",
            "brand": "LG",
            "model": "Dual Cool",
            "system": "Remote Control",
            "device_type": "Climate Control",
            "owner": {
                "id": 2,
                "name": "Jane Smith",
                "email": "jane@example.com"
            }
        }
    ]
}
```

### 4. Tickets

#### Obtener todos los tickets del tenant
**GET** `/tenant/tickets?status={status}`

**Query Parameters:**
- `status` (opcional): `all`, `open`, `in_progress`, `resolved`, `closed`, `cancelled`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "tickets": [
        {
            "id": 1,
            "title": "TV not turning on",
            "description": "The TV in the living room won't turn on",
            "category": "Hardware",
            "status": "open",
            "priority": "medium",
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z",
            "device": {
                "id": 1,
                "name": "Smart TV Living Room",
                "brand": "Samsung",
                "model": "QLED 55\"",
                "system": "Tizen",
                "device_type": "Television"
            },
            "technical": null,
            "histories_count": 1
        }
    ]
}
```

#### Crear un nuevo ticket
**POST** `/tenant/tickets`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
    "device_id": 1,
    "category": "Hardware",
    "title": "Device not working",
    "description": "Detailed description of the problem",
    "priority": "medium"
}
```

**Response Success (201):**
```json
{
    "ticket": {
        "id": 1,
        "title": "Device not working",
        "description": "Detailed description of the problem",
        "category": "Hardware",
        "status": "open",
        "priority": "medium",
        "created_at": "2024-01-15T10:30:00Z"
    },
    "message": "Ticket created successfully"
}
```

#### Obtener detalle de un ticket
**GET** `/tenant/tickets/{ticket_id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "ticket": {
        "id": 1,
        "title": "TV not turning on",
        "description": "The TV in the living room won't turn on",
        "category": "Hardware",
        "status": "open",
        "priority": "medium",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "device": {
            "id": 1,
            "name": "Smart TV Living Room",
            "brand": "Samsung",
            "model": "QLED 55\"",
            "system": "Tizen",
            "device_type": "Television",
            "ubicacion": "Living Room"
        },
        "technical": {
            "id": 1,
            "name": "Technical Support",
            "email": "tech@example.com",
            "phone": "+1234567890"
        },
        "histories": [
            {
                "id": 1,
                "action": "created",
                "description": "Ticket created by John Doe",
                "user_name": "John Doe",
                "created_at": "2024-01-15T10:30:00Z"
            }
        ]
    }
}
```

### 5. Información del Apartamento

#### Obtener información del apartamento
**GET** `/tenant/apartment`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "apartment": {
        "id": 1,
        "name": "Apt 101",
        "ubicacion": "First floor",
        "status": true,
        "other_tenants": [
            {
                "id": 2,
                "name": "Jane Doe",
                "email": "jane@example.com",
                "phone": "+1234567891",
                "photo": "path/to/photo.jpg"
            }
        ],
        "building": {
            "id": 1,
            "name": "Building A",
            "address": "123 Main St",
            "description": "Modern residential building",
            "location_link": "https://maps.google.com/...",
            "image": "path/to/building.jpg"
        }
    }
}
```

### 6. Información del Edificio

#### Obtener información del edificio
**GET** `/tenant/building`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "building": {
        "id": 1,
        "name": "Building A",
        "managing_company": "Property Management Co.",
        "address": "123 Main St",
        "description": "Modern residential building",
        "location_link": "https://maps.google.com/...",
        "image": "path/to/building.jpg",
        "status": true,
        "owner": {
            "id": 1,
            "name": "Building Owner",
            "email": "owner@example.com",
            "phone": "+1234567892",
            "photo": "path/to/owner.jpg"
        }
    }
}
```

### 7. Personal del Edificio

#### Obtener lista de porteros/conserjes
**GET** `/tenant/doormen`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "doormen": [
        {
            "id": 1,
            "name": "Security Guard 1",
            "email": "guard1@example.com",
            "phone": "+1234567893",
            "photo": "path/to/guard.jpg",
            "shift": "morning"
        },
        {
            "id": 2,
            "name": "Security Guard 2",
            "email": "guard2@example.com",
            "phone": "+1234567894",
            "photo": "path/to/guard2.jpg",
            "shift": "night"
        }
    ]
}
```

#### Obtener información del propietario
**GET** `/tenant/owner`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
    "owner": {
        "id": 1,
        "name": "Building Owner",
        "email": "owner@example.com",
        "phone": "+1234567892",
        "photo": "path/to/owner.jpg"
    }
}
```

## Códigos de Estado HTTP

- **200 OK**: Solicitud exitosa
- **201 Created**: Recurso creado exitosamente
- **401 Unauthorized**: Token de autenticación inválido o faltante
- **403 Forbidden**: Sin permisos para acceder al recurso
- **404 Not Found**: Recurso no encontrado
- **422 Unprocessable Entity**: Error de validación
- **500 Internal Server Error**: Error del servidor

## Ejemplo de uso en React Native

### Configuración inicial

```javascript
// config/api.js
const API_BASE_URL = 'http://tu-dominio.com/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};
```

### Servicio de autenticación

```javascript
// services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiConfig } from '../config/api';

class AuthService {
  async login(email, password) {
    try {
      const response = await fetch(`${apiConfig.baseURL}/tenant/login`, {
        method: 'POST',
        headers: apiConfig.headers,
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('tenant', JSON.stringify(data.tenant));
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      await fetch(`${apiConfig.baseURL}/tenant/logout`, {
        method: 'POST',
        headers: {
          ...apiConfig.headers,
          'Authorization': `Bearer ${token}`,
        },
      });

      await AsyncStorage.clear();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getToken() {
    return await AsyncStorage.getItem('token');
  }
}

export default new AuthService();
```

### Servicio para APIs protegidas

```javascript
// services/apiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiConfig } from '../config/api';

class ApiService {
  async makeAuthenticatedRequest(endpoint, options = {}) {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...apiConfig.headers,
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (response.status === 401) {
        // Token expirado, redireccionar al login
        await AsyncStorage.clear();
        throw new Error('Session expired');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Obtener perfil del tenant
  async getProfile() {
    return this.makeAuthenticatedRequest('/tenant/me');
  }

  // Obtener dispositivos
  async getDevices() {
    return this.makeAuthenticatedRequest('/tenant/devices');
  }

  // Obtener tickets
  async getTickets(status = 'all') {
    return this.makeAuthenticatedRequest(`/tenant/tickets?status=${status}`);
  }

  // Crear ticket
  async createTicket(ticketData) {
    return this.makeAuthenticatedRequest('/tenant/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  // Obtener detalle de ticket
  async getTicketDetail(ticketId) {
    return this.makeAuthenticatedRequest(`/tenant/tickets/${ticketId}`);
  }

  // Obtener información del apartamento
  async getApartment() {
    return this.makeAuthenticatedRequest('/tenant/apartment');
  }

  // Obtener información del edificio
  async getBuilding() {
    return this.makeAuthenticatedRequest('/tenant/building');
  }

  // Obtener porteros
  async getDoormen() {
    return this.makeAuthenticatedRequest('/tenant/doormen');
  }

  // Obtener propietario
  async getOwner() {
    return this.makeAuthenticatedRequest('/tenant/owner');
  }
}

export default new ApiService();
```

### Componente de ejemplo

```javascript
// screens/DevicesScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import ApiService from '../services/apiService';

const DevicesScreen = () => {
  const [devices, setDevices] = useState({ own_devices: [], shared_devices: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const data = await ApiService.getDevices();
      setDevices(data);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDevice = ({ item }) => (
    <View style={styles.deviceCard}>
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceInfo}>
        {item.brand} {item.model}
      </Text>
      <Text style={styles.deviceLocation}>{item.ubicacion}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading devices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Devices</Text>
      <FlatList
        data={devices.own_devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id.toString()}
      />
      
      {devices.shared_devices.length > 0 && (
        <>
          <Text style={styles.title}>Shared Devices</Text>
          <FlatList
            data={devices.shared_devices}
            renderItem={renderDevice}
            keyExtractor={(item) => item.id.toString()}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  deviceCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceInfo: {
    fontSize: 14,
    color: '#666',
  },
  deviceLocation: {
    fontSize: 12,
    color: '#999',
  },
});

export default DevicesScreen;
```

## Notas Importantes

1. **Seguridad**: Siempre almacena los tokens de forma segura usando AsyncStorage o librerías como Keychain (iOS) o Keystore (Android).

2. **Manejo de errores**: Implementa un manejo robusto de errores, especialmente para tokens expirados.

3. **Offline**: Considera implementar caché local para funcionar sin conexión.

4. **Validación**: Siempre valida los datos antes de enviarlos a la API.

5. **Performance**: Usa paginación para listas grandes y implementa lazy loading cuando sea necesario.

Esta documentación te permitirá integrar fácilmente la API en tu aplicación React Native para tenants.
