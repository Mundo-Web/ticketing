# 📱 GUÍA ESPECÍFICA: Configurar Push Notifications en tu App React Native

## 🚨 **PROBLEMA ACTUAL:**
Tu APK no está registrando tokens FCM. La app móvil no está llamando al endpoint de registro.

---

## 📋 **CHECKLIST PARA TU APP:**

### **1. ¿Tu app está llamando a register-push-token?**
Busca en tu código móvil si existe algo como:
```javascript
fetch('/api/tenant/register-push-token', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    push_token: tokenValue,
    token_type: 'expo' // o 'fcm'
    // ... otros campos
  })
})
```

### **2. ¿Tienes configurado Firebase en tu APK?**

#### **Archivos necesarios:**
- ✅ `google-services.json` en la raíz del proyecto
- ✅ Firebase configurado en `app.json` o `app.config.js`

#### **Dependencias necesarias:**
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

#### **app.json debe incluir:**
```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app"
    ],
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### **3. ¿Tu código detecta correctamente Expo vs APK?**

Tu app necesita código como este:
```javascript
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

const getTokenInfo = async () => {
  const appOwnership = Constants.appOwnership;
  
  if (appOwnership === 'expo') {
    // EXPO GO - Usar Expo token
    const token = await Notifications.getExpoPushTokenAsync();
    return {
      token: token.data,
      token_type: 'expo'
    };
  } else {
    // APK - Usar FCM token
    const messaging = require('@react-native-firebase/messaging').default;
    const fcmToken = await messaging().getToken();
    return {
      token: fcmToken,
      token_type: 'fcm'
    };
  }
};
```

---

## 🔧 **PASOS PARA ARREGLAR TU APP:**

### **Paso 1: Verificar estructura de archivos**
En tu carpeta `C:\xampp\htdocs\projects\adk_app_mobile` debe haber:
```
adk_app_mobile/
├── google-services.json ← CRÍTICO para FCM
├── app.json
├── package.json
└── src/
    ├── services/
    │   └── PushNotificationService.js ← CREAR ESTO
    └── ...
```

### **Paso 2: Implementar PushNotificationService.js**
Crear el archivo en `src/services/PushNotificationService.js` con el código del README que creé anteriormente.

### **Paso 3: Llamar al servicio en login**
En tu pantalla de login o App.js, agregar:
```javascript
import PushNotificationService from './services/PushNotificationService';

// Después del login exitoso:
const pushService = new PushNotificationService(apiService);
await pushService.registerForPushNotifications();
```

### **Paso 4: Verificar logs**
En React Native debugger o console:
```javascript
console.log('🔍 App ownership:', Constants.appOwnership);
console.log('🔍 Execution environment:', Constants.executionEnvironment);
```

- **Expo Go** debería mostrar: `appOwnership: 'expo'`
- **APK** debería mostrar: `appOwnership: 'standalone'`

---

## 🧪 **TESTING RÁPIDO:**

### **1. Expo Go:**
```bash
npx expo start
# Escanear QR con Expo Go
# Hacer login en la app
# Verificar console: "🔍 App ownership: expo"
# Debe registrar token automáticamente
```

### **2. APK:**
```bash
# Instalar APK en dispositivo
# Hacer login en la app
# Verificar logs: "🔍 App ownership: standalone"
# Debe intentar obtener FCM token
```

### **3. Backend verification:**
```bash
# En Laravel
php artisan push:debug
# Debe mostrar tokens registrados
```

---

## ❌ **SI SIGUES SIN VER TOKENS:**

### **Problema: App no está registrando**
1. 📱 Revisar que la app llame a `registerForPushNotifications()` después del login
2. 🔗 Verificar que la URL de la API sea correcta
3. 🔑 Confirmar que el token de autenticación sea válido

### **Problema: Firebase no configurado**
1. 🔥 Descargar `google-services.json` desde Firebase Console
2. 📂 Colocarlo en la raíz del proyecto
3. ⚙️ Reinstalar/rebuild la app

### **Problema: Permisos**
```javascript
// En tu app, verificar permisos:
const { status } = await Notifications.getPermissionsAsync();
console.log('📱 Permission status:', status);

if (status !== 'granted') {
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  console.log('📱 New permission status:', newStatus);
}
```

---

## 🎯 **CONCLUSIÓN:**

**El backend está perfecto.** El problema está en que **tu app móvil no está registrando tokens.** 

Necesitas:
1. ✅ Implementar `PushNotificationService.js` 
2. ✅ Configurar Firebase correctamente
3. ✅ Llamar al registro después del login
4. ✅ Verificar que los tokens lleguen al backend

**Una vez que tu app registre tokens correctamente, las notificaciones funcionarán automáticamente tanto en Expo Go como en APK.**