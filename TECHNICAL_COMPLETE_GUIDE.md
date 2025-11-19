# 📱 Guía Completa: Technical Mobile App - De Login a Todas las Funcionalidades

> **Documento Único y Definitivo** - Todo lo que necesitas saber desde el login hasta cada funcionalidad del técnico en React Native.

## 📑 Tabla de Contenidos

### 🚀 Getting Started
1. [Resumen Ejecutivo](#-resumen-ejecutivo)
2. [Estado Actual del Proyecto](#-estado-actual-del-proyecto)
3. [Arquitectura del Sistema](#️-arquitectura-del-sistema)

### 🔐 Autenticación
4. [Login Unificado](#-login-unificado)
5. [2 Tipos de Técnicos](#-dos-tipos-de-técnicos)
6. [Detección en Mobile](#-detección-en-mobile)

### 📊 Funcionalidades
7. [Dashboard](#-dashboard)
8. [Gestión de Tickets](#️-gestión-de-tickets)
9. [Gestión de Citas](#-gestión-de-citas-appointments)
10. [Notificaciones Push](#-notificaciones-push)

### 💻 Implementación
11. [Setup del Proyecto Mobile](#-setup-del-proyecto-mobile)
12. [Estructura de Código](#-estructura-de-código)
13. [Testing](#-testing-y-validación)
14. [Deployment](#-deployment)

---

## 🎯 Resumen Ejecutivo

### ¿Qué es este proyecto?

Sistema completo de gestión de tickets y citas para **técnicos** en app móvil React Native (Expo). La app ya funciona perfectamente para **members (tenants)**, ahora se extiende para técnicos.

### ✅ Lo que YA está implementado (Backend)
- ✅ Login unificado (`POST /api/tenant/login`)
- ✅ Todas las rutas API con `auth:sanctum`
- ✅ Método `getAppointments()` en TechnicalController
- ✅ Endpoints de tickets (update-status, add-history, upload-evidence, add-private-note)
- ✅ Endpoints de appointments (start, complete, cancel, reschedule)

### ⚠️ Lo que FALTA implementar (Mobile)
- ❌ Detectar tipo de técnico después del login
- ❌ Navegación diferenciada (Regular vs Jefe)
- ❌ Dashboards (personal vs global)
- ❌ Pantallas de tickets con acciones
- ❌ Pantallas de citas con acciones
- ❌ UI/UX completo

### 📊 Timeline Estimado
- **Backend**: ✅ Completado (1 día)
- **Mobile**: 10-15 días
  - Login y navegación: 1-2 días
  - Dashboards: 2-3 días
  - Tickets: 3-4 días
  - Appointments: 3-4 días
  - Polish: 1-2 días

---

## 📦 Estado Actual del Proyecto

### Backend (Laravel) - ✅ 100% Listo

**Archivo**: `routes/api.php`
```php
// ✅ Rutas Implementadas
GET  /api/technicals
GET  /api/technicals/{technical}/tickets?type={type}
GET  /api/technicals/{technical}/appointments?date={date}
GET  /api/tickets/{ticket}/detail

// ✅ Rutas con auth:sanctum
POST /api/tickets/{ticket}/update-status
POST /api/tickets/{ticket}/add-history
POST /api/tickets/{ticket}/upload-evidence
POST /api/tickets/{ticket}/add-private-note
POST /api/tickets/{ticket}/send-message-to-technical
GET  /api/appointments/{appointment}/details
POST /api/tickets/{ticket}/appointments
POST /api/appointments/{appointment}/start
POST /api/appointments/{appointment}/complete
POST /api/appointments/{appointment}/cancel
POST /api/appointments/{appointment}/reschedule
```

**Controladores listos**:
- ✅ `TechnicalController.php` - Con método `getAppointments()`
- ✅ `TicketController.php` - Todos los métodos de acciones
- ✅ `AppointmentController.php` - Todos los métodos de gestión

### Mobile (React Native) - ⏳ Por Implementar

**Lo que falta**:
- Screens de técnicos
- Services para APIs
- Navegación diferenciada
- Components específicos
- Context para estado global

---

## 🏗️ Arquitectura del Sistema

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

**Backend**
- Framework: Laravel 10+
- Autenticación: Laravel Sanctum (Token-based)
- Base de datos: MySQL
- APIs: RESTful JSON

**Mobile**
- Framework: React Native (Expo)
- Navegación: React Navigation
- HTTP Client: Axios
- Storage: AsyncStorage
- Notificaciones: Expo Notifications + FCM
- Estado: Context API / Redux

### Flujo de Comunicación

```
┌─────────────────────────────────────────────────────────┐
│  Mobile App (React Native/Expo)                         │
│  - Screens (Login, Dashboard, Tickets, Appointments)    │
│  - Services (API calls)                                 │
│  - Context (Global state)                               │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP Request
                     │ Authorization: Bearer {token}
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Laravel Backend                                         │
│  routes/api.php → auth:sanctum middleware               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Controllers                                             │
│  - TechnicalController                                   │
│  - TicketController                                      │
│  - AppointmentController                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Database (MySQL)                                        │
│  - users, technicals, tickets, appointments             │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Login Unificado

### Endpoint: `POST /api/tenant/login`

**URL Completa**: `https://adkassist.com/api/tenant/login`

Tanto **members** como **técnicos** usan el **mismo endpoint**. El backend detecta automáticamente el tipo de usuario por email.

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
    "roles": [
      {
        "id": 3,
        "name": "technical"
      }
    ],
    "technical": {
      "id": 2,
      "name": "Juan Pérez",
      "email": "technical@example.com",
      "phone": "+1234567890",
      "photo": "/storage/technicals/juan.jpg",
      "shift": "morning",
      "status": true,
      "is_default": false,
      "created_at": "2024-01-15T10:00:00.000000Z"
    }
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
    "roles": [
      {
        "id": 3,
        "name": "technical"
      }
    ],
    "technical": {
      "id": 1,
      "name": "Pedro García",
      "email": "chief@example.com",
      "phone": "+9876543210",
      "photo": "/storage/technicals/pedro.jpg",
      "shift": "full_day",
      "status": true,
      "is_default": true,
      "created_at": "2024-01-10T08:00:00.000000Z"
    }
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
    "roles": [
      {
        "id": 2,
        "name": "member"
      }
    ],
    "tenant": {
      "id": 15,
      "name": "María García",
      "email": "member@example.com",
      "phone": "+9876543210",
      "apartment_id": 101,
      "apartment": {
        "id": 101,
        "number": "301",
        "building_id": 5
      }
    }
  }
}
```

---

## 👥 Dos Tipos de Técnicos

---

## 👥 Dos Tipos de Técnicos

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
| **Permisos** | Limitado | ≈ Super Admin |

### Queries del Backend

**Técnico Regular** - Queries limitadas:
```sql
-- Solo ve SUS tickets
SELECT * FROM tickets WHERE technical_id = {myId};

-- Solo ve SUS citas
SELECT * FROM appointments WHERE technical_id = {myId};
```

**Técnico Jefe** - Queries sin restricción:
```sql
-- Ve TODOS los tickets
SELECT * FROM tickets;

-- Ve TODAS las citas
SELECT * FROM appointments;

-- Ve TODOS los técnicos
SELECT * FROM technicals;
```

---

## 📲 Detección en Mobile

### Código Completo de AuthService

```javascript
// services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'https://adkassist.com/api';

class AuthService {
  // Login unificado
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/tenant/login`, {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const { token, user } = response.data;
      
      // 1. Guardar token
      await AsyncStorage.setItem('authToken', token);
      
      // 2. Detectar tipo de usuario
      const isMember = user.roles?.some(role => role.name === 'member');
      const isTechnical = user.roles?.some(role => role.name === 'technical');
      
      // 3. Guardar datos específicos del tipo
      if (isTechnical && user.technical) {
        await AsyncStorage.setItem('technical', JSON.stringify(user.technical));
        await AsyncStorage.setItem('isDefaultTechnical', JSON.stringify(user.technical.is_default));
        await AsyncStorage.setItem('technicalId', user.technical.id.toString());
      }
      
      if (isMember && user.tenant) {
        await AsyncStorage.setItem('tenant', JSON.stringify(user.tenant));
      }
      
      // 4. Guardar datos generales
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('userType', isTechnical ? 'technical' : 'member');
      
      // 5. Retornar información completa
      return {
        success: true,
        user,
        userType: isTechnical ? 'technical' : 'member',
        isDefaultTechnical: user.technical?.is_default || false,
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión'
      };
    }
  }

  // Obtener usuario actual
  async getCurrentUser() {
    const user = await AsyncStorage.getItem('user');
    const userType = await AsyncStorage.getItem('userType');
    const isDefaultTechnical = await AsyncStorage.getItem('isDefaultTechnical');
    
    return {
      user: user ? JSON.parse(user) : null,
      userType,
      isDefaultTechnical: isDefaultTechnical ? JSON.parse(isDefaultTechnical) : false
    };
  }

  // Obtener token
  async getToken() {
    return await AsyncStorage.getItem('authToken');
  }

  // Logout
  async logout() {
    try {
      const token = await this.getToken();
      
      // Llamar al endpoint de logout
      await axios.post(`${API_URL}/tenant/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpiar storage
      await AsyncStorage.multiRemove([
        'authToken',
        'user',
        'userType',
        'technical',
        'tenant',
        'isDefaultTechnical',
        'technicalId'
      ]);
    }
  }

  // Verificar si está autenticado
  async isAuthenticated() {
    const token = await this.getToken();
    return !!token;
  }
}

export default new AuthService();
```

### Navegación Según Tipo

```javascript
// navigation/AppNavigator.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthService from '../services/AuthService';
import LoginScreen from '../screens/Auth/LoginScreen';
import MemberNavigator from './MemberNavigator';
import TechnicalRegularNavigator from './TechnicalRegularNavigator';
import TechnicalChiefNavigator from './TechnicalChiefNavigator';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [isDefaultTechnical, setIsDefaultTechnical] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = await AuthService.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      const { userType: type, isDefaultTechnical: isDefault } = await AuthService.getCurrentUser();
      setUserType(type);
      setIsDefaultTechnical(isDefault);
    }
    
    setLoading(false);
  };

  if (loading) {
    return null; // O un SplashScreen
  }

  // No autenticado → Login
  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Autenticado → Decidir navegador según tipo
  if (userType === 'member') {
    return <MemberNavigator />;
  }

  if (userType === 'technical') {
    if (isDefaultTechnical) {
      // Técnico JEFE → Dashboard completo
      return <TechnicalChiefNavigator />;
    } else {
      // Técnico REGULAR → Dashboard personal
      return <TechnicalRegularNavigator />;
    }
  }

  return null;
};

export default AppNavigator;
```

### Pantalla de Login

```javascript
// screens/Auth/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import AuthService from '../../services/AuthService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    const result = await AuthService.login(email, password);
    setLoading(false);

    if (result.success) {
      // El AppNavigator detectará automáticamente el cambio y navegará
      // No necesitas navegar manualmente
      if (result.userType === 'member') {
        navigation.replace('MemberApp');
      } else if (result.userType === 'technical') {
        if (result.isDefaultTechnical) {
          navigation.replace('TechnicalChiefApp');
        } else {
          navigation.replace('TechnicalRegularApp');
        }
      }
    } else {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Ingresar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold'
  }
});

export default LoginScreen;
```

---

## 📊 Dashboard

### Dashboard para Técnico Regular

**Objetivo**: Mostrar estadísticas y actividad personal del técnico.

#### Datos a Mostrar:

1. **Estadísticas Personales**:
   - Total de mis tickets
   - Tickets abiertos (open)
   - Tickets en progreso (in_progress)
   - Tickets resueltos hoy

2. **Mis Tickets de Hoy**:
   - Lista de tickets asignados creados hoy
   - Con prioridad, estado, device

3. **Mis Citas de Hoy**:
   - Lista de citas programadas para hoy
   - Con hora, ubicación, estado

#### APIs Necesarias:

```javascript
// TechnicalService.js
const technicalId = user.technical.id;

// 1. Obtener tickets del técnico
const myTickets = await axios.get(`/api/technicals/${technicalId}/tickets?type=all`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Calcular estadísticas localmente:
const totalTickets = myTickets.data.length;
const openTickets = myTickets.data.filter(t => t.status === 'open').length;
const inProgressTickets = myTickets.data.filter(t => t.status === 'in_progress').length;

// 2. Tickets de hoy
const todayTickets = await axios.get(`/api/technicals/${technicalId}/tickets?type=today`, {
  headers: { Authorization: `Bearer ${token}` }
});

// 3. Citas de hoy
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const todayAppointments = await axios.get(`/api/technicals/${technicalId}/appointments?date=${today}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### Código React Native (RegularDashboard.tsx):
```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import TechnicalService from '../services/TechnicalService';

const RegularDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolvedToday: 0
  });
  const [todayTickets, setTodayTickets] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const technicalId = await TechnicalService.getCurrentTechnicalId();
      
      // Cargar todos los tickets
      const allTickets = await TechnicalService.getMyTickets(technicalId, 'all');
      
      // Calcular estadísticas
      setStats({
        total: allTickets.length,
        open: allTickets.filter(t => t.status === 'open').length,
        inProgress: allTickets.filter(t => t.status === 'in_progress').length,
        resolvedToday: allTickets.filter(t => 
          t.status === 'resolved' && 
          new Date(t.updated_at).toDateString() === new Date().toDateString()
        ).length
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
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadDashboard} />
      }
    >
      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <StatCard title="Total Tickets" value={stats.total} color="#3B82F6" />
        <StatCard title="Abiertos" value={stats.open} color="#F59E0B" />
        <StatCard title="En Progreso" value={stats.inProgress} color="#10B981" />
        <StatCard title="Resueltos Hoy" value={stats.resolvedToday} color="#6B7280" />
      </View>

      {/* Mis Tickets de Hoy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Tickets de Hoy</Text>
        {todayTickets.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </View>

      {/* Mis Citas de Hoy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Citas de Hoy</Text>
        {todayAppointments.map(appointment => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
      </View>
    </ScrollView>
  );
};
```

### Dashboard para Técnico Jefe

**Objetivo**: Mostrar estadísticas globales del sistema y rendimiento de todos los técnicos.

#### Datos a Mostrar:

1. **Estadísticas Globales**:
   - Total de técnicos activos
   - Total de tickets en el sistema
   - Tickets por estado (open, in_progress, resolved, closed)
   - Rendimiento general

2. **Lista de Técnicos**:
   - Nombre, foto, turno
   - Tickets asignados
   - Tickets resueltos
   - Badge de rendimiento

3. **Gráficos** (opcional):
   - Rendimiento por técnico
   - Tickets por día/semana/mes

#### APIs Necesarias:

```javascript
// 1. Obtener todos los técnicos
const allTechnicals = await axios.get('/api/technicals', {
  headers: { Authorization: `Bearer ${token}` }
});

// 2. Para cada técnico, obtener sus tickets
const technicalStats = await Promise.all(
  allTechnicals.data.technicals.map(async (tech) => {
    const tickets = await axios.get(`/api/technicals/${tech.id}/tickets?type=all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return {
      technical: tech,
      totalTickets: tickets.data.length,
      openTickets: tickets.data.filter(t => t.status === 'open').length,
      resolvedTickets: tickets.data.filter(t => t.status === 'resolved').length,
    };
  })
);

// 3. Calcular estadísticas globales
const globalStats = {
  totalTechnicals: allTechnicals.data.technicals.length,
  totalTickets: technicalStats.reduce((sum, t) => sum + t.totalTickets, 0),
  totalOpen: technicalStats.reduce((sum, t) => sum + t.openTickets, 0),
  totalResolved: technicalStats.reduce((sum, t) => sum + t.resolvedTickets, 0),
};
```

---

## 🎫 Gestión de Tickets

### 1. Lista de Tickets

**Endpoint**: `GET /api/technicals/{technical_id}/tickets?type={type}`

**Tipos de filtro**:
- `today` - Tickets de hoy
- `week` - Tickets de esta semana
- `month` - Tickets de este mes
- `open` - Solo abiertos
- `in_progress` - Solo en progreso
- `resolved` - Solo resueltos
- `closed` - Solo cerrados
- `all` - Todos los tickets

#### Código Mobile:
```javascript
// TechnicalService.js
async getMyTickets(technicalId, type = 'all') {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(
    `/api/technicals/${technicalId}/tickets?type=${type}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}
```

#### UI - TicketsList.tsx:
```typescript
const TicketsList = () => {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all');

  const loadTickets = async () => {
    const technicalId = await TechnicalService.getCurrentTechnicalId();
    const data = await TechnicalService.getMyTickets(technicalId, filter);
    setTickets(data);
  };

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <ScrollView horizontal style={styles.filters}>
        <FilterButton title="Todos" value="all" current={filter} onPress={setFilter} />
        <FilterButton title="Hoy" value="today" current={filter} onPress={setFilter} />
        <FilterButton title="Abiertos" value="open" current={filter} onPress={setFilter} />
        <FilterButton title="En Progreso" value="in_progress" current={filter} onPress={setFilter} />
        <FilterButton title="Resueltos" value="resolved" current={filter} onPress={setFilter} />
      </ScrollView>

      {/* Lista */}
      <FlatList
        data={tickets}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <TicketCard ticket={item} />}
      />
    </View>
  );
};
```

### 2. Detalle de Ticket

**Endpoint**: `GET /api/tickets/{ticket_id}/detail`

**Response**:
```json
{
  "id": 42,
  "title": "Laptop no enciende",
  "description": "La laptop Dell del apartamento 301 no enciende...",
  "status": "in_progress",
  "priority": "high",
  "created_at": "2024-11-15T10:30:00.000000Z",
  "building": {
    "id": 5,
    "name": "Torre A",
    "address": "Av. Principal 123"
  },
  "apartment": {
    "id": 101,
    "number": "301"
  },
  "device": {
    "id": 88,
    "name": "Laptop Dell Inspiron",
    "brand": { "name": "Dell" },
    "model": { "name": "Inspiron 15" }
  },
  "tenant": {
    "id": 15,
    "name": "María García",
    "email": "maria@example.com",
    "phone": "+1234567890"
  },
  "history": [
    {
      "id": 120,
      "action": "status_changed",
      "description": "Estado cambiado de 'open' a 'in_progress'",
      "created_at": "2024-11-15T11:00:00.000000Z",
      "user": {
        "id": 5,
        "name": "Juan Pérez (Technical)"
      }
    },
    {
      "id": 121,
      "action": "comment_added",
      "description": "Revisaré el equipo hoy en la tarde",
      "created_at": "2024-11-15T11:05:00.000000Z",
      "user": {
        "id": 5,
        "name": "Juan Pérez (Technical)"
      }
    }
  ],
  "comments": [
    {
      "id": 55,
      "content": "Ya llegué al apartamento",
      "created_at": "2024-11-15T14:00:00.000000Z",
      "user": {
        "id": 5,
        "name": "Juan Pérez"
      }
    }
  ]
}
```

### 3. Cambiar Estado de Ticket

**Endpoint**: `POST /api/tickets/{ticket_id}/update-status`  
**Autenticación**: Requiere `auth:sanctum`

**Request**:
```json
{
  "status": "in_progress",
  "comment": "Iniciando revisión del equipo"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Ticket status updated successfully",
  "ticket": { ... }
}
```

#### Código Mobile:
```javascript
// TechnicalService.js
async updateTicketStatus(ticketId, status, comment = null) {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post(
    `/api/tickets/${ticketId}/update-status`,
    { status, comment },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}
```

#### UI - TicketDetail.tsx:
```typescript
const TicketDetail = ({ ticket }) => {
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleStatusChange = async (newStatus, comment) => {
    try {
      await TechnicalService.updateTicketStatus(ticket.id, newStatus, comment);
      Alert.alert('Éxito', 'Estado actualizado correctamente');
      // Recargar ticket
      loadTicketDetail();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  return (
    <ScrollView>
      <Button 
        title="Cambiar Estado" 
        onPress={() => setShowStatusModal(true)} 
      />
      
      <StatusChangeModal
        visible={showStatusModal}
        currentStatus={ticket.status}
        onClose={() => setShowStatusModal(false)}
        onSubmit={handleStatusChange}
      />
    </ScrollView>
  );
};
```

### 4. Agregar Comentario/Historial

**Endpoint**: `POST /api/tickets/{ticket_id}/add-history`  
**Autenticación**: Requiere `auth:sanctum`

**Request**:
```json
{
  "action": "comment_added",
  "description": "He revisado el equipo y el problema es la fuente de poder"
}
```

**Response**:
```json
{
  "success": true,
  "message": "History entry added successfully",
  "history": {
    "id": 125,
    "action": "comment_added",
    "description": "He revisado el equipo...",
    "created_at": "2024-11-15T15:30:00.000000Z"
  }
}
```

#### Código Mobile:
```javascript
async addComment(ticketId, comment) {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post(
    `/api/tickets/${ticketId}/add-history`,
    {
      action: 'comment_added',
      description: comment
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}
```

### 5. Subir Evidencia (Fotos/Videos)

**Endpoint**: `POST /api/tickets/{ticket_id}/upload-evidence`  
**Autenticación**: Requiere `auth:sanctum`  
**Content-Type**: `multipart/form-data`

**Request** (FormData):
```javascript
const formData = new FormData();
formData.append('file', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'evidence.jpg'
});
formData.append('description', 'Foto del equipo después de la reparación');
formData.append('uploaded_by', 'technical');
```

**Response**:
```json
{
  "success": true,
  "message": "Evidence uploaded successfully",
  "attachment": {
    "id": 88,
    "file_path": "/storage/tickets/42/evidence_123456.jpg",
    "file_type": "image/jpeg",
    "uploaded_by": "technical",
    "description": "Foto del equipo después de la reparación"
  }
}
```

#### Código Mobile:
```javascript
// TechnicalService.js
async uploadEvidence(ticketId, imageUri, description) {
  const token = await AsyncStorage.getItem('token');
  
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: `evidence_${Date.now()}.jpg`
  });
  formData.append('description', description);
  formData.append('uploaded_by', 'technical');
  
  const response = await axios.post(
    `/api/tickets/${ticketId}/upload-evidence`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data;
}
```

#### UI - Capturar y Subir Foto:
```typescript
import * as ImagePicker from 'expo-image-picker';

const UploadEvidenceButton = ({ ticketId }) => {
  const takePhoto = async () => {
    // Pedir permisos
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Se necesita permiso para usar la cámara');
      return;
    }

    // Tomar foto
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true
    });

    if (!result.canceled) {
      // Subir foto
      try {
        await TechnicalService.uploadEvidence(
          ticketId,
          result.assets[0].uri,
          'Evidencia del trabajo realizado'
        );
        Alert.alert('Éxito', 'Evidencia subida correctamente');
      } catch (error) {
        Alert.alert('Error', 'No se pudo subir la evidencia');
      }
    }
  };

  return (
    <TouchableOpacity onPress={takePhoto} style={styles.button}>
      <Icon name="camera" size={24} />
      <Text>Subir Evidencia</Text>
    </TouchableOpacity>
  );
};
```

### 6. Agregar Nota Privada

**Endpoint**: `POST /api/tickets/{ticket_id}/add-private-note`  
**Autenticación**: Requiere `auth:sanctum`

**Request**:
```json
{
  "note": "El cliente tiene otros 2 equipos con problemas similares. Proponer mantenimiento preventivo."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Private note added successfully",
  "note": {
    "id": 45,
    "content": "El cliente tiene otros 2 equipos...",
    "is_private": true,
    "created_at": "2024-11-15T16:00:00.000000Z"
  }
}
```

**Nota**: Las notas privadas solo son visibles para técnicos y admins, NO para members.

### 7. Enviar Mensaje al Member

**Endpoint**: `POST /api/tickets/{ticket_id}/send-message-to-technical`  
**Autenticación**: Requiere `auth:sanctum`

**Request**:
```json
{
  "message": "He completado la reparación. El equipo ya funciona correctamente.",
  "action": "technical_message"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message sent successfully to member",
  "history": {
    "id": 130,
    "action": "technical_message",
    "description": "He completado la reparación...",
    "created_at": "2024-11-15T17:00:00.000000Z"
  }
}
```

---

## 📅 Gestión de Citas (Appointments)

### 1. Obtener Mis Citas

**Endpoint**: `GET /api/technicals/{technical_id}/appointments?date={YYYY-MM-DD}`

**Query Params**:
- `date` (opcional): Filtrar por fecha específica (formato: YYYY-MM-DD)

**Response**:
```json
[
  {
    "id": 25,
    "title": "Reparación Laptop Dell",
    "description": "Revisar y reparar laptop que no enciende",
    "scheduled_for": "2024-11-15T14:00:00.000000Z",
    "estimated_duration": 60,
    "status": "scheduled",
    "technical_id": 2,
    "ticket_id": 42,
    "ticket": {
      "id": 42,
      "title": "Laptop no enciende",
      "status": "in_progress",
      "priority": "high",
      "device": {
        "id": 88,
        "name": "Laptop Dell Inspiron"
      },
      "apartment": {
        "id": 101,
        "number": "301",
        "building": {
          "id": 5,
          "name": "Torre A",
          "address": "Av. Principal 123"
        }
      },
      "user": {
        "id": 15,
        "name": "María García",
        "email": "maria@example.com",
        "tenant": {
          "phone": "+1234567890"
        }
      }
    },
    "tenant": {
      "id": 15,
      "name": "María García",
      "email": "maria@example.com",
      "phone": "+1234567890"
    }
  }
]
```

#### Código Mobile:
```javascript
// TechnicalService.js
async getMyAppointments(technicalId, date = null) {
  const token = await AsyncStorage.getItem('token');
  let url = `/api/technicals/${technicalId}/appointments`;
  
  if (date) {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    url += `?date=${dateStr}`;
  }
  
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}
```

### 2. Detalle de Cita

**Endpoint**: `GET /api/appointments/{appointment_id}/details`  
**Autenticación**: Requiere `auth:sanctum`

**Response**:
```json
{
  "appointment": {
    "id": 25,
    "title": "Reparación Laptop Dell",
    "description": "Revisar y reparar laptop que no enciende",
    "scheduled_for": "2024-11-15T14:00:00.000000Z",
    "estimated_duration": 60,
    "status": "scheduled",
    "technical_notes": null,
    "member_instructions": "Por favor tocar el timbre del apartamento",
    "started_at": null,
    "completed_at": null,
    "ticket": { ... },
    "technical": { ... }
  },
  "googleMapsApiKey": "AIza..."
}
```

### 3. Crear Nueva Cita

**Endpoint**: `POST /api/tickets/{ticket_id}/appointments`  
**Autenticación**: Requiere `auth:sanctum`

**Request**:
```json
{
  "title": "Revisión de Router",
  "description": "Revisar configuración del router WiFi",
  "scheduled_for": "2024-11-16T10:00:00",
  "estimated_duration": 45,
  "technical_notes": "Llevar cable Ethernet de repuesto",
  "member_instructions": "Asegurarse de estar en casa"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "appointment": {
    "id": 26,
    "title": "Revisión de Router",
    "scheduled_for": "2024-11-16T10:00:00.000000Z",
    "status": "scheduled"
  }
}
```

### 4. Iniciar Cita

**Endpoint**: `POST /api/appointments/{appointment_id}/start`  
**Autenticación**: Requiere `auth:sanctum`

**Request**: (vacío)

**Response**:
```json
{
  "success": true,
  "message": "Appointment started successfully",
  "appointment": {
    "id": 25,
    "status": "in_progress",
    "started_at": "2024-11-15T14:05:00.000000Z"
  }
}
```

**Reglas de Negocio**:
- Solo se puede iniciar si `status = 'scheduled'`
- Cambia el estado a `in_progress`
- Registra `started_at` con timestamp actual

#### Código Mobile:
```javascript
async startAppointment(appointmentId) {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post(
    `/api/appointments/${appointmentId}/start`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}
```

#### UI:
```typescript
const AppointmentDetail = ({ appointment }) => {
  const handleStart = async () => {
    Alert.alert(
      'Iniciar Cita',
      '¿Confirmas que has llegado al lugar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: async () => {
            try {
              await TechnicalService.startAppointment(appointment.id);
              Alert.alert('Éxito', 'Cita iniciada correctamente');
              // Recargar
            } catch (error) {
              Alert.alert('Error', 'No se pudo iniciar la cita');
            }
          }
        }
      ]
    );
  };

  return (
    <View>
      {appointment.status === 'scheduled' && (
        <Button title="Iniciar Cita" onPress={handleStart} />
      )}
    </View>
  );
};
```

### 5. Completar Cita

**Endpoint**: `POST /api/appointments/{appointment_id}/complete`  
**Autenticación**: Requiere `auth:sanctum`

**Request**:
```json
{
  "completion_notes": "Reparación completada. Reemplacé la fuente de poder y el equipo funciona correctamente."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Appointment completed successfully",
  "appointment": {
    "id": 25,
    "status": "awaiting_feedback",
    "completed_at": "2024-11-15T15:30:00.000000Z",
    "completion_notes": "Reparación completada..."
  }
}
```

**Reglas de Negocio**:
- Solo se puede completar si `status = 'in_progress'`
- Cambia el estado a `awaiting_feedback` (esperando feedback del member)
- Registra `completed_at` con timestamp actual

### 6. Cancelar Cita

**Endpoint**: `POST /api/appointments/{appointment_id}/cancel`  
**Autenticación**: Requiere `auth:sanctum`

**Request**:
```json
{
  "cancellation_reason": "El miembro no está disponible en el horario programado"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "appointment": {
    "id": 25,
    "status": "cancelled",
    "cancellation_reason": "El miembro no está disponible..."
  }
}
```

### 7. Reprogramar Cita

**Endpoint**: `POST /api/appointments/{appointment_id}/reschedule`  
**Autenticación**: Requiere `auth:sanctum`

**Request**:
```json
{
  "new_date": "2024-11-16T16:00:00",
  "reason": "Conflicto con otra cita urgente"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Appointment rescheduled successfully",
  "appointment": {
    "id": 25,
    "scheduled_for": "2024-11-16T16:00:00.000000Z",
    "reschedule_reason": "Conflicto con otra cita urgente"
  }
}
```

---

## 🔔 Notificaciones Push

### 1. Registrar Token de Push

**Endpoint**: `POST /api/tenant/register-push-token`  
**Autenticación**: Requiere `auth:sanctum`

**Request**:
```json
{
  "token": "ExponentPushToken[abc123xyz...]",
  "device_type": "android"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Push token registered successfully"
}
```

#### Código Mobile:
```javascript
// NotificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

