# Guía de Integración Técnica - API Tenant

## Variables de Entorno y Configuración

### URLs de API
```javascript
// Desarrollo
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Producción (ejemplo)
const API_BASE_URL = 'https://tu-dominio.com/api';
```

---

## Tipos de Datos TypeScript

```typescript
// Interfaces para TypeScript
interface User {
  id: number;
  name: string;
  email: string;
  tenant_id: number;
}

interface Tenant {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  apartment_id: number;
  apartment?: Apartment;
}

interface Apartment {
  id: number;
  name: string;
  ubicacion?: string;
  status: boolean;
  other_tenants: Tenant[];
  building?: Building;
}

interface Building {
  id: number;
  name: string;
  managing_company?: string;
  address?: string;
  description?: string;
  location_link?: string;
  image?: string;
  status: boolean;
  owner?: Owner;
}

interface Device {
  id: number;
  name: string;
  status: boolean;
  ubicacion?: string;
  brand?: string;
  model?: string;
  system?: string;
  device_type?: string;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  device?: Device;
  technical?: Technical;
  histories_count: number;
  histories?: TicketHistory[];
}

interface TicketHistory {
  id: number;
  action: string;
  description: string;
  user_name: string;
  created_at: string;
}

interface Owner {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
}

interface Doorman {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  shift: 'morning' | 'afternoon' | 'night';
}

interface Technical {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

// Responses de la API
interface LoginResponse {
  user: User;
  tenant: Tenant;
  token: string;
}

interface DevicesResponse {
  own_devices: Device[];
  shared_devices: Device[];
}

interface TicketsResponse {
  tickets: Ticket[];
}

interface ApiError {
  error: string;
  message?: string;
  errors?: Record<string, string[]>;
}
```

---

## Servicios React Native

### 1. Servicio de Autenticación

```javascript
// services/AuthService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.baseURL = 'http://127.0.0.1:8000/api';
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/tenant/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar datos en AsyncStorage
        await AsyncStorage.setItem('auth_token', data.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
        await AsyncStorage.setItem('tenant_data', JSON.stringify(data.tenant));
        
        return {
          success: true,
          data: data,
        };
      } else {
        return {
          success: false,
          error: data.message || 'Login failed',
          validation_errors: data.errors || {},
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error: ' + error.message,
      };
    }
  }

  async logout() {
    try {
      const token = await this.getToken();
      
      if (token) {
        await fetch(`${this.baseURL}/tenant/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
      }

      // Limpiar AsyncStorage
      await AsyncStorage.multiRemove([
        'auth_token',
        'user_data', 
        'tenant_data'
      ]);

      return { success: true };
    } catch (error) {
      // Limpiar datos locales aunque falle la petición
      await AsyncStorage.clear();
      return { success: false, error: error.message };
    }
  }

  async getToken() {
    return await AsyncStorage.getItem('auth_token');
  }

  async getUserData() {
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  async getTenantData() {
    const tenantData = await AsyncStorage.getItem('tenant_data');
    return tenantData ? JSON.parse(tenantData) : null;
  }

  async isAuthenticated() {
    const token = await this.getToken();
    return !!token;
  }
}

export default new AuthService();
```

### 2. Servicio de API Principal

```javascript
// services/ApiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from './AuthService';

class ApiService {
  constructor() {
    this.baseURL = 'http://127.0.0.1:8000/api';
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const token = await AuthService.getToken();
      
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      };

