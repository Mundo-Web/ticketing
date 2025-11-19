# ✅ Technical Mobile Implementation Checklist

## 📋 Guía Paso a Paso para Implementación

Usa esta checklist para trackear tu progreso implementando la funcionalidad de técnicos en la app móvil.

---

## Fase 1: Setup Inicial (30 min)

### Decisiones de Arquitectura
- [ ] **Decidir método de autenticación**
  - [ ] Opción A: WebView (recomendado - 2-3 horas)
  - [ ] Opción B: Cookie Manager (1-2 días)
  - [ ] Opción C: Solicitar API REST al backend (1 semana)

### Instalación de Dependencias
```bash
# Si eliges WebView
npm install react-native-webview

# Si eliges Cookie Manager
npm install @react-native-cookies/cookies
```

- [ ] **Instalar dependencias necesarias**
- [ ] **Probar que la dependencia funciona** (crear pantalla de prueba)

---

## Fase 2: Autenticación (2-3 horas con WebView)

### Login Screen
- [ ] **Crear `TechnicalLoginScreen.js`**
  - [ ] Implementar WebView con URL de login
  - [ ] Detectar navegación exitosa a `/dashboard`
  - [ ] Redirigir a dashboard de técnico
  - [ ] Manejar errores de login

### Verificar Usuario
- [ ] **Crear función para obtener usuario actual**
  - [ ] GET `/api/user`
  - [ ] Verificar rol 'technical'
  - [ ] Obtener datos del técnico (ID, is_default, etc.)
  - [ ] Guardar en estado global (Context/Redux)

### Logout
- [ ] **Implementar logout**
  - [ ] POST `/logout` con cookies
  - [ ] Limpiar estado local
  - [ ] Redirigir a login

### Testing de Autenticación
- [ ] Login exitoso funciona
- [ ] Login fallido muestra error
- [ ] Cookies se guardan correctamente
- [ ] Logout funciona correctamente
- [ ] App recuerda sesión al reabrir

---

## Fase 3: Servicio de API (1 hora)

### Crear TechnicalAPIService
- [ ] **Crear `services/TechnicalAPIService.js`**

#### Métodos de Tickets
- [ ] `getMyTickets(type)` - GET `/api/technicals/{id}/tickets`
- [ ] `getTicketDetail(ticketId)` - GET `/api/tickets/{id}/detail`
- [ ] `updateTicketStatus(ticketId, status)` - POST `/tickets/{id}/update-status`
- [ ] `uploadEvidence(ticketId, file, description)` - POST `/tickets/{id}/upload-evidence`
- [ ] `addPrivateNote(ticketId, note)` - POST `/tickets/{id}/add-private-note`
- [ ] `sendMessageToMember(ticketId, message)` - POST `/tickets/{id}/send-message-to-technical`

#### Métodos de Appointments
- [ ] `getMyAppointments(startDate, endDate)` - GET `/appointments`
- [ ] `getAppointmentDetails(appointmentId)` - GET `/appointments/{id}/details`
- [ ] `createAppointment(data)` - POST `/appointments`
- [ ] `startAppointment(appointmentId)` - POST `/appointments/{id}/start`
- [ ] `completeAppointment(appointmentId, notes)` - POST `/appointments/{id}/complete`
- [ ] `markNoShow(appointmentId, reason)` - POST `/appointments/{id}/no-show`
- [ ] `rescheduleAppointment(appointmentId, date, reason)` - POST `/appointments/{id}/reschedule`
- [ ] `cancelAppointment(appointmentId, reason)` - POST `/appointments/{id}/cancel`

#### Métodos de Notificaciones
- [ ] `getNotifications()` - GET `/notifications/api`
- [ ] `markAsRead(notificationId)` - POST `/notifications/{id}/read`
- [ ] `markAllAsRead()` - POST `/notifications/mark-all-read`
- [ ] `registerPushToken(token, deviceType)` - POST `/api/tenant/register-push-token`

