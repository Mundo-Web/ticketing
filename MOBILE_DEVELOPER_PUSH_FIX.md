# 🚨 PROBLEMA CRÍTICO: Push Notifications APK no funcionan

## 📋 **PROBLEMA IDENTIFICADO:**

**❌ ACTUAL:** La app siempre genera tokens de Expo (`ExponentPushToken[...]`), incluso en APK standalone
**✅ NECESARIO:** La app debe generar tokens FCM para APK y tokens Expo para Expo Go

---

## 🔍 **DIAGNÓSTICO REALIZADO:**

### **Backend Status:** ✅ PERFECTO
- Sistema dual Expo + FCM implementado
- Firebase configurado correctamente  
- Auto-detección de tipos de token funcionando
- Logs detallados implementados

### **Mobile App Status:** ❌ PROBLEMA
- App registra 7 tokens, pero TODOS son tipo `expo`
- Incluso APK standalone envía `ExponentPushToken[...]`
- No genera tokens FCM cuando debería

### **Resultado:**
```bash
# Tokens actuales en base de datos:
🎯 Token ID: 5 - Tipo: expo - Standalone: YES ❌ MALO
🎯 Token ID: 6 - Tipo: expo - Standalone: YES ❌ MALO

# Lo que necesitamos:
🎯 Token ID: 8 - Tipo: fcm - Standalone: YES ✅ BUENO
```

---

## 🔧 **SOLUCIÓN REQUERIDA:**

### **CAMBIO CRÍTICO:** Modificar detección de tokens en la app móvil

---

## 📱 **IMPLEMENTACIÓN PASO A PASO:**

### **Paso 1: Instalar dependencias Firebase**