      const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, mergedOptions);
      const data = await response.json();

      if (response.status === 401) {
        // Token expirado - redirigir al login
        await AuthService.logout();
        throw new Error('Session expired');
      }

      return {
        success: response.ok,
        status: response.status,
        data: response.ok ? data : null,
        error: !response.ok ? data.error || data.message : null,
        validation_errors: !response.ok ? data.errors : null,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Métodos específicos de la API
  async getProfile() {
    return this.makeRequest('/tenant/me');
  }

  async getDevices() {
    return this.makeRequest('/tenant/devices');
  }

  async getTickets(status = 'all') {
    const query = status !== 'all' ? `?status=${status}` : '';
    return this.makeRequest(`/tenant/tickets${query}`);
  }

  async createTicket(ticketData) {
    return this.makeRequest('/tenant/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  async getTicketDetail(ticketId) {
    return this.makeRequest(`/tenant/tickets/${ticketId}`);
  }

  async getApartment() {
    return this.makeRequest('/tenant/apartment');
  }

  async getBuilding() {
    return this.makeRequest('/tenant/building');
  }

  async getDoormen() {
    return this.makeRequest('/tenant/doormen');
  }

  async getOwner() {
    return this.makeRequest('/tenant/owner');
  }
}

export default new ApiService();
```

---

## Hooks de React Native

### 1. Hook para Autenticación

```javascript
// hooks/useAuth.js
import { useState, useEffect, useContext, createContext } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const userData = await AuthService.getUserData();
        const tenantData = await AuthService.getTenantData();
        setUser(userData);
        setTenant(tenantData);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const result = await AuthService.login(email, password);
    
    if (result.success) {
      setIsAuthenticated(true);
      setUser(result.data.user);
      setTenant(result.data.tenant);
    }
    
    return result;
  };

  const logout = async () => {
    const result = await AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setTenant(null);
    return result;
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      tenant,
      loading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2. Hook para Datos de la API

```javascript
// hooks/useApiData.js
import { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/ApiService';

export const useApiData = (endpoint, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await ApiService.makeRequest(endpoint);
    
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  }, [endpoint, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hooks específicos
export const useProfile = () => useApiData('/tenant/me');
export const useDevices = () => useApiData('/tenant/devices');
export const useTickets = (status = 'all') => {
  const endpoint = status !== 'all' ? `/tenant/tickets?status=${status}` : '/tenant/tickets';
  return useApiData(endpoint, [status]);
};
export const useApartment = () => useApiData('/tenant/apartment');
export const useBuilding = () => useApiData('/tenant/building');
export const useDoormen = () => useApiData('/tenant/doormen');
export const useOwner = () => useApiData('/tenant/owner');
```

---

## Componentes de Ejemplo

### 1. Screen de Login

```javascript
// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigation.replace('Dashboard');
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tenant Login</Text>
      
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
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
```

### 2. Screen de Dispositivos

```javascript
// screens/DevicesScreen.js
import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useDevices } from '../hooks/useApiData';

const DeviceCard = ({ device, isShared = false }) => (
  <View style={styles.deviceCard}>
    <View style={styles.deviceHeader}>
      <Text style={styles.deviceName}>{device.name}</Text>
      <View style={[styles.statusBadge, device.status ? styles.active : styles.inactive]}>
        <Text style={styles.statusText}>
          {device.status ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </View>
    
    <Text style={styles.deviceInfo}>
      {device.brand} {device.model}
    </Text>
    
    <Text style={styles.deviceLocation}>
      📍 {device.ubicacion || 'No location'}
    </Text>
    
    <Text style={styles.deviceType}>
      Type: {device.device_type || 'Unknown'}
    </Text>
    
    {isShared && device.owner && (
      <Text style={styles.sharedInfo}>
        Shared by: {device.owner.name}
      </Text>
    )}
  </View>
);

const DevicesScreen = () => {
  const { data: devicesData, loading, error, refetch } = useDevices();

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  const renderDevice = ({ item, index }) => (
    <DeviceCard key={index} device={item} />
  );

  const renderSharedDevice = ({ item, index }) => (
    <DeviceCard key={index} device={item} isShared={true} />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Devices</Text>
      
      {devicesData?.own_devices?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Own Devices</Text>
          <FlatList
            data={devicesData.own_devices}
            renderItem={renderDevice}
            keyExtractor={(item) => `own-${item.id}`}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={refetch} />
            }
          />
        </>
      )}
      
      {devicesData?.shared_devices?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Shared Devices</Text>
          <FlatList
            data={devicesData.shared_devices}
            renderItem={renderSharedDevice}
            keyExtractor={(item) => `shared-${item.id}`}
          />
        </>
      )}
      
      {!loading && (!devicesData?.own_devices?.length && !devicesData?.shared_devices?.length) && (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No devices found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#333',
  },
  deviceCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  active: {
    backgroundColor: '#e8f5e8',
  },
  inactive: {
    backgroundColor: '#ffeaea',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  deviceInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  deviceLocation: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 12,
    color: '#999',
  },
  sharedInfo: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default DevicesScreen;
```

---

## Manejo de Estados y Errores

### 1. Estados de Loading

```javascript
// components/LoadingStates.js
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

export const ErrorMessage = ({ error, onRetry }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>❌ {error}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
  },
});
```

---

## Validaciones y Constantes

```javascript
// constants/api.js
export const API_ENDPOINTS = {
  LOGIN: '/tenant/login',
  LOGOUT: '/tenant/logout',
  PROFILE: '/tenant/me',
  DEVICES: '/tenant/devices',
  TICKETS: '/tenant/tickets',
  APARTMENT: '/tenant/apartment',
  BUILDING: '/tenant/building',
  DOORMEN: '/tenant/doormen',
  OWNER: '/tenant/owner',
};

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
};

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const TICKET_CATEGORIES = [
  'Hardware',
  'Software',
  'Conectividad',
  'Mantenimiento',
  'Otro',
];

// utils/validation.js
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateTicketForm = (data) => {
  const errors = {};

  if (!data.device_id) {
    errors.device_id = 'Device is required';
  }

  if (!data.category) {
    errors.category = 'Category is required';
  }

  if (!data.title || data.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
```

Esta documentación técnica proporciona todo lo necesario para que cualquier desarrollador pueda integrar rápidamente la API en una aplicación React Native, incluyendo tipos de datos, servicios, hooks, componentes y manejo de errores.
