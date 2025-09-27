# 📱 Push Notifications Backend Implementation - Laravel

## 🎯 **Problema Identificado**
- **Expo Go**: Push notifications funcionan ✅ (usando Expo Push Service)
- **APK Standalone**: Push notifications NO funcionan ❌ (requiere Firebase Cloud Messaging)

**La app móvil ahora envía información del tipo de token para que Laravel sepa qué servicio usar.**

---

## 🔧 **Cambios Requeridos en Laravel**

### 1. **Actualizar Migration de Tokens**

Agregar columnas para identificar el tipo de token:

```php
// En tu migration de push_tokens
Schema::table('push_tokens', function (Blueprint $table) {
    $table->string('token_type')->default('expo'); // 'expo' o 'fcm'
    $table->string('app_ownership')->nullable(); // 'expo' o 'standalone'
    $table->boolean('is_standalone')->default(false);
    $table->string('execution_environment')->nullable();
});
```

### 2. **Actualizar Endpoint de Registro de Tokens**

**Endpoint:** `POST /api/tenant/register-push-token`

```php
// En tu Controller de Push Notifications
public function registerPushToken(Request $request)
{
    $validated = $request->validate([
        'push_token' => 'required|string',
        'platform' => 'required|string|in:ios,android',
        'device_name' => 'required|string',
        'device_type' => 'required|string',
        // NUEVOS CAMPOS CRÍTICOS
        'token_type' => 'required|string|in:expo,fcm', // IMPORTANTE
        'app_ownership' => 'nullable|string',
        'is_standalone' => 'boolean',
        'execution_environment' => 'nullable|string',
    ]);

    $user = auth()->user();
    
    // Buscar o crear token
    $pushToken = PushToken::updateOrCreate(
        [
            'tenant_id' => $user->id,
            'push_token' => $validated['push_token'],
        ],
        [
            'platform' => $validated['platform'],
            'device_name' => $validated['device_name'],
            'device_type' => $validated['device_type'],
            // GUARDAR INFORMACIÓN DEL TIPO
            'token_type' => $validated['token_type'], // 'fcm' o 'expo'
            'app_ownership' => $validated['app_ownership'] ?? null,
            'is_standalone' => $validated['is_standalone'] ?? false,
            'execution_environment' => $validated['execution_environment'] ?? null,
            'updated_at' => now(),
        ]
    );

    \Log::info('Push token registered', [
        'tenant_id' => $user->id,
        'token_type' => $validated['token_type'],
        'is_standalone' => $validated['is_standalone'],
        'platform' => $validated['platform'],
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Push token registered successfully',
        'token_type' => $validated['token_type'],
    ]);
}
```

### 3. **Actualizar Endpoint de Envío de Notificaciones**

**Endpoint:** `POST /api/tenant/send-push-notification`

```php
public function sendPushNotification(Request $request)
{
    $validated = $request->validate([
        'title' => 'required|string',
        'body' => 'required|string',
        'data' => 'array',
        // NUEVOS CAMPOS PARA TESTING
        'token_type' => 'nullable|string|in:expo,fcm',
        'push_token' => 'nullable|string',
        'is_standalone' => 'nullable|boolean',
    ]);

    $user = auth()->user();
    
    // Si se proporciona un token específico (para testing)
    if (!empty($validated['push_token']) && !empty($validated['token_type'])) {
        return $this->sendSingleNotification(
            $validated['push_token'],
            $validated['token_type'],
            $validated['title'],
            $validated['body'],
            $validated['data'] ?? []
        );
    }

    // Envío masivo a todos los tokens del usuario
    $pushTokens = PushToken::where('tenant_id', $user->id)->get();
    
    $results = [];
    foreach ($pushTokens as $tokenRecord) {
        $result = $this->sendSingleNotification(
            $tokenRecord->push_token,
            $tokenRecord->token_type, // USAR EL TIPO GUARDADO
            $validated['title'],
            $validated['body'],
            $validated['data'] ?? []
        );
        $results[] = $result;
    }

    return response()->json([
        'success' => true,
        'message' => 'Notifications sent',
        'results' => $results,
    ]);
}

private function sendSingleNotification($token, $tokenType, $title, $body, $data)
{
    \Log::info('Sending push notification', [
        'token_type' => $tokenType,
        'token' => substr($token, 0, 20) . '...',
        'title' => $title,
    ]);

    try {
        if ($tokenType === 'fcm') {
            // ENVIAR A FIREBASE CLOUD MESSAGING
            return $this->sendToFirebase($token, $title, $body, $data);
        } else {
            // ENVIAR A EXPO PUSH SERVICE (como antes)
            return $this->sendToExpo($token, $title, $body, $data);
        }
    } catch (\Exception $e) {
        \Log::error('Error sending push notification', [
            'token_type' => $tokenType,
            'error' => $e->getMessage(),
        ]);
        
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'token_type' => $tokenType,
        ];
    }
}
```

