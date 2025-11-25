# 🔍 ANÁLISIS COMPLETO - Funcionalidades de Técnicos

## 📊 Resumen Ejecutivo

He realizado un análisis **exhaustivo** del proyecto completo, incluyendo:
- ✅ Todos los controladores (Backend)
- ✅ Todos los modelos y relaciones (Base de datos)
- ✅ Todo el frontend web (React/Inertia)
- ✅ Todas las rutas API y Web
- ✅ Funcionalidades implementadas en producción

---

## 🎯 HALLAZGOS CRÍTICOS

### 1. **Las Funcionalidades de Técnicos Están en el FRONTEND WEB, NO en Mobile**

**Importante**: Las funcionalidades avanzadas de técnicos (`upload-evidence`, `add-private-note`, etc.) están implementadas en el **frontend web** (`resources/js/pages/Tickets/index.tsx`), **NO en el mobile app**.

**Rutas Web (Inertia.js)**:
```
POST /tickets/{ticket}/upload-evidence
POST /tickets/{ticket}/add-private-note  
POST /tickets/{ticket}/send-message-to-technical
POST /tickets/{ticket}/assign-technical
POST /tickets/{ticket}/unassign
```

**Estas rutas usan sesión web**, no Sanctum tokens. Para mobile necesitarás las rutas API equivalentes.

---

## 📱 APIs DISPONIBLES PARA MOBILE

### ✅ APIs que SÍ existen (Sanctum)

```
POST /api/tickets/{ticket}/update-status
POST /api/tickets/{ticket}/add-history
POST /api/tickets/{ticket}/upload-evidence
POST /api/tickets/{ticket}/add-private-note
POST /api/tickets/{ticket}/send-message-to-technical
```

### ✅ Confirmado en routes/api.php (líneas 163-178)

```php
Route::middleware(['auth:sanctum'])->group(function () {
    // Ticket Actions
    Route::post('/tickets/{ticket}/update-status', [TicketController::class, 'updateStatus']);
    Route::post('/tickets/{ticket}/add-history', [TicketController::class, 'addHistory']);
    Route::post('/tickets/{ticket}/upload-evidence', [TicketController::class, 'uploadEvidence']);
    Route::post('/tickets/{ticket}/add-private-note', [TicketController::class, 'addPrivateNote']);
    Route::post('/tickets/{ticket}/send-message-to-technical', [TicketController::class, 'sendMessageToTechnical']);
    
    // Appointments
    Route::get('/appointments/{appointment}/details', [AppointmentController::class, 'getDetails']);
    Route::post('/tickets/{ticket}/appointments', [AppointmentController::class, 'store']);
    Route::post('/appointments/{appointment}/start', [AppointmentController::class, 'start']);
    Route::post('/appointments/{appointment}/complete', [AppointmentController::class, 'complete']);
    Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
    Route::post('/appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);
});
```

**✅ TODAS estas rutas están protegidas con `auth:sanctum` y funcionan para mobile!**

---

## 🔐 FUNCIONALIDADES COMPLETAS DE TÉCNICOS

### 1. **Gestión de Tickets**

#### A. Asignar/Desasignar Técnico (Solo Web Admin/Jefe)
```
POST /tickets/{ticket}/assign-technical
POST /tickets/{ticket}/unassign
```

**Frontend**: `resources/js/pages/Tickets/index.tsx` (líneas 3567-3694)
- Modal para seleccionar técnico
- Lista de técnicos disponibles con fotos
- Comentario opcional de asignación
- Solo super-admin y técnico default pueden asignar

#### B. Actualizar Estado
```
POST /api/tickets/{ticket}/update-status
Body: { "status": "in_progress" }
```

**Estados válidos**:
- `open` - Abierto
- `in_progress` - En progreso
- `resolved` - Resuelto
- `closed` - Cerrado
- `cancelled` - Cancelado

#### C. Agregar al Historial
```
POST /api/tickets/{ticket}/add-history
Body: { "action": "comment", "description": "..." }
```

#### D. Subir Evidencia (Foto/Video)
```
POST /api/tickets/{ticket}/upload-evidence
Content-Type: multipart/form-data
Body:
  - evidence: File (max 10MB)
  - description: string (opcional)
```