async registerForPushNotifications() {
  let token;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('No se pudo obtener permiso para notificaciones');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }
  
  // Registrar en el backend
  const authToken = await AsyncStorage.getItem('token');
  await axios.post(
    '/api/tenant/register-push-token',
    {
      token: token,
      device_type: Platform.OS
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  
  return token;
}
```

### 2. Tipos de Notificaciones para Técnicos

| Evento | Título | Descripción |
|--------|--------|-------------|
| **Ticket Asignado** | "Nuevo Ticket Asignado" | "Se te ha asignado el ticket #42: Laptop no enciende" |
| **Mensaje de Member** | "Nuevo Mensaje" | "María García envió un mensaje en el ticket #42" |
| **Cita Próxima** | "Cita en 1 hora" | "Recuerda tu cita en Torre A, Apt 301 a las 2:00 PM" |
| **Cambio de Prioridad** | "Prioridad Actualizada" | "El ticket #42 cambió a prioridad URGENTE" |
| **Ticket Reabierto** | "Ticket Reabierto" | "El ticket #42 fue reabierto por el member" |

### 3. Manejar Notificaciones en App

```javascript
// App.tsx
useEffect(() => {
  // Handler cuando la app está en primer plano
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notificación recibida:', notification);
    // Mostrar banner o actualizar badge
  });

  // Handler cuando el usuario toca la notificación
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    const { data } = response.notification.request.content;
    
    if (data.type === 'ticket_assigned' || data.type === 'message_received') {
      // Navegar al detalle del ticket
      navigation.navigate('TicketDetail', { ticketId: data.ticket_id });
    } else if (data.type === 'appointment_reminder') {
      // Navegar al detalle de la cita
      navigation.navigate('AppointmentDetail', { appointmentId: data.appointment_id });
    }
  });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}, []);