```bash
# En el proyecto móvil
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### **Paso 2: Configurar app.json**

```json
{
  "expo": {
    "name": "ADK Assist",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ],
      "@react-native-firebase/app"
    ],
    "android": {
      "useNextNotificationsApi": true,
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "android.permission.WAKE_LOCK"
      ]
    }
  }
}
```

### **Paso 3: Asegurar archivo google-services.json**

```
adk_app_mobile/
├── google-services.json ← DEBE EXISTIR (descargar de Firebase Console)
├── app.json
├── package.json
└── ...
```

### **Paso 4: REEMPLAZAR el código de registro de tokens**

**🔍 Buscar en tu app el archivo donde registras push tokens** (probablemente en `src/services/` o `src/utils/` o similar)

**❌ Código INCORRECTO actual:**
```javascript
// Esto es lo que tienes ahora (MALO)
const registerPushToken = async () => {
    const token = await Notifications.getExpoPushTokenAsync();
    // Siempre envía ExponentPushToken incluso en APK
    
    fetch('/api/tenant/register-push-token', {
        // ... siempre token_type: 'expo'
    });
};
```

**✅ Código CORRECTO nuevo:**
```javascript
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// CONFIGURAR HANDLER DE NOTIFICACIONES
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const registerPushToken = async () => {
    try {
        if (!Device.isDevice) {
            console.warn('⚠️ Push notifications only work on physical devices');
            return;
        }

        // SOLICITAR PERMISOS
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.error('❌ Push notification permissions denied');
            return;
        }

        // DETECCIÓN CRÍTICA: Expo Go vs APK
        const appOwnership = Constants.appOwnership;
        const executionEnvironment = Constants.executionEnvironment;
        
        console.log('🔍 App ownership:', appOwnership);
        console.log('🔍 Execution environment:', executionEnvironment);
        
        let tokenData;
        
        if (appOwnership === 'standalone') {
            // APK STANDALONE - USAR FCM
            console.log('📱 Detected APK Standalone - Using FCM');
            
            try {
                // Importar Firebase Messaging
                const messaging = require('@react-native-firebase/messaging').default;
                
                // Solicitar permisos FCM
                const authStatus = await messaging().requestPermission();
                const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
                
                if (!enabled) {
                    throw new Error('Firebase permission denied');
                }
                
                // OBTENER TOKEN FCM
                const fcmToken = await messaging().getToken();
                
                if (!fcmToken) {
                    throw new Error('Failed to get FCM token');
                }
                
                tokenData = {
                    token: fcmToken,
                    token_type: 'fcm', // ← CRÍTICO: FCM para APK
                    app_ownership: 'standalone',
                    is_standalone: true,
                    execution_environment: executionEnvironment || 'standalone'
                };
                
                console.log('✅ FCM Token obtained:', fcmToken.substring(0, 30) + '...');
                
            } catch (fcmError) {
                console.warn('⚠️ FCM failed, using Expo fallback:', fcmError);
                
                // FALLBACK: Si FCM falla, usar Expo
                const expoToken = await Notifications.getExpoPushTokenAsync();
                tokenData = {
                    token: expoToken.data,
                    token_type: 'expo',
                    app_ownership: 'standalone',
                    is_standalone: true,
                    execution_environment: executionEnvironment || 'standalone'
                };
            }
            
        } else {
            // EXPO GO - USAR EXPO PUSH SERVICE
            console.log('📱 Detected Expo Go - Using Expo Push Service');
            
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            const expoToken = await Notifications.getExpoPushTokenAsync({
                projectId: projectId,
            });
            
            tokenData = {
                token: expoToken.data,
                token_type: 'expo', // ← Expo para Expo Go
                app_ownership: 'expo',
                is_standalone: false,
                execution_environment: executionEnvironment || 'expo'
            };
            
            console.log('✅ Expo Token obtained:', expoToken.data.substring(0, 30) + '...');
        }

        // REGISTRAR CON BACKEND
        const deviceName = Device.deviceName || `${Device.osName} Device`;
        
        const requestBody = {
            push_token: tokenData.token,
            token_type: tokenData.token_type, // ← CRÍTICO: Tipo correcto
            platform: Device.osName?.toLowerCase() || 'android',
            device_type: Device.deviceType === Device.DeviceType.PHONE ? 'phone' : 'tablet',
            device_name: deviceName,
            app_ownership: tokenData.app_ownership,
            is_standalone: tokenData.is_standalone,
            execution_environment: tokenData.execution_environment
        };

        console.log('📤 Registering token:', {
            token_type: requestBody.token_type,
            device_name: requestBody.device_name,
            is_standalone: requestBody.is_standalone,
            token_preview: requestBody.push_token.substring(0, 30) + '...'
        });

        const response = await fetch('https://adkassist.com/api/tenant/register-push-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${yourAuthToken}`, // ← Usar tu token de auth
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('🎉 Push token registered successfully!');
            console.log(`📱 Service: ${tokenData.token_type.toUpperCase()}`);
            
            // Guardar localmente para referencia
            await AsyncStorage.setItem('pushTokenInfo', JSON.stringify(tokenData));
            
        } else {
            console.error('❌ Failed to register push token:', result.message);
        }

        return tokenData;

    } catch (error) {
        console.error('❌ Error in registerPushToken:', error);
        throw error;
    }
};

// EXPORTAR FUNCIÓN
export { registerPushToken };
```

### **Paso 5: Llamar función en login**

```javascript
// En tu archivo de login o App.js
import { registerPushToken } from './path/to/your/pushTokenService';

const handleLogin = async (credentials) => {
    try {
        // Tu lógica de login existente
        const loginResponse = await login(credentials);
        
        if (loginResponse.success) {
            // REGISTRAR PUSH TOKEN DESPUÉS DEL LOGIN
            await registerPushToken();
            
            // Continuar con navegación, etc.
            navigation.navigate('Home');
        }
    } catch (error) {
        console.error('Login error:', error);
    }
};
```

### **Paso 6: Configurar listeners (opcional pero recomendado)**

```javascript
// En App.js o archivo principal
import * as Notifications from 'expo-notifications';

