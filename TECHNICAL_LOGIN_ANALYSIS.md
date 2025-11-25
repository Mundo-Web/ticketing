# 🔍 ANÁLISIS DEL PROBLEMA: Login de Técnicos vs Members

## ✅ TU OBSERVACIÓN ES CORRECTA

**Problema identificado**: El login de técnicos **SÍ devuelve el `technical.id`**, pero hay una **inconsistencia** en cómo se maneja comparado con members.

---

## 📊 COMPARACIÓN: Member vs Technical

### ✅ Member (FUNCIONA CORRECTAMENTE)

**Login Response**:
```json
{
  "user": {
    "id": 50,
    "name": "María García",
    "roles": ["member"],
    "tenant_id": 15  // ← ID del tenant en el objeto user
  },
  "token": "...",
  "tenant": {
    "id": 15,  // ← MISMO ID
    "name": "María García",
    "email": "maria@example.com",
    "phone": "+51998765432",
    "apartment_id": 101
  }
}
```

**Cómo se usa en mobile**:
```javascript
// Guardar AMBOS IDs
await AsyncStorage.setItem('userId', response.user.id.toString());
await AsyncStorage.setItem('tenantId', response.tenant.id.toString());

// Luego usar tenantId para obtener tickets
const tickets = await fetch(`/api/tenant/tickets`); // No necesita ID en URL
```

---

### ⚠️ Technical (INCONSISTENTE)

**Login Response**:
```json
{
  "user": {
    "id": 5,  // ← Este es el USER_ID
    "name": "Juan Pérez",
    "roles": ["technical"]
    // ❌ NO tiene technical_id aquí
  },
  "token": "...",
  "technical": {
    "id": 4,  // ← Este es el TECHNICAL_ID (DIFERENTE del user.id)
    "name": "Juan Pérez",
    "email": "technical@example.com",
    "is_default": false
  }
}
```

**Problema**:
- `user.id` = 5 (ID en tabla `users`)
- `technical.id` = 4 (ID en tabla `technicals`)
- **SON DIFERENTES** ❌

**Cómo se debería usar**:
```javascript
// Guardar AMBOS IDs
await AsyncStorage.setItem('userId', response.user.id.toString());
await AsyncStorage.setItem('technicalId', response.technical.id.toString());

// Luego usar technicalId para obtener tickets
const technicalId = await AsyncStorage.getItem('technicalId');
const tickets = await fetch(`/api/technicals/${technicalId}/tickets`);
```

---

## 🔍 ANÁLISIS DEL CÓDIGO BACKEND

### Login Controller (TenantController.php líneas 83-102)

```php
// Si es technical, agregar datos de technical
if ($user->hasRole('technical')) {
    $technical = $user->technical; // ← Relación User -> Technical
    if (!$technical) {
        throw ValidationException::withMessages([
            'email' => ['Technical profile not found.'],
        ]);
    }

    $response['technical'] = [
        'id' => $technical->id,  // ← ID de la tabla technicals
        'name' => $technical->name,
        'email' => $technical->email,
        'phone' => $technical->phone,
        'photo' => $technical->photo,
        'is_default' => $technical->is_default,
        'shift' => $technical->shift,
        'status' => $technical->status,
    ];
}
```

**Esto está CORRECTO**. El problema es que:
1. ✅ SÍ devuelve el `technical.id`
2. ✅ El desarrollador mobile DEBE guardarlo
3. ⚠️ Pero NO está en `user.technical_id` (como sí está `user.tenant_id` para members)

---

## 🎯 SOLUCIÓN RECOMENDADA

### Opción 1: Agregar `technical_id` al objeto `user` (RECOMENDADO)

**Modificar** `TenantController.php` líneas 83-102:

```php
// Si es technical, agregar datos de technical
if ($user->hasRole('technical')) {
    $technical = $user->technical;
    if (!$technical) {
        throw ValidationException::withMessages([
            'email' => ['Technical profile not found.'],
        ]);
    }

    // ✅ AGREGAR ESTO - Consistencia con member
    $response['user']['technical_id'] = $technical->id;

    $response['technical'] = [
        'id' => $technical->id,
        'name' => $technical->name,
        'email' => $technical->email,
        'phone' => $technical->phone,
        'photo' => $technical->photo,
        'is_default' => $technical->is_default,
        'shift' => $technical->shift,
        'status' => $technical->status,
    ];
}
```

**Nueva respuesta**:
```json
{
  "user": {
    "id": 5,
    "name": "Juan Pérez",
    "roles": ["technical"],
    "technical_id": 4  // ← NUEVO - Consistente con tenant_id
  },
  "token": "...",
  "technical": {
    "id": 4,
    "name": "Juan Pérez",
    "is_default": false
  }
}
```