```

---

## 📱 Implementación Mobile

### Estructura de Carpetas Sugerida

```
src/
├── screens/
│   ├── Technical/
│   │   ├── Dashboard/
│   │   │   ├── RegularDashboard.tsx
│   │   │   └── ChiefDashboard.tsx
│   │   ├── Tickets/
│   │   │   ├── TicketsList.tsx
│   │   │   ├── TicketDetail.tsx
│   │   │   └── TicketFilters.tsx
│   │   ├── Appointments/
│   │   │   ├── AppointmentsList.tsx
│   │   │   ├── AppointmentDetail.tsx
│   │   │   └── CreateAppointment.tsx
│   │   └── TechnicalsList.tsx (solo para chief)
│   └── Auth/
│       └── Login.tsx
├── services/
│   ├── AuthService.js
│   ├── TechnicalService.js
│   ├── TicketService.js
│   ├── AppointmentService.js
│   └── NotificationService.js
├── components/
│   ├── TicketCard.tsx
│   ├── AppointmentCard.tsx
│   ├── StatusBadge.tsx
│   ├── PriorityBadge.tsx
│   └── FilterButton.tsx
├── navigation/
│   ├── AppNavigator.tsx
│   ├── TechnicalNavigator.tsx
│   └── MemberNavigator.tsx
└── contexts/
    └── AuthContext.tsx
