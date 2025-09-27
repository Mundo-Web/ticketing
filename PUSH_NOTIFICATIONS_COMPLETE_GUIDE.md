# 📱 Push Notifications System - Complete Implementation Guide

## 🎯 **Overview**

Este sistema implementa notificaciones push **universales** que funcionan tanto en **Expo Go** (desarrollo) como en **APK standalone** (producción) usando una arquitectura dual:

- **Expo Go** → Expo Push Service
- **APK Standalone** → Firebase Cloud Messaging (FCM)

El backend **detecta automáticamente** el tipo de token y envía la notificación al servicio correcto.

---

## 🏗️ **Backend Architecture (COMPLETADO ✅)**

### **1. Base de Datos**
```sql
-- Tabla push_tokens con soporte FCM
CREATE TABLE push_tokens (
    id BIGINT PRIMARY KEY,
    tenant_id BIGINT,
    push_token VARCHAR(500),
    platform VARCHAR(20),
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    token_type VARCHAR(10) DEFAULT 'expo',      -- 'expo' o 'fcm'
    app_ownership VARCHAR(20),                  -- 'expo' o 'standalone'
    is_standalone BOOLEAN DEFAULT FALSE,
    execution_environment VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### **2. Services Implementados**
- ✅ **PushNotificationService**: Servicio dual Expo + FCM
- ✅ **Auto-detection**: Detecta automáticamente el tipo de token
- ✅ **Auto-correction**: Corrige tokens mal clasificados
- ✅ **Fallback system**: Si FCM falla, usa Expo como respaldo

### **3. API Endpoints**
```
POST /api/tenant/register-push-token    # Registrar token
POST /api/tenant/remove-push-token      # Remover token  
POST /api/tenant/send-push-notification # Enviar notificación de prueba
GET  /api/tenant/push-tokens            # Ver tokens registrados
```

### **4. Automatic Notifications**
- ✅ **Listener System**: Notificaciones automáticas en TODOS los eventos
- ✅ **Direct Integration**: Llamadas directas en métodos críticos
- ✅ **Comprehensive Logging**: Logs detallados para debugging

---

## 📱 **Mobile Implementation (REACT NATIVE)**

### **🔧 Step 1: Install Dependencies**

```bash
# Para Expo Go y Push Notifications básicas
npm install expo-notifications expo-device expo-constants

# Para APK Standalone (Firebase)
npm install @react-native-firebase/app @react-native-firebase/messaging