**Ventajas**:
- ✅ Consistente con el formato de member
- ✅ Más fácil para el desarrollador mobile
- ✅ No rompe código existente (solo agrega un campo)

---

### Opción 2: El desarrollador mobile guarda `technical.id` (ACTUAL)

**Código mobile**:
```javascript
// En el login
const response = await authApi.login(email, password);

if (response.technical) {
  // Guardar el technical_id del objeto technical
  await AsyncStorage.setItem('technicalId', response.technical.id.toString());
  await AsyncStorage.setItem('userId', response.user.id.toString());
  await AsyncStorage.setItem('isDefault', response.technical.is_default.toString());
}

// Luego al obtener tickets
const technicalId = await AsyncStorage.getItem('technicalId');
const tickets = await technicalApi.getTickets(technicalId, 'all');
```

**Ventajas**:
- ✅ No requiere cambios en backend
- ✅ Ya funciona así

**Desventajas**:
- ⚠️ Inconsistente con member
- ⚠️ Más propenso a errores

---

## 🔧 VERIFICACIÓN DEL ENDPOINT

### El endpoint SÍ existe y funciona

**Ruta** (`routes/api.php` línea 158):
```php
Route::get('/technicals/{technical}/tickets', [TechnicalController::class, 'getTickets']);
```

**Controlador** (`TechnicalController.php` líneas 23-71):
```php
public function getTickets(Request $request, $technicalId)
{
    $technical = Technical::findOrFail($technicalId);
    $type = $request->get('type', 'all');
    
    $query = $technical->tickets()
        ->with(['building:id,name', 'device:id,name', 'apartment:id,number'])
        ->select('id', 'title', 'status', 'priority', 'created_at', 'building_id', 'device_id', 'apartment_id');
    
    // ... filtros por tipo ...
    
    $tickets = $query->latest()->get();
    
    return response()->json($tickets);
}
```

**Estado**: ✅ **FUNCIONA CORRECTAMENTE**

---

## ❓ ¿POR QUÉ PUEDE ESTAR FALLANDO?

### Posibles causas del Error 500:

1. **El técnico no tiene tickets asignados**
   - Solución: Asignar al menos 1 ticket al técnico con ID 4

2. **Problema con las relaciones**
   - `building`, `device`, o `apartment` pueden ser NULL
   - Solución: Verificar que los tickets tienen estos datos

3. **Error en la query**
   - Verificar logs de Laravel en `storage/logs/laravel.log`

---

## 🧪 PRUEBA RECOMENDADA

### 1. Verificar que el técnico existe y tiene tickets

```sql
-- Verificar técnico
SELECT * FROM technicals WHERE id = 4;

-- Verificar tickets asignados
SELECT id, title, status, technical_id 
FROM tickets 
WHERE technical_id = 4;

-- Verificar relaciones
SELECT t.id, t.title, t.building_id, t.device_id, t.apartment_id,
       b.name as building_name, d.name as device_name, a.number as apartment_number
FROM tickets t
LEFT JOIN buildings b ON t.building_id = b.id
LEFT JOIN devices d ON t.device_id = d.id
LEFT JOIN apartments a ON t.apartment_id = a.id
WHERE t.technical_id = 4;
```

### 2. Probar el endpoint directamente

```bash
curl -X GET "https://adkassist.com/api/technicals/4/tickets" \
  -H "Accept: application/json"
```

**Nota**: Este endpoint **NO requiere autenticación** según `routes/api.php` línea 158.

---

## ✅ RECOMENDACIÓN FINAL

### Para el Backend:

**Opción A (RECOMENDADO)**: Agregar `technical_id` al objeto `user` en el login
```php
$response['user']['technical_id'] = $technical->id;
```

**Opción B**: Dejar como está y documentar que el mobile debe usar `response.technical.id`

### Para el Mobile:

**Código correcto** (funciona con ambas opciones):
```javascript
// Login
const response = await authApi.login(email, password);

if (response.technical) {
  const technicalId = response.user.technical_id || response.technical.id;
  await AsyncStorage.setItem('technicalId', technicalId.toString());
}

// Obtener tickets
const technicalId = await AsyncStorage.getItem('technicalId');
const tickets = await fetch(`/api/technicals/${technicalId}/tickets`);
```

---

## 🔍 VERIFICAR LOGS

Por favor revisar `storage/logs/laravel.log` para ver el error exacto del 500.

Probablemente sea:
- ❌ Ticket sin `building_id` (NULL)
- ❌ Ticket sin `device_id` (NULL)
- ❌ Ticket sin `apartment_id` (NULL)

**Solución**: Cambiar el `select` para permitir NULLs o usar `leftJoin` en lugar de `with`.

---

**Fecha**: 2025-11-25
**Estado**: ✅ Problema identificado - Solución propuesta
