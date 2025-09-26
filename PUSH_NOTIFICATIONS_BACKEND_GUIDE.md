# 📤 Backend Endpoints para Push Notifications

## 🎯 Endpoints Requeridos

Para que funcionen las push notifications automáticas desde cambios detectados en la app, necesitas implementar estos endpoints en tu backend:

### 1. Enviar Push Notification

**Endpoint:** `POST /tenant/send-push-notification`
**Autenticación:** Bearer Token requerido

#### Request Body:
```json
{
  "title": "string",
  "body": "string", 
  "data": {
    "type": "ticket|device|general",
    "screen": "/tickets|/devices|/",
    "entityId": "number|null",
    "timestamp": "2025-09-25T22:00:00.000Z"
  }
}
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Push notification sent successfully",
  "sent_to_devices": 2
}
```

#### Funcionalidad:
1. Recibe el request desde el frontend
2. Busca todos los dispositivos registrados del tenant
3. Envía la push notification a todos los dispositivos
4. Retorna confirmación

### 2. Registrar Token de Dispositivo

**Endpoint:** `POST /tenant/register-push-token`
**Autenticación:** Bearer Token requerido

#### Request Body:
```json
{
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "ios|android",
  "device_name": "iPhone 12 Pro",
  "device_type": "ios|android"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Push token registered successfully"
}
```

### 3. Remover Token de Dispositivo

**Endpoint:** `POST /tenant/remove-push-token`
**Autenticación:** Bearer Token requerido

#### Request Body:
```json
{
  "push_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

## 🔧 Implementación Backend Sugerida

### Base de Datos - Tabla `push_tokens`

```sql
CREATE TABLE push_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT UNSIGNED NOT NULL,
    push_token VARCHAR(255) NOT NULL UNIQUE,
    platform ENUM('ios', 'android') NOT NULL,
    device_name VARCHAR(255) NULL,
    device_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_push_token (push_token),
    INDEX idx_active (is_active),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

### Laravel Controller Ejemplo

```php
<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationController extends Controller
{
    /**
     * Registrar token de push notification
     */
    public function registerToken(Request $request)
    {
        $request->validate([
            'push_token' => 'required|string',
            'platform' => 'required|in:ios,android',
            'device_name' => 'nullable|string',
            'device_type' => 'required|string',
        ]);

        $tenant = $request->user()->tenant;
        
        PushToken::updateOrCreate(
            ['push_token' => $request->push_token],
            [
                'tenant_id' => $tenant->id,
                'platform' => $request->platform,
                'device_name' => $request->device_name,
                'device_type' => $request->device_type,
                'is_active' => true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Push token registered successfully'
        ]);
    }

    /**
     * Remover token de push notification
     */
    public function removeToken(Request $request)
    {
        $request->validate([
            'push_token' => 'required|string',
        ]);

        PushToken::where('push_token', $request->push_token)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Push token removed successfully'
        ]);
    }

    /**
     * Enviar push notification
     */
    public function sendPushNotification(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'body' => 'required|string',
            'data' => 'nullable|array',
        ]);

        $tenant = $request->user()->tenant;
        
        // Obtener todos los tokens activos del tenant
        $pushTokens = PushToken::where('tenant_id', $tenant->id)
                              ->where('is_active', true)
                              ->pluck('push_token')
                              ->toArray();

        if (empty($pushTokens)) {
            return response()->json([
                'success' => false,
                'message' => 'No active push tokens found for this tenant',
                'sent_to_devices' => 0
            ]);
        }

        // Preparar mensajes para Expo
        $messages = [];
        foreach ($pushTokens as $token) {
            $messages[] = [
                'to' => $token,
                'title' => $request->title,
                'body' => $request->body,
                'data' => $request->data ?? [],
                'sound' => 'default',
                'priority' => 'high',
            ];
        }

        // Enviar a Expo Push API
        try {
            $response = Http::post('https://exp.host/--/api/v2/push/send', $messages);
            
            if ($response->successful()) {
                Log::info('Push notifications sent successfully', [
                    'tenant_id' => $tenant->id,
                    'device_count' => count($pushTokens),
                    'title' => $request->title
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Push notification sent successfully',
                    'sent_to_devices' => count($pushTokens)
                ]);
            } else {
                Log::error('Failed to send push notifications', [
                    'response' => $response->body()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send push notifications'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Push notification error', [
                'error' => $e->getMessage(),
                'tenant_id' => $tenant->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Push notification service error'
            ], 500);
        }
    }
}
```

### Routes Ejemplo (Laravel)

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('tenant')->group(function () {
        Route::post('/register-push-token', [PushNotificationController::class, 'registerToken']);
        Route::post('/remove-push-token', [PushNotificationController::class, 'removeToken']);
        Route::post('/send-push-notification', [PushNotificationController::class, 'sendPushNotification']);
    });
});
```

## 🧪 Cómo Probar

1. **Inicia tu app** - Las push notifications se registran automáticamente
2. **Ve a Profile** - Encontrarás dos secciones de prueba:
   - "Push Notification Test" - Prueba directa de push notifications
   - "Test Push Notifications" - Simula cambios que envían push notifications automáticamente
3. **Prueba el cambio automático** - Presiona "Simular Cambio de Ticket"
4. **Revisa los logs** - Deberías ver:
   ```
   🧪 Testing ticket change notification with push...
   🔔 addNotifications called: [...]
   📤 Enviando push notification para cambio importante: [...]
   📤 Enviando push notification: [...]
   ✅ Push notification enviada correctamente
   ```

## 📱 Flujo Completo

1. **Usuario hace cambios** → useChangeNotifications detecta cambios
2. **Cambio es importante** → isImportantChange() retorna true
3. **Se envía POST a backend** → `/tenant/send-push-notification`
4. **Backend busca tokens** → De todos los dispositivos del tenant
5. **Backend envía a Expo** → Push API de Expo procesa
6. **Dispositivos reciben** → Notificación aparece incluso con app cerrada

¡Ya tienes todo listo en el frontend! Solo necesitas implementar estos endpoints en tu backend y las push notifications funcionarán automáticamente. 🎉