### 4. **Implementar Firebase Cloud Messaging**

Instalar la librería de Firebase Admin:

```bash
composer require kreait/firebase-php
```

Agregar al `.env`:
```env
FIREBASE_CREDENTIALS=path/to/your/firebase-credentials.json
FIREBASE_PROJECT_ID=adkassist-255ec
```

Implementar el método FCM:

```php
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;

private function sendToFirebase($token, $title, $body, $data)
{
    try {
        // Inicializar Firebase
        $factory = (new Factory)
            ->withServiceAccount(config('services.firebase.credentials'))
            ->withProjectId(config('services.firebase.project_id'));
            
        $messaging = $factory->createMessaging();

        // Crear mensaje
        $message = CloudMessage::withTarget('token', $token)
            ->withNotification([
                'title' => $title,
                'body' => $body,
            ])
            ->withData($data);

        // Enviar
        $result = $messaging->send($message);
        
        \Log::info('FCM notification sent successfully', [
            'token' => substr($token, 0, 20) . '...',
            'result' => $result,
        ]);

        return [
            'success' => true,
            'service' => 'Firebase Cloud Messaging',
            'token_type' => 'fcm',
        ];
        
    } catch (\Exception $e) {
        \Log::error('FCM send error', [
            'error' => $e->getMessage(),
            'token' => substr($token, 0, 20) . '...',
        ]);
        
        throw $e;
    }
}

private function sendToExpo($token, $title, $body, $data)
{
    // TU CÓDIGO EXISTENTE DE EXPO PUSH SERVICE
    // (mantener como está)
    
    try {
        $response = Http::post('https://exp.host/--/api/v2/push/send', [
            'to' => $token,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);

        \Log::info('Expo notification sent successfully', [
            'token' => substr($token, 0, 20) . '...',
            'response' => $response->json(),
        ]);

        return [
            'success' => true,
            'service' => 'Expo Push Service',
            'token_type' => 'expo',
        ];
        
    } catch (\Exception $e) {
        \Log::error('Expo send error', [
            'error' => $e->getMessage(),
            'token' => substr($token, 0, 20) . '...',
        ]);
        
        throw $e;
    }
}
```

### 5. **Configurar Firebase Credentials**

En `config/services.php`:

```php
'firebase' => [
    'credentials' => env('FIREBASE_CREDENTIALS'),
    'project_id' => env('FIREBASE_PROJECT_ID', 'adkassist-255ec'),
],
```

---

## 🎯 **Flujo de Funcionamiento**

### **Para Expo Go:**
1. App móvil envía `token_type: 'expo'`
2. Laravel guarda en BD con `token_type = 'expo'`
3. Al enviar notificación → usa **Expo Push Service** ✅

### **Para APK Standalone:**
1. App móvil envía `token_type: 'fcm'`
2. Laravel guarda en BD con `token_type = 'fcm'`
3. Al enviar notificación → usa **Firebase Cloud Messaging** ✅

---

## 📋 **Archivos Firebase Requeridos**

1. **Descargar `firebase-adminsdk-xxxxx.json`** desde Firebase Console
2. **Colocar en `storage/app/firebase/`**
3. **Actualizar `.env`:**
   ```env
   FIREBASE_CREDENTIALS=storage/app/firebase/firebase-adminsdk-xxxxx.json
   FIREBASE_PROJECT_ID=adkassist-255ec
   ```

---

## 🧪 **Testing**

Una vez implementado, la app móvil debería:

1. **En Expo Go** → Enviar a Expo Push Service (como siempre)
2. **En APK** → Enviar a Firebase Cloud Messaging (NUEVO)

---

## 📝 **Logs para Debugging**

Agregar en `config/logging.php`:

```php
'push_notifications' => [
    'driver' => 'single',
    'path' => storage_path('logs/push-notifications.log'),
    'level' => 'info',
],
```

**Los logs mostrarán:**
- `token_type`: 'fcm' o 'expo'  
- `service`: 'Firebase Cloud Messaging' o 'Expo Push Service'
- Resultado del envío

---

## ✅ **Checklist de Implementación**

- [ ] Agregar columnas a la tabla `push_tokens`
- [ ] Instalar `kreait/firebase-php`
- [ ] Descargar Firebase credentials JSON
- [ ] Configurar Firebase en `config/services.php`
- [ ] Actualizar endpoint `register-push-token`
- [ ] Actualizar endpoint `send-push-notification`
- [ ] Implementar método `sendToFirebase()`
- [ ] Testing con APK y Expo Go

---

**¡Con esta implementación las push notifications funcionarán tanto en Expo Go como en APK standalone!** 🚀