```

### Navegación

```typescript
// AppNavigator.tsx
const AppNavigator = () => {
  const { user, userType, isDefaultTechnical } = useAuth();

  if (!user) {
    return <AuthStack />;
  }

  if (userType === 'member') {
    return <MemberNavigator />;
  }

  if (userType === 'technical') {
    if (isDefaultTechnical) {
      return <TechnicalChiefNavigator />;
    } else {
      return <TechnicalRegularNavigator />;
    }
  }

  return null;
};

// TechnicalRegularNavigator.tsx
const TechnicalRegularNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={RegularDashboard} />
      <Tab.Screen name="MyTickets" component={TicketsList} />
      <Tab.Screen name="MyAppointments" component={AppointmentsList} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// TechnicalChiefNavigator.tsx
const TechnicalChiefNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={ChiefDashboard} />
      <Tab.Screen name="AllTickets" component={TicketsList} />
      <Tab.Screen name="AllAppointments" component={AppointmentsList} />
      <Tab.Screen name="Technicals" component={TechnicalsList} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
```

---

## 🧪 Testing y Validación

### Backend Testing (Postman)

#### 1. Login como Técnico
```http
POST /api/tenant/login
Content-Type: application/json

{
  "email": "technical@example.com",
  "password": "password"
}

# Guardar el token de la respuesta
```

#### 2. Obtener Mis Tickets
```http
GET /api/technicals/2/tickets?type=all
Authorization: Bearer {token}
```

#### 3. Cambiar Estado de Ticket
```http
POST /api/tickets/42/update-status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_progress",
  "comment": "Iniciando revisión"
}
```

#### 4. Subir Evidencia
```http
POST /api/tickets/42/upload-evidence
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (binary)
description: "Foto del equipo reparado"
uploaded_by: "technical"
```

#### 5. Iniciar Cita
```http
POST /api/appointments/25/start
Authorization: Bearer {token}
```

### Mobile Testing Checklist

- [ ] Login como técnico regular
- [ ] Login como técnico jefe
- [ ] Dashboard muestra estadísticas correctas
- [ ] Lista de tickets carga correctamente
- [ ] Filtros de tickets funcionan
- [ ] Detalle de ticket muestra toda la información
- [ ] Cambiar estado de ticket
- [ ] Agregar comentario a ticket
- [ ] Subir foto como evidencia
- [ ] Agregar nota privada
- [ ] Lista de citas carga correctamente
- [ ] Detalle de cita muestra mapa
- [ ] Iniciar cita
- [ ] Completar cita con notas
- [ ] Cancelar cita
- [ ] Reprogramar cita
- [ ] Notificaciones push se reciben
- [ ] Tocar notificación navega a detalle
- [ ] Logout funciona correctamente

---

## 📝 Resumen de Endpoints

### Autenticación
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/tenant/login` | No | Login unificado (members y técnicos) |
| POST | `/api/tenant/logout` | Sí | Cerrar sesión |
| GET | `/api/tenant/me` | Sí | Obtener usuario actual |