# Para navegación con notificaciones
npm install @react-navigation/native @react-navigation/stack
```

### **🔧 Step 2: Configure app.json/app.config.js**

```json
{
  "expo": {
    "name": "ADK Assist",
    "slug": "adk-assist",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ],
      "@react-native-firebase/app"
    ],
    "android": {
      "useNextNotificationsApi": true,
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

### **🔧 Step 3: Create PushNotificationService.js**

```javascript
// services/PushNotificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor(apiService) {
    this.apiService = apiService; // Your API service instance
  }

  /**
   * 🔍 CRITICAL: Auto-detect app type and get appropriate token
   */
  async getTokenInfo() {
    try {
      const appOwnership = Constants.appOwnership;
      const executionEnvironment = Constants.executionEnvironment;
      
      // Determine app type
      const isExpoGo = appOwnership === 'expo' || executionEnvironment === 'expo';
      const isStandalone = appOwnership === 'standalone';
      
      let token;
      let tokenType;
      
      if (isExpoGo) {
        // EXPO GO - Use Expo Push Token
        console.log('📱 Detected: Expo Go - Using Expo Push Service');
        tokenType = 'expo';
        
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                         Constants.manifest?.extra?.eas?.projectId;
        
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
        token = tokenData.data;
        
      } else if (isStandalone) {
        // APK STANDALONE - Try FCM first
        console.log('📱 Detected: Standalone APK - Attempting Firebase FCM');
        
        try {
          // Check if Firebase is available
          const messaging = require('@react-native-firebase/messaging').default;
          
          // Request permission
          const authStatus = await messaging().requestPermission();
          const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                         authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          
          if (enabled) {
            token = await messaging().getToken();
            tokenType = 'fcm';
            console.log('✅ FCM Token obtained successfully');
          } else {
            throw new Error('Firebase permission denied');
          }
          
        } catch (fcmError) {
          console.warn('⚠️ FCM not available, fallback to Expo token');
          tokenType = 'expo';
          token = (await Notifications.getExpoPushTokenAsync()).data;
        }
        
      } else {
        // Default fallback to Expo
        console.log('📱 Unknown app type, defaulting to Expo');
        tokenType = 'expo';
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }

      const tokenInfo = {
        token,
        tokenType,
        appOwnership: appOwnership || 'unknown',
        isStandalone: isStandalone || false,
        executionEnvironment: executionEnvironment || 'unknown',
        platform: Platform.OS,
        deviceType: Device.deviceType === Device.DeviceType.PHONE ? 'phone' : 'tablet',
        deviceName: Device.deviceName || `${Platform.OS} Device`,
      };

      console.log('🎯 Token Info:', {
        tokenType: tokenInfo.tokenType,
        platform: tokenInfo.platform,
        appOwnership: tokenInfo.appOwnership,
        tokenPreview: token.substring(0, 30) + '...'
      });

      return tokenInfo;

    } catch (error) {
      console.error('❌ Error getting token info:', error);
      throw error;
    }
  }

  /**
   * 📤 Register push token with backend
   */
  async registerForPushNotifications() {
    try {
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.error('❌ Push notification permissions denied');
        return null;
      }

      // Get token information
      const tokenInfo = await this.getTokenInfo();

      // Register with backend
      const response = await this.apiService.post('/tenant/register-push-token', {
        push_token: tokenInfo.token,
        token_type: tokenInfo.tokenType,
        platform: tokenInfo.platform,
        device_type: tokenInfo.deviceType,
        device_name: tokenInfo.deviceName,
        app_ownership: tokenInfo.appOwnership,
        is_standalone: tokenInfo.isStandalone,
        execution_environment: tokenInfo.executionEnvironment,
      });

      if (response.data.success) {
        console.log('✅ Push token registered successfully');
        console.log(`📱 Service: ${tokenInfo.tokenType.toUpperCase()}`);
        
        // Store locally for reference
        await AsyncStorage.setItem('pushTokenInfo', JSON.stringify(tokenInfo));
        
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

  /**
   * 🗑️ Remove push token
   */
  async removePushToken() {
    try {
      const storedInfo = await AsyncStorage.getItem('pushTokenInfo');
      if (!storedInfo) return;

      const tokenInfo = JSON.parse(storedInfo);
      
      await this.apiService.post('/tenant/remove-push-token', {
        push_token: tokenInfo.token,
      });

      await AsyncStorage.removeItem('pushTokenInfo');
      console.log('✅ Push token removed successfully');

    } catch (error) {
      console.error('❌ Error removing push token:', error);
    }
  }

  /**
   * 🔔 Setup notification listeners
   */
  setupNotificationListeners(navigation) {
    // Handle notifications when app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received in foreground:', notification);
      
      // You can show a custom in-app notification here
      // or update some state to show a badge, etc.
    });

    // Handle notification interactions (user taps notification)
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      this.handleNotificationNavigation(data, navigation);
    });

    return {
      foreground: foregroundSubscription,
      background: backgroundSubscription,
    };
  }

  /**
   * 🧭 Handle navigation based on notification data
   */
  handleNotificationNavigation(data, navigation) {
    try {
      console.log('🧭 Handling notification navigation:', data);

      if (data.type === 'ticket') {
        // Navigate to ticket details
        navigation.navigate('TicketDetails', { 
          ticketId: data.ticketId || data.entityId 
        });
      } else if (data.screen) {
        // Navigate to specific screen
        navigation.navigate(data.screen.replace('/', ''));
      } else {
        // Default navigation
        navigation.navigate('Home');
      }

    } catch (error) {
      console.error('❌ Error handling notification navigation:', error);
    }
  }

  /**
   * 🧪 Send test notification
   */
  async sendTestNotification() {
    try {
      const response = await this.apiService.post('/tenant/send-push-notification', {
        title: 'Test Notification 🧪',
        body: 'This is a test from your React Native app!',
        data: {
          type: 'test',
          screen: '/test',
          timestamp: Date.now().toString()
        }
      });

      if (response.data.success) {
        console.log('✅ Test notification sent successfully');
        console.log(`📊 Sent to ${response.data.sent_to_devices} device(s)`);
      } else {
        console.error('❌ Failed to send test notification:', response.data.message);
      }

      return response.data;

    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  }
}

export default PushNotificationService;
```

### **🔧 Step 4: Create usePushNotifications Hook**

```javascript
// hooks/usePushNotifications.js
import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import PushNotificationService from '../services/PushNotificationService';
import { apiService } from '../services/api'; // Your API service

export const usePushNotifications = () => {
  const navigation = useNavigation();
  const pushServiceRef = useRef(new PushNotificationService(apiService));
  const subscriptionsRef = useRef(null);

  useEffect(() => {
    const pushService = pushServiceRef.current;

    // Register for push notifications
    const registerPushNotifications = async () => {
      try {
        const tokenInfo = await pushService.registerForPushNotifications();
        
        if (tokenInfo) {
          console.log('🎉 Push notifications setup complete');
          console.log(`📱 Using: ${tokenInfo.tokenType.toUpperCase()}`);
        }
      } catch (error) {
        console.error('❌ Push notification setup failed:', error);
      }
    };

    // Setup listeners
    const setupListeners = () => {
      subscriptionsRef.current = pushService.setupNotificationListeners(navigation);
    };

    // Initialize
    registerPushNotifications();
    setupListeners();

    // Cleanup
    return () => {
      if (subscriptionsRef.current) {
        subscriptionsRef.current.foreground?.remove();
        subscriptionsRef.current.background?.remove();
      }
    };
  }, [navigation]);

  // Return service methods for manual use
  return {
    sendTestNotification: () => pushServiceRef.current.sendTestNotification(),
    removePushToken: () => pushServiceRef.current.removePushToken(),
  };
};
```

### **🔧 Step 5: Implement in App.js**

```javascript
// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { usePushNotifications } from './hooks/usePushNotifications';

// Your screens
import HomeScreen from './screens/HomeScreen';
import TicketDetailsScreen from './screens/TicketDetailsScreen';
import LoginScreen from './screens/LoginScreen';

const Stack = createStackNavigator();

export default function App() {
  // Initialize push notifications
  const { sendTestNotification } = usePushNotifications();

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TicketDetails" component={TicketDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### **🔧 Step 6: Add to Login Flow**

```javascript
// In your LoginScreen.js or authentication service
import { usePushNotifications } from '../hooks/usePushNotifications';

const LoginScreen = () => {
  const pushNotifications = usePushNotifications();

  const handleLogin = async (credentials) => {
    try {
      // Your existing login logic
      const response = await apiService.post('/auth/login', credentials);
      
      if (response.data.success) {
        // Store auth token
        await AsyncStorage.setItem('authToken', response.data.token);
        
        // Register push notifications after successful login
        // This is handled automatically by usePushNotifications hook
        
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    // Your login UI with test button
    <View style={styles.container}>
      {/* Your login form */}
      
      <Button 
        title="🧪 Test Push Notification"
        onPress={() => pushNotifications.sendTestNotification()}
      />
    </View>
  );
};
```

### **🔧 Step 7: Firebase Setup (for APK)**

1. **Download google-services.json** from Firebase Console
2. **Place in project root** next to package.json
3. **Add to .gitignore** (security)

---

## 🧪 **Testing Guide**

### **1. Expo Go Testing**
```bash
npx expo start
# Scan QR code with Expo Go app
# Should see: "📱 Detected: Expo Go - Using Expo Push Service"
```

### **2. APK Testing**
```bash
npx expo build:android
# or
eas build -p android
# Install APK on device
# Should see: "📱 Detected: Standalone APK - Attempting Firebase FCM"
```

### **3. Backend Testing**
```bash
# Check registered tokens
curl -H "Authorization: Bearer TOKEN" http://your-api.com/api/tenant/push-tokens

# Send test notification
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello!"}' \
  http://your-api.com/api/tenant/send-push-notification
```

---

## 📊 **Notification Flow**

```
📱 MOBILE APP STARTUP:
├── 🔍 Auto-detect: Expo Go vs APK
├── 🎯 Get appropriate token (Expo/FCM)
├── 📤 Register with backend
├── 💾 Store token info locally
└── 👂 Setup notification listeners

🔔 NOTIFICATION RECEIVED:
├── 📱 Backend sends to correct service
├── 📥 Mobile receives notification
├── 👆 User taps notification
├── 🧭 App navigates to correct screen
└── ✅ Action completed
```

---

## 🎯 **Key Features Implemented**

### ✅ **Backend (Completado)**
- Dual service support (Expo + FCM)
- Auto-detection and correction
- Comprehensive logging
- Fallback systems
- API endpoints
- Automatic notifications

### ✅ **Mobile (Para Implementar)**
- Auto-detection of app type
- Intelligent token management
- Navigation handling
- Permission management
- Test functionality
- Persistent storage

---

## 🚨 **Common Issues & Solutions**

### **Issue: "Push notifications not received"**
**Solution:** Check these logs:
```bash
# Backend logs
tail -f storage/logs/laravel.log | grep -i push

# Mobile logs
console.log in React Native debugger
```

### **Issue: "Wrong token type detected"**
**Solution:** Run the correction command:
```bash
php artisan push:fix-token-types
```

### **Issue: "Firebase not working in APK"**
**Solutions:**
1. Ensure google-services.json is in project root
2. Check Firebase project ID matches
3. Verify APK signing certificate in Firebase

---

## 📋 **Checklist for Mobile Team**

- [ ] Install all required dependencies
- [ ] Configure app.json with Firebase plugin
- [ ] Download and place google-services.json
- [ ] Implement PushNotificationService.js
- [ ] Create usePushNotifications hook
- [ ] Add to App.js navigation setup
- [ ] Integrate with login flow
- [ ] Test in Expo Go
- [ ] Test in APK standalone
- [ ] Verify notification navigation
- [ ] Test backend API endpoints

---

**🎉 ¡Con esta implementación tendrás notificaciones push universales que funcionan en cualquier tipo de build!**