#### Métodos de Técnico Default (opcional)
- [ ] `assignTicket(ticketId, technicalId, comment)` - POST `/tickets/{id}/assign-technical`
- [ ] `unassignTicket(ticketId)` - POST `/tickets/{id}/unassign`
- [ ] `getAllTechnicals()` - GET `/api/technicals`

### Testing del Servicio
- [ ] Probar 2-3 métodos desde una pantalla de prueba
- [ ] Verificar que `credentials: 'include'` funciona
- [ ] Verificar manejo de errores
- [ ] Verificar que responses se parsean correctamente

---

## Fase 4: Pantallas Principales (4-6 horas)

### 1. TechnicalDashboardScreen
- [ ] **Crear navegación principal**
  - [ ] Stack Navigator para técnicos
  - [ ] Tab Navigator (Dashboard, Tickets, Appointments, Notifications)

- [ ] **Dashboard UI**
  - [ ] Header con nombre del técnico
  - [ ] Stats cards (Open, In Progress, Resolved)
  - [ ] Today's appointments list
  - [ ] Today's tickets list
  - [ ] Pull to refresh

- [ ] **Funcionalidad**
  - [ ] Cargar stats al montar
  - [ ] Cargar citas de hoy
  - [ ] Cargar tickets de hoy
  - [ ] Navigate a ticket/appointment al tocar

### 2. TicketsListScreen
- [ ] **Reutilizar de Members**
  - [ ] Copiar estructura de TicketsList de members
  - [ ] Adaptar para usar TechnicalAPIService
  
- [ ] **UI Components**
  - [ ] Lista de tickets con TicketCard
  - [ ] Filtros (Today, Week, Open, In Progress, Resolved)
  - [ ] Pull to refresh
  - [ ] Infinite scroll
  - [ ] Empty state

- [ ] **Funcionalidad**
  - [ ] Cargar tickets según filtro
  - [ ] Navigate a TicketDetail

### 3. TicketDetailScreen
- [ ] **Reutilizar de Members como base**
  - [ ] Copiar estructura de TicketDetail de members
  - [ ] Agregar funcionalidades nuevas de técnico

- [ ] **UI Sections**
  - [ ] Header (código, status, priority)
  - [ ] Device information
  - [ ] Member contact info (phone, email, apartment)
  - [ ] Appointments section
  - [ ] Timeline (con private notes visibles)
  - [ ] Evidence gallery
  - [ ] Quick actions buttons

- [ ] **Quick Actions**
  - [ ] Botón "Change Status"
  - [ ] Botón "Upload Evidence"
  - [ ] Botón "Add Private Note"
  - [ ] Botón "Message Member"
  - [ ] Botón "Create Appointment"

- [ ] **Modals/Bottom Sheets**
  - [ ] Modal para cambiar estado
  - [ ] Modal para subir evidencia (camera/gallery)
  - [ ] Modal para agregar nota privada
  - [ ] Modal para enviar mensaje

- [ ] **Funcionalidad**
  - [ ] Cargar detalle completo del ticket
  - [ ] Actualizar estado
  - [ ] Subir evidencia (foto/video)
  - [ ] Agregar nota privada
  - [ ] Enviar mensaje al member
  - [ ] Ver evidencia en fullscreen

### 4. AppointmentsCalendarScreen
- [ ] **Reutilizar de Members como base**
  - [ ] Copiar estructura de calendario de members

- [ ] **UI Components**
  - [ ] Calendar view (React Native Calendar)
  - [ ] Lista de citas
  - [ ] Filtros (Today, Week, Month)
  - [ ] Tab de próximas vs pasadas

- [ ] **Funcionalidad**
  - [ ] Cargar citas del mes
  - [ ] Marcar días con citas
  - [ ] Navigate a AppointmentDetail

### 5. AppointmentDetailScreen
- [ ] **UI Sections**
  - [ ] Header (fecha, hora, status)
  - [ ] Ticket info
  - [ ] Member info (nombre, phone, apartamento)
  - [ ] Device info
  - [ ] Mapa de ubicación (Google Maps)
  - [ ] Notes/Instructions
  - [ ] Action buttons