### Técnicos
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/technicals` | No | Lista de todos los técnicos |
| GET | `/api/technicals/{id}/tickets` | No | Tickets de un técnico |
| GET | `/api/technicals/{id}/appointments` | No | Citas de un técnico |

### Tickets
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/tickets/{id}/detail` | No | Detalle de un ticket |
| POST | `/api/tickets/{id}/update-status` | Sí | Cambiar estado |
| POST | `/api/tickets/{id}/add-history` | Sí | Agregar comentario |
| POST | `/api/tickets/{id}/upload-evidence` | Sí | Subir evidencia |
| POST | `/api/tickets/{id}/add-private-note` | Sí | Agregar nota privada |
| POST | `/api/tickets/{id}/send-message-to-technical` | Sí | Enviar mensaje |

### Appointments
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/appointments/{id}/details` | Sí | Detalle de cita |
| POST | `/api/tickets/{id}/appointments` | Sí | Crear cita |
| POST | `/api/appointments/{id}/start` | Sí | Iniciar cita |
| POST | `/api/appointments/{id}/complete` | Sí | Completar cita |
| POST | `/api/appointments/{id}/cancel` | Sí | Cancelar cita |
| POST | `/api/appointments/{id}/reschedule` | Sí | Reprogramar cita |

### Notificaciones
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/tenant/register-push-token` | Sí | Registrar token push |
| GET | `/api/tenant/notifications` | Sí | Obtener notificaciones |
| POST | `/api/tenant/notifications/{id}/read` | Sí | Marcar como leída |

