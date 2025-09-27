# 📱 Guía Completa de Implementación Push Notifications - Mobile (FCM + Expo)

## 🎯 **IMPORTANTE: Soporte Dual para Expo Go y APK Standalone**

El sistema backend ahora soporta:
- **Expo Go**: Usa Expo Push Service ✅
- **APK Standalone**: Usa Firebase Cloud Messaging (FCM) ✅

**La app debe detectar el tipo y enviar el `token_type` correcto al backend.**

---

## 🎯 **Para el Equipo Móvil - Implementación Requerida:**

### 📋 **Checklist de Implementación:**

- [ ] 1. **Registrar token automáticamente al login**
- [ ] 2. **Actualizar token cuando cambie**
- [ ] 3. **Remover token al logout**
- [ ] 4. **Manejar notificaciones recibidas**
- [ ] 5. **Navegación por notificaciones**

## 🔧 **1. Configuración Inicial (Expo + FCM)**

### **Para APK Standalone (FCM):**
Instalar Firebase:
```bash
expo install @react-native-firebase/app @react-native-firebase/messaging
```

### **Para Expo Go (Expo Push Service):**
```bash
expo install expo-notifications expo-device expo-constants
```

### En tu `app.json` o `app.config.js`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

### Instalar dependencias:
```bash
npx expo install expo-notifications expo-device expo-constants
```

## 🚀 **2. Servicio de Push Notifications (Dual Support)**

Crea `services/PushNotificationService.js`:

```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api'; // Tu servicio de API

class PushNotificationService {
  constructor() {
    // Configurar cómo manejar las notificaciones
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Detectar el tipo de aplicación y obtener el token apropiado
   */
  async getTokenInfo() {
    try {
      const appOwnership = Constants.appOwnership;
      const executionEnvironment = Constants.executionEnvironment;
      
      // Determinar si es Expo Go o APK Standalone
      const isExpoGo = appOwnership === 'expo';
      const isStandalone = appOwnership === 'standalone';
      
      let token;
      let tokenType;
      
      if (isExpoGo || executionEnvironment === 'expo') {
        // EXPO GO - Usar Expo Push Token
        tokenType = 'expo';
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
      } else {
        // APK STANDALONE - Usar FCM
        tokenType = 'fcm';
        
        // Para APK standalone, necesitamos Firebase
        try {
          const messaging = require('@react-native-firebase/messaging').default;
          await messaging().requestPermission();
          token = await messaging().getToken();
        } catch (fcmError) {
          console.log('❌ FCM not available, fallback to Expo token');
          tokenType = 'expo';
          token = (await Notifications.getExpoPushTokenAsync()).data;
        }
      }

      return {
        token,
        tokenType,
        appOwnership,
        isStandalone,
        executionEnvironment,
        platform: Platform.OS,
        deviceType: Device.deviceType === Device.DeviceType.PHONE ? 'phone' : 'tablet',
        deviceName: Device.deviceName || `${Platform.OS} Device`,
      };

    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  }

  /**
   * Registrar token de push notification
   */
  async registerForPushNotifications() {
    try {
      if (!Device.isDevice) {
        console.log('❌ Push notifications only work on physical devices');
        return null;
      }

      // Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permissions denied');
        return null;
      }

      // Obtener información del token
      const tokenInfo = await this.getTokenInfo();
      console.log('📱 Token Info:', tokenInfo);

      // Registrar en el backend
      const response = await api.post('/tenant/register-push-token', {
        push_token: tokenInfo.token,
        token_type: tokenInfo.tokenType, // 'expo' o 'fcm'
        platform: tokenInfo.platform,
        device_type: tokenInfo.deviceType,
        device_name: tokenInfo.deviceName,
        app_ownership: tokenInfo.appOwnership,
        is_standalone: tokenInfo.isStandalone,
        execution_environment: tokenInfo.executionEnvironment,
      });

      if (response.data.success) {
        console.log('✅ Push token registered successfully');
        console.log(`📱 Type: ${tokenInfo.tokenType.toUpperCase()}`);
        return tokenInfo;
      } else {
        console.error('❌ Failed to register push token:', response.data.message);
        return null;
      }

    } catch (error) {
      console.error('❌ Error registering push token:', error);
      return null;
    }
  }
        }

        // Obtener token
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id'
        })).data;

        console.log('✅ Push token obtenido:', token);

        // Registrar token en el backend
        await this.registerTokenWithBackend(token);

        return token;
      } else {
        console.log('❌ Push notifications no funcionan en simulador');
        return null;
      }
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Enviar token al backend
   */
  async registerTokenWithBackend(token) {
    try {
      const platform = Device.osName?.toLowerCase() || 'unknown';
      const deviceName = Device.deviceName || 'Unknown Device';

      const response = await api.post('/tenant/register-push-token', {
        push_token: token,
        platform: platform === 'ios' ? 'ios' : 'android',
        device_name: deviceName,
        device_type: platform
      });

      console.log('✅ Token registrado en backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error registering token with backend:', error);
      throw error;
    }
  }

  /**
   * Remover token del backend
   */
  async removeTokenFromBackend(token) {
    try {
      await api.post('/tenant/remove-push-token', {
        push_token: token
      });
      console.log('✅ Token removido del backend');
    } catch (error) {
      console.error('❌ Error removing token from backend:', error);
    }
  }

  /**
   * Configurar listeners de notificaciones
   */
  setupNotificationListeners(navigation) {
    // Listener para cuando la notificación es recibida mientras la app está abierta
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notificación recibida:', notification);
      // Puedes mostrar una alerta o actualizar el badge aquí
    });

    // Listener para cuando el usuario toca la notificación
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notificación tocada:', response);
      
      const data = response.notification.request.content.data;
      
      // Navegar basado en el tipo de notificación
      this.handleNotificationNavigation(data, navigation);
    });
  }

  /**
   * Manejar navegación por notificaciones
   */
  handleNotificationNavigation(data, navigation) {
    try {
      switch (data.type) {
        case 'ticket':
          if (data.entityId) {
            navigation.navigate('TicketDetail', { ticketId: data.entityId });
          } else {
            navigation.navigate('Tickets');
          }
          break;
        
        case 'appointment':
          if (data.entityId) {
            navigation.navigate('AppointmentDetail', { appointmentId: data.entityId });
          } else {
            navigation.navigate('Appointments');
          }
          break;
        
        default:
          navigation.navigate('Notifications');
          break;
      }
    } catch (error) {
      console.error('❌ Error navigating from notification:', error);
      // Fallback a la pantalla principal
      navigation.navigate('Home');
    }
  }

  /**
   * Limpiar listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Enviar push notification de prueba
   */
  async sendTestNotification(title, body) {
    try {
      const response = await api.post('/tenant/send-push-notification', {
        title,
        body,
        data: {
          type: 'test',
          screen: '/home',
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('✅ Test notification sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  }
}

export const pushNotificationService = new PushNotificationService();
```

## 🔑 **3. Hook para Push Notifications**

Crea `hooks/usePushNotifications.js`:

```javascript
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { pushNotificationService } from '../services/PushNotificationService';
import { useAuth } from './useAuth'; // Tu hook de autenticación

export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const navigation = useNavigation();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    let mounted = true;

    const initializePushNotifications = async () => {
      if (isAuthenticated && mounted) {
        // Registrar para push notifications
        const token = await pushNotificationService.registerForPushNotifications();
        
        if (token && mounted) {
          setPushToken(token);
          setIsRegistered(true);
        }

        // Configurar listeners
        pushNotificationService.setupNotificationListeners(navigation);
      }
    };

    initializePushNotifications();

    // Cleanup cuando el componente se desmonte
    return () => {
      mounted = false;
      if (isRegistered) {
        pushNotificationService.cleanup();
      }
    };
  }, [isAuthenticated, navigation]);

  // Remover token al hacer logout
  useEffect(() => {
    const handleLogout = async () => {
      if (!isAuthenticated && pushToken) {
        await pushNotificationService.removeTokenFromBackend(pushToken);
        setPushToken(null);
        setIsRegistered(false);
      }
    };

    handleLogout();
  }, [isAuthenticated, pushToken]);

  return {
    pushToken,
    isRegistered,
    sendTestNotification: pushNotificationService.sendTestNotification.bind(pushNotificationService)
  };
};
```