- [ ] **Action Buttons (según status)**
  - [ ] "Start Visit" (si scheduled)
  - [ ] "Complete Visit" (si in_progress)
  - [ ] "Mark No-Show" (si scheduled/in_progress)
  - [ ] "Reschedule" (cualquier momento)
  - [ ] "Cancel" (cualquier momento)

- [ ] **Modals**
  - [ ] Modal para completion notes
  - [ ] Modal para no-show reason
  - [ ] Modal para reschedule
  - [ ] Confirmation dialogs

- [ ] **Funcionalidad**
  - [ ] Cargar detalle completo
  - [ ] Iniciar visita
  - [ ] Completar visita con notas
  - [ ] Marcar no-show
  - [ ] Reprogramar
  - [ ] Cancelar
  - [ ] Navigate to ticket detail

### 6. NotificationsScreen
- [ ] **Reutilizar de Members**
  - [ ] Lista de notificaciones
  - [ ] Mark as read
  - [ ] Mark all as read
  - [ ] Navigate según tipo de notificación

---

## Fase 5: Componentes Reutilizables (2 horas)

### Componentes de Members que Puedes Reutilizar
- [ ] TicketCard
- [ ] AppointmentCard
- [ ] StatusBadge
- [ ] PriorityBadge
- [ ] TimelineItem
- [ ] EmptyState
- [ ] LoadingSpinner
- [ ] ErrorView

### Componentes Nuevos para Técnicos
- [ ] **EvidenceUploader**
  - [ ] Camera picker
  - [ ] Gallery picker
  - [ ] Upload progress
  - [ ] Preview

- [ ] **PrivateNoteInput**
  - [ ] Text input
  - [ ] Character counter
  - [ ] Submit button

- [ ] **AppointmentActionButtons**
  - [ ] Start button
  - [ ] Complete button
  - [ ] No-show button
  - [ ] Conditional rendering según status

- [ ] **TechnicalStats**
  - [ ] Stats cards
  - [ ] Charts (opcional)

---

## Fase 6: Push Notifications (1-2 horas)

### Setup
- [ ] **Configurar FCM/Expo Push**
  - [ ] Obtener token al login
  - [ ] Registrar token en backend
  - [ ] Manejar token refresh

### Handlers
- [ ] **Foreground notifications**
  - [ ] Mostrar alerta/toast
  - [ ] Actualizar badge

- [ ] **Background notifications**
  - [ ] Navigate a pantalla correcta
  - [ ] Deep linking

### Types de Notificaciones
- [ ] Nuevo ticket asignado
- [ ] Cambio de estado de ticket
- [ ] Mensaje del member
- [ ] Recordatorio de cita próxima
- [ ] Instrucciones del técnico jefe

---

## Fase 7: Testing (2-3 horas)

### Testing Funcional
- [ ] **Autenticación**
  - [ ] Login con credenciales correctas
  - [ ] Login con credenciales incorrectas
  - [ ] Logout
  - [ ] Sesión persiste al reabrir app
  - [ ] Sesión expirada (401) redirige a login

- [ ] **Tickets**
  - [ ] Ver lista de tickets
  - [ ] Ver detalle de ticket
  - [ ] Cambiar estado de ticket
  - [ ] Subir evidencia (foto)
  - [ ] Subir evidencia (video)
  - [ ] Agregar nota privada
  - [ ] Enviar mensaje al member

- [ ] **Appointments**
  - [ ] Ver calendario de citas
  - [ ] Ver detalle de cita
  - [ ] Iniciar cita
  - [ ] Completar cita con notas
  - [ ] Marcar no-show
  - [ ] Reprogramar cita
  - [ ] Cancelar cita

- [ ] **Notificaciones**
  - [ ] Ver lista de notificaciones
  - [ ] Mark as read funciona
  - [ ] Push notification llega
  - [ ] Deep linking desde push