useEffect(() => {
    // Listener para notificaciones en foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('🔔 Notification received in foreground:', notification);
        // Manejar notificación personalizada si es necesario
    });

    // Listener para taps en notificaciones
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Notification tapped:', response);
        
        const data = response.notification.request.content.data;
        
        // Navegar según el contenido de la notificación
        if (data.type === 'ticket' && data.screen) {
            navigation.navigate('TicketDetails', { ticketId: data.ticketId });
        }
    });

    return () => {
        foregroundSubscription.remove();
        backgroundSubscription.remove();
    };
}, []);
```

---

## 🧪 **TESTING Y VALIDACIÓN:**

### **Paso 1: Build y test**
```bash
# Rebuild APK
eas build -p android
# o
npx expo build:android
```

### **Paso 2: Instalar y probar**
1. **Instalar APK** en dispositivo físico
2. **Hacer login** en la app
3. **Verificar logs** en React Native debugger

### **Paso 3: Verificar en backend**
```bash
# En servidor
php artisan push:debug
```

**DEBES VER ALGO ASÍ:**
```
🎯 Token ID: 8
   Tenant: 288
   Tipo: fcm ← ¡AHORA SERÁ FCM!
   Platform: android
   Device: Galaxy A15
   Standalone: YES
   Token: fGzKj5TvSU... ← ¡NO será ExponentPushToken!
```

### **Paso 4: Probar notificación**
1. **Actualizar estado de ticket** desde web
2. **Verificar que llegue push** a APK

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN:**

- [ ] ✅ Instalar dependencias Firebase (`@react-native-firebase/app`, `@react-native-firebase/messaging`)
- [ ] ✅ Configurar `app.json` con plugin Firebase
- [ ] ✅ Verificar que existe `google-services.json` en raíz del proyecto
- [ ] ✅ Reemplazar función de registro de tokens con código nuevo
- [ ] ✅ Añadir detección de `Constants.appOwnership`
- [ ] ✅ Implementar lógica FCM para APK standalone
- [ ] ✅ Mantener lógica Expo para Expo Go
- [ ] ✅ Llamar función en login exitoso
- [ ] ✅ Configurar listeners de notificaciones
- [ ] ✅ Rebuild APK con cambios
- [ ] ✅ Probar en dispositivo físico
- [ ] ✅ Verificar logs con `php artisan push:debug`
- [ ] ✅ Confirmar que aparezcan tokens tipo `fcm`
- [ ] ✅ Probar notificaciones en producción

---

## 🚨 **PUNTOS CRÍTICOS:**

### **1. Detección correcta:**
```javascript
if (appOwnership === 'standalone') {
    // APK → FCM
} else {
    // Expo Go → Expo
}
```

### **2. Token type correcto:**
```javascript
// Para APK
token_type: 'fcm'

// Para Expo Go  
token_type: 'expo'
```

### **3. Error handling:**
```javascript
try {
    const fcmToken = await messaging().getToken();
} catch (fcmError) {
    // Fallback a Expo si FCM falla
}
```

---

## 🎯 **RESULTADO ESPERADO:**

**ANTES (Actual):**
```
📱 Tokens Expo: 7
🔥 Tokens FCM: 0  ← PROBLEMA
```

**DESPUÉS (Meta):**
```  
📱 Tokens Expo: 4 (de Expo Go)
🔥 Tokens FCM: 3 (de APK standalone)  ← SOLUCIONADO
```

---

## ❓ **TROUBLESHOOTING:**

### **Si sigue generando tokens Expo en APK:**
1. Verificar que `Constants.appOwnership === 'standalone'` en APK
2. Comprobar que Firebase está correctamente configurado
3. Revisar logs de React Native debugger

### **Si FCM da error:**
1. Verificar que `google-services.json` está en la raíz
2. Confirmar que la app está firmada con el certificado correcto
3. Verificar permisos de notificaciones en el dispositivo

### **Si no llegan notificaciones:**
1. Confirmar que aparecen tokens FCM en `php artisan push:debug`
2. Verificar logs del backend con acciones de ticket
3. Comprobar que Firebase credentials están configurados

---

**🎯 Con esta implementación, el APK generará tokens FCM reales y las notificaciones push funcionarán correctamente tanto en Expo Go como en APK standalone.**