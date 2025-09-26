# 🚀 Implementación CORRECTA de Push Notifications

## ❌ **Problema Actual**

Las push notifications NO aparecen en tu móvil porque:

1. **useChangeNotifications** solo funciona **dentro de la app**
2. Cuando detecta cambios, **ya estás en la app**
3. Las push notifications **no se muestran** cuando la app está abierta
4. **El frontend NO debe enviar push notifications** - eso lo hace el backend

## ✅ **Solución Correcta**

Las push notifications deben enviarse desde tu **BACKEND** cuando ocurran eventos importantes, no desde el frontend.

## 🔧 **Implementación en tu Backend**

### 1. Eventos que Deben Enviar Push Notifications

```php
// En tu backend Laravel - cuando ocurran estos eventos:

// 1. NUEVO TICKET ASIGNADO
public function assignTicket($ticketId, $technicalId) {
    // Lógica para asignar ticket...
    
    // ENVIAR PUSH NOTIFICATION
    $this->sendPushToTenant($ticket->tenant_id, [
        'title' => '🎫 Nuevo Ticket Asignado',
        'body' => "Se te asignó: {$ticket->title}",
        'data' => [
            'type' => 'ticket',
            'screen' => '/tickets',
            'ticketId' => $ticket->id
        ]
    ]);
}

// 2. CAMBIO DE ESTADO DEL TICKET
public function updateTicketStatus($ticketId, $newStatus) {
    // Actualizar estado...
    
    // ENVIAR PUSH NOTIFICATION
    $this->sendPushToTenant($ticket->tenant_id, [
        'title' => '📋 Ticket Actualizado',
        'body' => "Tu ticket #{$ticket->id} cambió a: {$newStatus}",
        'data' => [
            'type' => 'ticket',
            'screen' => '/tickets',
            'ticketId' => $ticket->id
        ]
    ]);
}

// 3. RESPUESTA DEL TÉCNICO
public function addTechnicalResponse($ticketId, $response) {
    // Agregar respuesta...
    
    // ENVIAR PUSH NOTIFICATION
    $this->sendPushToTenant($ticket->tenant_id, [
        'title' => '💬 Nueva Respuesta',
        'body' => "El técnico respondió tu ticket #{$ticket->id}",
        'data' => [
            'type' => 'ticket',
            'screen' => '/tickets',
            'ticketId' => $ticket->id
        ]
    ]);
}
```

### 2. Función para Enviar Push Notifications

```php
<?php

class PushNotificationService 
{
    public function sendPushToTenant($tenantId, $message) 
    {
        // Obtener tokens del tenant
        $tokens = PushToken::where('tenant_id', $tenantId)
                          ->where('is_active', true)
                          ->pluck('push_token')
                          ->toArray();
                          
        if (empty($tokens)) {
            \Log::info("No push tokens for tenant: {$tenantId}");
            return;
        }

        // Preparar mensajes para Expo
        $messages = [];
        foreach ($tokens as $token) {
            $messages[] = [
                'to' => $token,
                'title' => $message['title'],
                'body' => $message['body'],
                'data' => $message['data'] ?? [],
                'sound' => 'default',
                'priority' => 'high',
                'channelId' => 'default',
            ];
        }

        // Enviar a Expo Push API
        try {
            $response = Http::post('https://exp.host/--/api/v2/push/send', $messages);
            
            if ($response->successful()) {
                \Log::info("Push sent successfully to {$tenantId}", [
                    'device_count' => count($tokens),
                    'title' => $message['title']
                ]);
            } else {
                \Log::error('Expo Push API error', $response->json());
            }
        } catch (\Exception $e) {
            \Log::error('Push notification failed', [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage()
            ]);
        }
    }
}
```

### 3. Integrar en tus Controladores Existentes

```php
// En tu TicketController.php
use App\Services\PushNotificationService;

class TicketController extends Controller 
{
    protected $pushService;
    
    public function __construct(PushNotificationService $pushService) {
        $this->pushService = $pushService;
    }
    
    public function store(Request $request) 
    {
        // Crear ticket...
        $ticket = Ticket::create($data);
        
        // ENVIAR PUSH NOTIFICATION AL TENANT
        $this->pushService->sendPushToTenant($ticket->tenant_id, [
            'title' => '✅ Ticket Creado',
            'body' => "Tu ticket #{$ticket->id} fue creado exitosamente",
            'data' => [
                'type' => 'ticket',
                'screen' => '/tickets',
                'ticketId' => $ticket->id
            ]
        ]);
        
        return response()->json($ticket);
    }
    
    public function assignTechnical(Request $request, $ticketId) 
    {
        // Asignar técnico...
        
        // ENVIAR PUSH NOTIFICATION
        $this->pushService->sendPushToTenant($ticket->tenant_id, [
            'title' => '👨‍🔧 Técnico Asignado',
            'body' => "Se asignó {$technical->name} a tu ticket #{$ticket->id}",
            'data' => [
                'type' => 'ticket',
                'screen' => '/tickets',
                'ticketId' => $ticket->id
            ]
        ]);
    }
}
```

## 🧪 **Cómo Probar**

### Paso 1: Registra tu Token
1. Abre la app
2. Ve a Profile
3. Usa "Push Notification Test" → "Show Current Token"
4. **Copia ese token** y guárdalo en tu base de datos

### Paso 2: Desde tu Backend (Postman/Insomnia)
```bash
# Envía esta petición desde Postman directamente a Expo
POST https://exp.host/--/api/v2/push/send
Content-Type: application/json

[{
  "to": "TU_TOKEN_REAL_AQUI",
  "title": "🎫 Test desde Backend",
  "body": "Esta es una push notification real desde tu servidor",
  "data": {
    "type": "ticket",
    "screen": "/tickets",
    "ticketId": 123
  },
  "sound": "default",
  "priority": "high"
}]
```

### Paso 3: Prueba Real
1. **Envía la petición** desde Postman
2. **Cierra la app completamente** (no solo minimize)
3. **Espera 5-10 segundos**
4. **¡Debería aparecer la notificación!**

## 🎯 **Puntos Clave**

- ✅ **Backend envía push** cuando ocurren eventos importantes
- ✅ **Funciona con app cerrada** (es el punto principal)
- ✅ **Usuario puede estar en cualquier lugar** y recibe la notificación
- ❌ **Frontend NO envía push** - solo detecta cambios para UI
- ❌ **No funciona en simuladores** - solo dispositivos reales

## 📋 **Lista de Eventos para Push Notifications**

1. **Tickets:**
   - ✅ Nuevo ticket creado
   - ✅ Ticket asignado a técnico
   - ✅ Cambio de estado (En Progreso, Resuelto, etc.)
   - ✅ Nueva respuesta del técnico
   - ✅ Ticket cerrado

2. **Citas/Appointments:**
   - ✅ Nueva cita programada
   - ✅ Cambio de horario
   - ✅ Recordatorio de cita (30 min antes)
   - ✅ Técnico en camino

3. **Dispositivos:**
   - ✅ Nuevo dispositivo registrado
   - ✅ Problema detectado en dispositivo

¡Implementa esto en tu backend y las push notifications funcionarán perfectamente! 🚀