---

## 🎯 Checklist de Implementación

### Backend ✅
- [x] Rutas API agregadas en `routes/api.php`
- [x] Método `getAppointments()` en `TechnicalController`
- [x] Métodos existentes verificados en `TicketController`
- [x] Métodos existentes verificados en `AppointmentController`

### Mobile 📱
- [ ] Modificar `AuthService` para detectar tipo de usuario
- [ ] Crear `TechnicalNavigator` con 2 variantes (regular/chief)
- [ ] Implementar `RegularDashboard`
- [ ] Implementar `ChiefDashboard`
- [ ] Crear `TicketsList` con filtros
- [ ] Crear `TicketDetail` con todas las acciones
- [ ] Crear `AppointmentsList`
- [ ] Crear `AppointmentDetail` con mapa
- [ ] Implementar acciones de citas (start, complete, cancel, reschedule)
- [ ] Implementar notificaciones push
- [ ] Testing en iOS y Android

### Documentación ✅
- [x] Guía completa de implementación
- [x] Ejemplos de código para cada endpoint
- [x] Diagramas de flujo
- [x] Checklist de testing

---

## 🚀 ¡Comienza Aquí!

1. **Backend**: Las rutas ya están implementadas ✅
2. **Testing**: Prueba los endpoints con Postman
3. **Mobile**: Empieza con el login y detección de tipo de usuario
4. **Dashboard**: Implementa primero el dashboard (algo visual rápido)
5. **Tickets**: Luego los tickets (funcionalidad más usada)
6. **Appointments**: Finalmente las citas (más complejo)

**¿Necesitas ayuda?** Revisa los ejemplos de código en esta guía. Cada endpoint tiene su ejemplo completo.

**¡Éxito con la implementación! 🎉**