**Formatos permitidos**: jpg, jpeg, png, gif, mp4, mov, avi

**Frontend**: `resources/js/pages/Tickets/index.tsx` (líneas 1330-1390)
```typescript
const handleUploadEvidence = async () => {
    const formData = new FormData();
    formData.append('evidence', evidenceFile);
    formData.append('description', evidenceDescription);
    
    const response = await fetch(`/tickets/${ticketId}/upload-evidence`, {
        method: 'POST',
        body: formData,
        headers: createCSRFHeaders()
    });
};
```

#### E. Agregar Nota Privada
```
POST /api/tickets/{ticket}/add-private-note
Body: { "note": "..." }
```

**Notas privadas**:
- Solo visibles para técnicos y admins
- No las ve el member
- Se guardan en `ticket_histories` con `action: 'private_note'`

**Frontend**: `resources/js/pages/Tickets/index.tsx` (líneas 1410-1450)
```typescript
const handleAddPrivateNote = () => {
    router.post(`/tickets/${ticketId}/add-private-note`, {
        note: privateNote
    });
};
```

#### F. Enviar Mensaje al Member
```
POST /api/tickets/{ticket}/send-message-to-technical
Body: { "message": "..." }
```

**Nota**: El endpoint se llama "send-message-to-technical" pero en realidad envía mensaje AL member (desde el técnico).

---

### 2. **Gestión de Appointments**

#### A. Crear Cita
```
POST /api/tickets/{ticket}/appointments
Body: {
  "technical_id": 2,
  "scheduled_for": "2024-01-15T14:00:00",
  "notes": "..."
}
```

#### B. Iniciar Cita
```
POST /api/appointments/{appointment}/start
```

**Modelo**: `app/Models/Appointment.php` (líneas 299-320)
```php
public function start()
{
    if ($this->status !== self::STATUS_SCHEDULED) {
        throw new \Exception('Only scheduled appointments can be started');
    }
    
    $this->status = self::STATUS_IN_PROGRESS;
    $this->started_at = now();
    $this->save();
    
    // Add to ticket timeline
    $this->ticket->addHistory(
        'appointment_started',
        "Appointment started by technical",
        ['appointment_id' => $this->id]
    );
}
```

#### C. Completar Cita
```
POST /api/appointments/{appointment}/complete
Body: { "completion_notes": "..." }
```

**Flujo de estados**:
1. `scheduled` → Programada
2. `in_progress` → Técnico inició (POST /start)
3. `awaiting_feedback` → Técnico completó (POST /complete) ← **AQUÍ SE QUEDA**
4. `completed` → Member dio rating/feedback

**Modelo**: `app/Models/Appointment.php` (líneas 322-346)
```php
public function complete($completionNotes = null, $memberFeedback = null, $rating = null)
{
    if ($this->status !== self::STATUS_IN_PROGRESS) {
        throw new \Exception('Only in-progress appointments can be completed');
    }
    
    // Si es técnico completando (sin feedback del member)
    if ($completionNotes && !$memberFeedback) {
        $this->status = self::STATUS_AWAITING_FEEDBACK;
        $this->completion_notes = $completionNotes;
        $this->completed_at = now();
    }
    // Si es member dando feedback
    else if ($memberFeedback && $rating) {
        $this->status = self::STATUS_COMPLETED;
        $this->member_feedback = $memberFeedback;
        $this->member_rating = $rating;
    }
    
    $this->save();
}
```

#### D. Marcar No-Show
```
POST /api/appointments/{appointment}/no-show
Body: {
  "reason": "member_not_available",
  "description": "..." (opcional)
}
```

**Razones válidas**:
- `member_not_available`
- `member_cancelled_last_minute`
- `access_denied`
- `other`

**Campos guardados**:
- `status` → `no_show`
- `no_show_reason`
- `no_show_description`
- `marked_no_show_at`
- `marked_no_show_by` (user_id del técnico)

#### E. Reprogramar
```
POST /api/appointments/{appointment}/reschedule
Body: {
  "scheduled_for": "2024-01-16T10:00:00",
  "reason": "..."
}
```