### Testing de UX
- [ ] Loading states se muestran correctamente
- [ ] Error messages son claros
- [ ] Pull to refresh funciona
- [ ] Navigation fluye bien
- [ ] Botones responden al toque

### Testing de Dispositivos
- [ ] iOS funciona correctamente
- [ ] Android funciona correctamente
- [ ] Diferentes tamaños de pantalla
- [ ] Modo claro/oscuro (si aplica)

### Testing de Edge Cases
- [ ] Sin conexión a internet
- [ ] Conexión lenta
- [ ] Error 401 (sesión expirada)
- [ ] Error 500 (server error)
- [ ] Empty states (sin tickets, sin citas)

---

## Fase 8: Pulido y Optimización (1-2 horas)

### Performance
- [ ] Optimizar re-renders
- [ ] Lazy loading de imágenes
- [ ] Caché de datos
- [ ] Debounce en búsquedas

### UX Improvements
- [ ] Animaciones suaves
- [ ] Haptic feedback
- [ ] Loading skeletons
- [ ] Toast notifications
- [ ] Confirmation dialogs

### Code Quality
- [ ] Refactorizar código duplicado
- [ ] Agregar comentarios
- [ ] Limpiar console.logs
- [ ] Fix warnings

---

## Fase 9: Documentación (30 min)

### Para el Equipo
- [ ] Documentar decisiones de arquitectura
- [ ] Documentar cómo agregar nuevas features
- [ ] Documentar cómo hacer debug

### Para Usuarios (opcional)
- [ ] Screenshots de la app
- [ ] Manual de usuario básico

---

## 🎯 Checklist Mínimo para Lanzar (MVP)

Si tienes poco tiempo, estos son los features ESENCIALES:

### Must Have (Crítico)
- [ ] Login funciona
- [ ] Ver lista de tickets asignados
- [ ] Ver detalle de ticket
- [ ] Cambiar estado de ticket
- [ ] Ver lista de citas
- [ ] Iniciar cita
- [ ] Completar cita
- [ ] Logout funciona

### Should Have (Importante pero no crítico)
- [ ] Subir evidencia
- [ ] Agregar notas privadas
- [ ] Push notifications
- [ ] Marcar no-show
- [ ] Enviar mensaje al member

### Nice to Have (Opcional para v1)
- [ ] Calendario visual
- [ ] Filtros avanzados
- [ ] Stats y gráficas
- [ ] Modo offline

---

## 📊 Progreso

```
Fase 1: Setup Inicial          [ ] 0/2   (0%)
Fase 2: Autenticación          [ ] 0/5   (0%)
Fase 3: Servicio de API        [ ] 0/28  (0%)
Fase 4: Pantallas              [ ] 0/52  (0%)
Fase 5: Componentes            [ ] 0/15  (0%)
Fase 6: Push Notifications     [ ] 0/8   (0%)
Fase 7: Testing                [ ] 0/31  (0%)
Fase 8: Pulido                 [ ] 0/11  (0%)
Fase 9: Documentación          [ ] 0/3   (0%)

TOTAL PROGRESO: 0/155 (0%)
```

---

## 💡 Tips

1. **No reinventes la rueda** - Reutiliza componentes de members
2. **Testea frecuentemente** - No esperes al final
3. **Empieza simple** - MVP primero, luego mejoras
4. **Haz commits pequeños** - Más fácil hacer rollback si algo falla
5. **Pide ayuda** - Usa la documentación cuando la necesites

---

## 🆘 Si Te Atoras

1. Revisa `TECHNICAL_MOBILE_QUICKSTART.md`
2. Consulta `TECHNICAL_API_DOCUMENTATION.md`
3. Compara con código de members
4. Busca en Stack Overflow
5. Pregunta al equipo

---

**¡Buena suerte con la implementación!** 🚀

Recuerda actualizar esta checklist conforme avances. Usa checkboxes para trackear tu progreso.