## 📱 **4. Integración en App Principal**

En tu `App.js` o componente raíz:

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { usePushNotifications } from './hooks/usePushNotifications';
import MainNavigator from './navigation/MainNavigator';

export default function App() {
  // Inicializar push notifications
  const { pushToken, isRegistered } = usePushNotifications();

  React.useEffect(() => {
    if (isRegistered) {
      console.log('✅ Push notifications initialized');
    }
  }, [isRegistered]);

  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
}
```

## 🧪 **5. Pantalla de Testing (Opcional)**

Crea una pantalla para probar push notifications:

```javascript
import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function PushTestScreen() {
  const { pushToken, isRegistered, sendTestNotification } = usePushNotifications();

  const handleTestPush = async () => {
    try {
      await sendTestNotification(
        '🎉 Test Notification',
        'Esta es una notificación de prueba desde tu app móvil!'
      );
      Alert.alert('✅ Éxito', 'Notificación de prueba enviada');
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo enviar la notificación');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Push Notifications Test</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Estado:</Text>
        <Text style={styles.value}>
          {isRegistered ? '✅ Registrado' : '❌ No registrado'}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Token:</Text>
        <Text style={styles.tokenValue} numberOfLines={3}>
          {pushToken || 'No disponible'}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, !isRegistered && styles.buttonDisabled]}
        onPress={handleTestPush}
        disabled={!isRegistered}
      >
        <Text style={styles.buttonText}>
          Enviar Notificación de Prueba
        </Text>
      </TouchableOpacity>

      <Text style={styles.instructions}>
        📱 Para ver la notificación, cierra completamente la app después de presionar el botón
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  infoContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  tokenValue: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
```

## 📋 **6. Checklist de Implementación**

### ✅ **Paso 1: Configuración**
- [ ] Instalar dependencias: `expo-notifications`, `expo-device`, `expo-constants`
- [ ] Configurar `app.json` con el plugin de notifications
- [ ] Obtener Project ID de Expo (si usas EAS)

### ✅ **Paso 2: Servicios**
- [ ] Crear `PushNotificationService.js`
- [ ] Crear hook `usePushNotifications.js`
- [ ] Integrar en `App.js`

### ✅ **Paso 3: Testing**
- [ ] Crear pantalla de testing (opcional)
- [ ] Probar registro de token
- [ ] Probar envío de notificación
- [ ] Verificar navegación por notificación

### ✅ **Paso 4: Validación**
- [ ] Verificar que funciona con app cerrada
- [ ] Probar en dispositivo real (no simulador)
- [ ] Validar que navega correctamente
- [ ] Confirmar que remueve token al logout

## 🎯 **Eventos que Envían Push Automáticamente**

Una vez implementado, recibirás push notifications automáticamente para:

- 🎫 **Ticket creado**
- 👨‍🔧 **Técnico asignado**
- 📋 **Estado de ticket actualizado**
- 💬 **Mensaje del técnico**
- 📅 **Nueva cita programada**
- ⏰ **Recordatorios**
- ✅ **Trabajos completados**

## 🔍 **Debug y Troubleshooting**

### Verificar registro de token:
```javascript
// En cualquier lugar de tu app
console.log('Current push token:', await Notifications.getExpoPushTokenAsync());
```

### Ver tokens registrados en backend:
```bash
# Desde Postman/Insomnia
GET https://adkassist.com/api/tenant/push-tokens
Authorization: Bearer TU_TOKEN_DE_AUTENTICACION
```

### Logs del backend:
```bash
tail -f storage/logs/laravel.log | grep "Push"
```

¡Con esta implementación tendrás push notifications completamente funcionales! 🚀