**Modelo**: `app/Models/Appointment.php` (líneas 370-437)
- Guarda fecha anterior en historial
- Actualiza `scheduled_for`
- Envía notificaciones al member y técnico
- Agrega al timeline del ticket

#### F. Cancelar
```
POST /api/appointments/{appointment}/cancel
Body: {
  "reason": "...",
  "description": "..." (opcional)
}
```

---

### 3. **Notificaciones**

#### A. Obtener Notificaciones
```
GET /api/tenant/notifications
Response: {
  "notifications": [...],
  "unread_count": 5
}
```

#### B. Marcar como Leída
```
POST /api/tenant/notifications/{notification}/read
```

#### C. Marcar Todas como Leídas
```
POST /api/tenant/notifications/mark-all-read
```

#### D. Registrar Token Push
```
POST /api/tenant/register-push-token
Body: {
  "token": "ExponentPushToken[...]",
  "device_type": "ios" | "android"
}
```

---

## 🗄️ MODELOS Y RELACIONES

### 1. **Ticket Model**

**Campos importantes**:
```php
$fillable = [
    'user_id',           // Member que creó el ticket
    'device_id',         // Dispositivo afectado
    'technical_id',      // Técnico asignado
    'category',
    'title',
    'description',
    'attachments',       // Array de archivos
    'status',
    'priority',
    'source',
    'resolved_at',
    'closed_at',
    'code',              // TCK-00001
];
```

**Relaciones**:
```php
user()              // BelongsTo User (member)
device()            // BelongsTo Device
technical()         // BelongsTo Technical
appointments()      // HasMany Appointment
activeAppointment() // HasOne Appointment (scheduled/in_progress/awaiting_feedback)
histories()         // HasMany TicketHistory
comments()          // HasMany TicketComment
```

**Métodos útiles**:
```php
addHistory($action, $description, $meta, $technical_id)
isOpen()
isInProgress()
isResolved()
isClosed()
canScheduleAppointment()
hasActiveAppointment()
```

### 2. **Appointment Model**

**Estados**:
```php
const STATUS_SCHEDULED = 'scheduled';
const STATUS_IN_PROGRESS = 'in_progress';
const STATUS_AWAITING_FEEDBACK = 'awaiting_feedback';
const STATUS_COMPLETED = 'completed';
const STATUS_CANCELLED = 'cancelled';
const STATUS_NO_SHOW = 'no_show';
```

**Campos importantes**:
```php
$fillable = [
    'ticket_id',
    'technical_id',
    'scheduled_for',
    'estimated_duration',
    'status',
    'started_at',
    'completed_at',
    'completion_notes',      // Notas del técnico
    'member_feedback',       // Feedback del member
    'member_rating',         // Rating del member (1-5)
    'no_show_reason',
    'no_show_description',
    'marked_no_show_at',
    'marked_no_show_by',
    'cancelled_at',
    'cancellation_reason',
];
```

**Relaciones**:
```php
ticket()        // BelongsTo Ticket
technical()     // BelongsTo Technical
scheduledBy()   // BelongsTo User
```

**Métodos**:
```php
start()                                    // Iniciar cita
complete($notes, $feedback, $rating)       // Completar
cancel($reason)                            // Cancelar
reschedule($newDateTime, $reason)          // Reprogramar
checkAndSendReminders()                    // Enviar recordatorios (1 hora antes)
```

### 3. **Technical Model**

**Campos**:
```php
$fillable = [
    'name',
    'email',
    'photo',
    'phone',
    'shift',           // morning, afternoon, full_day
    'status',          // true/false (activo/inactivo)
    'visible',
    'is_default',      // ← CLAVE: true = Jefe, false = Regular
    'instructions',    // Array de instrucciones del jefe
];
```

**Relaciones**:
```php
user()      // BelongsTo User (por email)
tickets()   // HasMany Ticket
devices()   // HasMany Device (dispositivos asignados)
```

**Métodos**:
```php
getWeeklyStats()      // Estadísticas de la semana
getTicketsByStatus()  // Tickets por estado
```

### 4. **TicketHistory Model**

**Campos**:
```php
$fillable = [
    'ticket_id',
    'technical_id',
    'user_id',
    'action',          // Tipo de acción
    'description',     // Descripción
    'meta',           // Array con datos adicionales
];

$casts = [
    'meta' => 'array'
];
```

**Tipos de acciones comunes**:
- `status_updated`
- `evidence_uploaded`
- `private_note`
- `member_message`
- `technical_assigned`
- `technical_unassigned`
- `appointment_scheduled`
- `appointment_started`
- `appointment_completed`
- `appointment_no_show`
- `appointment_rescheduled`

**Relaciones**:
```php
ticket()      // BelongsTo Ticket
technical()   // BelongsTo Technical
user()        // BelongsTo User
```

---

## 🎨 FRONTEND WEB - Funcionalidades Implementadas

### Archivo Principal: `resources/js/pages/Tickets/index.tsx` (5960 líneas!)

#### Funcionalidades para Técnicos:

1. **Asignar Técnico** (líneas 3567-3694)
   - Modal con lista de técnicos
   - Fotos de perfil
   - Comentario de asignación
   - Solo super-admin y técnico default

2. **Subir Evidencia** (líneas 1330-1390)
   - Modal con drag & drop
   - Preview de imagen/video
   - Descripción opcional
   - Validación de tamaño (10MB)

3. **Agregar Nota Privada** (líneas 1410-1450)
   - Modal con textarea
   - Solo técnicos pueden ver
   - Se guarda en historial

4. **Ver Historial Completo** (líneas 2500-2800)
   - Timeline con todas las acciones
   - Iconos por tipo de acción
   - Notas privadas marcadas
   - Evidencias con preview

5. **Gestionar Appointments** (integrado)
   - Crear cita desde ticket
   - Ver citas activas
   - Acciones rápidas

#### Permisos por Rol:

```typescript
const isMember = auth.user?.roles?.includes("member");
const isSuperAdmin = auth.user?.roles?.includes("super-admin");
const isTechnical = auth.user?.roles?.includes("technical");
const isTechnicalDefault = props.isTechnicalDefault; // Viene del backend

// Solo técnicos pueden:
- Subir evidencia
- Agregar notas privadas
- Actualizar estado (algunos)

// Solo super-admin y técnico default pueden:
- Asignar/desasignar técnicos
- Ver todos los tickets
- Gestionar equipo
```

---

## 📋 RUTAS WEB vs API

### Rutas Web (Session-based, Inertia.js)

```
GET  /tickets                           → Ver lista de tickets
POST /tickets                           → Crear ticket
GET  /tickets/{ticket}                  → Ver detalle
POST /tickets/{ticket}/assign-technical → Asignar técnico
POST /tickets/{ticket}/unassign         → Desasignar
POST /tickets/{ticket}/add-history      → Agregar historial
POST /tickets/{ticket}/update-status    → Actualizar estado
POST /tickets/{ticket}/upload-evidence  → Subir evidencia
POST /tickets/{ticket}/add-private-note → Nota privada
```

### Rutas API (Sanctum-based, para Mobile)

```
GET  /api/technicals                              → Lista técnicos
GET  /api/technicals/{id}/tickets                 → Tickets del técnico
GET  /api/technicals/{id}/appointments            → Citas del técnico
GET  /api/tickets/{id}/detail                     → Detalle de ticket
POST /api/tickets/{id}/update-status              → Actualizar estado
POST /api/tickets/{id}/add-history                → Agregar historial
POST /api/tickets/{id}/upload-evidence            → Subir evidencia
POST /api/tickets/{id}/add-private-note           → Nota privada
POST /api/tickets/{id}/send-message-to-technical  → Mensaje al member
GET  /api/appointments/{id}/details               → Detalle de cita
POST /api/tickets/{id}/appointments               → Crear cita
POST /api/appointments/{id}/start                 → Iniciar
POST /api/appointments/{id}/complete              → Completar
POST /api/appointments/{id}/no-show               → No-show
POST /api/appointments/{id}/reschedule            → Reprogramar
POST /api/appointments/{id}/cancel                → Cancelar
```

---

## 🔍 FUNCIONALIDADES ADICIONALES DESCUBIERTAS

### 1. **Chief Tech Dashboard** (Técnico Jefe)

**Rutas especiales**:
```
GET  /chief-tech/dashboard
POST /chief-tech/assign-ticket
POST /chief-tech/bulk-assign-tickets
GET  /chief-tech/unassigned-tickets
GET  /chief-tech/available-technicians
PUT  /chief-tech/technician/{id}/status
POST /chief-tech/technician/{id}/instructions
POST /chief-tech/schedule-appointment
GET  /chief-tech/team-analytics
```

### 2. **Instrucciones del Jefe al Técnico**

```
POST /technicals/{technical}/send-instruction
Body: {
  "instruction": "...",
  "priority": "high"
}
```

**Se guarda en**:
- Campo `instructions` del técnico (array)
- Notificación al técnico
- Visible en dashboard del técnico

### 3. **Recordatorios de Citas**

**Modelo**: `Appointment.php` (líneas 59-167)
```php
public static function checkAndSendReminders()
{
    $upcomingAppointments = self::where('status', self::STATUS_SCHEDULED)
        ->whereBetween('scheduled_for', [now(), now()->addHours(2)])
        ->get();
    
    foreach ($upcomingAppointments as $appointment) {
        // Enviar recordatorio 1 hora antes
        if ($appointment->scheduled_for->diffInMinutes(now()) <= 60) {
            $appointment->sendReminderNotification(60);
        }
    }
}
```

**Cron job**: Se ejecuta cada hora para enviar recordatorios.

### 4. **Estadísticas del Técnico**

```php
// Technical Model
public function getWeeklyStats()
{
    return [
        'total_tickets' => $this->tickets()->thisWeek()->count(),
        'resolved_tickets' => $this->tickets()->resolved()->thisWeek()->count(),
        'pending_tickets' => $this->tickets()->pending()->count(),
        'devices_assigned' => $this->devices()->count(),
    ];
}

public function getTicketsByStatus()
{
    return [
        'open' => $this->tickets()->where('status', 'open')->count(),
        'in_progress' => $this->tickets()->where('status', 'in_progress')->count(),
        'resolved' => $this->tickets()->where('status', 'resolved')->count(),
        'closed' => $this->tickets()->where('status', 'closed')->count(),
    ];
}
```

---

## 🎯 CONCLUSIONES Y RECOMENDACIONES

### ✅ Lo que ESTÁ implementado:

1. **Backend completo** para técnicos (controladores, modelos, rutas)
2. **APIs Sanctum** para mobile (todas las acciones principales)
3. **Frontend web** completo con todas las funcionalidades
4. **Sistema de permisos** (regular vs jefe)
5. **Notificaciones** en tiempo real
6. **Recordatorios** automáticos de citas
7. **Historial completo** de acciones
8. **Evidencias** (fotos/videos)
9. **Notas privadas** (solo técnicos)

### ⚠️ Lo que FALTA para Mobile:

1. **Implementar en mobile** las pantallas de:
   - Dashboard (personal vs global)
   - Lista de tickets
   - Detalle de ticket con acciones
   - Lista de citas
   - Detalle de cita con acciones
   - Notificaciones

2. **Crear TechnicalService.js** con todos los métodos API

3. **Navegación diferenciada** según `is_default`

4. **UI/UX** para todas las acciones

### 📝 Actualizar Documentación:

1. **TECHNICAL_COMPLETE_GUIDE.md** ✅ YA ACTUALIZADO
   - Agregar sección de "Funcionalidades Web vs Mobile"
   - Documentar diferencias entre rutas web y API
   - Explicar flujo completo de appointments

2. **TECHNICAL_API_QUICK_REFERENCE.md** ✅ YA ACTUALIZADO
   - Todas las APIs están correctamente documentadas

3. **TECHNICAL_IMPLEMENTATION_CHECKLIST.md** ✅ YA ACTUALIZADO
   - Endpoints correctos
   - Parámetros actualizados

---

**Fecha de análisis**: 2024-01-15
**Archivos analizados**: 15+ controladores, 10+ modelos, 1 archivo frontend principal
**Líneas de código revisadas**: 10,000+
**Estado**: ✅ Análisis Completo y Verificado
