# 📱 Documentación para Desarrollador Mobile - App de Técnicos

> **Guía completa para implementar la aplicación móvil de técnicos**

---

## 🎯 ¿Por dónde empezar?

Hola desarrollador mobile 👋, esta documentación está organizada en **6 documentos** que debes leer en el siguiente orden:

---

## 📚 Documentos en Orden de Lectura

### 1️⃣ **ESTE DOCUMENTO** (README)
**Archivo**: `TECHNICAL_MOBILE_README.md`

**Propósito**: Punto de entrada y guía de navegación

**Leer**: ✅ AHORA

---

### 2️⃣ **Guía Completa** 📖
**Archivo**: `TECHNICAL_COMPLETE_GUIDE.md`

**Propósito**: Visión general del sistema, arquitectura y flujos

**Qué contiene**:
- ✅ Resumen ejecutivo del sistema
- ✅ Arquitectura general
- ✅ Diferencias entre Técnico Regular y Técnico Jefe
- ✅ Flujos completos (login, tickets, appointments)
- ✅ Código de ejemplo de `TechnicalService.js`
- ✅ Ejemplos de uso en React Native

**Cuándo leer**: **PRIMERO** - Para entender el panorama general

**Tiempo estimado**: 30-45 minutos

---

### 3️⃣ **Referencia Rápida de APIs** ⚡
**Archivo**: `TECHNICAL_API_QUICK_REFERENCE.md`

**Propósito**: Consulta rápida de endpoints

**Qué contiene**:
- ✅ Lista concisa de todos los endpoints
- ✅ Formato de request de cada uno
- ✅ Estados válidos
- ✅ Códigos HTTP
- ✅ Tips importantes

**Cuándo leer**: **SEGUNDO** - Para tener una referencia rápida

**Tiempo estimado**: 15 minutos

**Uso**: Mantener abierto mientras programas para consultas rápidas

---

### 4️⃣ **Respuestas Detalladas de APIs** 🔍
**Archivo**: `TECHNICAL_API_DETAILED_RESPONSES.md`

**Propósito**: Ejemplos REALES de cada respuesta API

**Qué contiene**:
- ✅ Ejemplos completos de request/response de cada endpoint
- ✅ TODOS los casos de error con sus mensajes exactos
- ✅ Estructura completa de objetos anidados
- ✅ Explicación de cada campo
- ✅ Valores posibles para enums

**Cuándo leer**: **TERCERO** - Antes de implementar cada feature

**Tiempo estimado**: 1-2 horas (leer por secciones según necesites)

**Uso**: Referencia principal durante la implementación

---

### 5️⃣ **Checklist de Implementación** ✅
**Archivo**: `TECHNICAL_IMPLEMENTATION_CHECKLIST.md`

**Propósito**: Plan de trabajo paso a paso

**Qué contiene**:
- ✅ Setup inicial del proyecto
- ✅ Implementación de autenticación
- ✅ Creación de servicios API
- ✅ Pantallas principales
- ✅ Componentes reutilizables
- ✅ Push notifications
- ✅ Testing
- ✅ Checklist de cada tarea

**Cuándo leer**: **CUARTO** - Al comenzar la implementación

**Tiempo estimado**: 20 minutos

**Uso**: Marcar tareas completadas mientras avanzas

---

### 6️⃣ **Análisis Completo del Backend** 🔬
**Archivo**: `TECHNICAL_COMPLETE_ANALYSIS.md`

**Propósito**: Documentación técnica profunda del backend

**Qué contiene**:
- ✅ Análisis de todos los controladores
- ✅ Modelos y relaciones de base de datos
- ✅ Funcionalidades del frontend web
- ✅ Diferencias entre rutas web y API
- ✅ Funcionalidades ocultas descubiertas

**Cuándo leer**: **OPCIONAL** - Solo si necesitas entender el backend en profundidad

**Tiempo estimado**: 45 minutos

**Uso**: Consulta cuando tengas dudas sobre cómo funciona algo en el backend

---

## 🚀 Plan de Trabajo Recomendado

### Semana 1: Setup y Autenticación
1. ✅ Leer `TECHNICAL_COMPLETE_GUIDE.md` (secciones 1-3)
2. ✅ Leer `TECHNICAL_API_QUICK_REFERENCE.md` (sección Autenticación)
3. ✅ Leer `TECHNICAL_API_DETAILED_RESPONSES.md` (sección Autenticación)
4. ✅ Implementar:
   - Setup del proyecto
   - AuthService
   - Login screen
   - Detección de tipo de técnico (`is_default`)
   - Navegación diferenciada

### Semana 2: Dashboard y Tickets
1. ✅ Leer `TECHNICAL_API_DETAILED_RESPONSES.md` (secciones Técnicos y Tickets)
2. ✅ Implementar:
   - TechnicalService (métodos de tickets)
   - Dashboard (personal vs global)
   - Lista de tickets
   - Detalle de ticket
   - Acciones de ticket (update status, add history)

### Semana 3: Evidencias y Notas
1. ✅ Leer `TECHNICAL_API_DETAILED_RESPONSES.md` (Upload Evidence, Private Notes)
2. ✅ Implementar:
   - Upload de evidencia (foto/video)
   - Notas privadas
   - Mensajes al member
   - Visualización de historial

### Semana 4: Appointments
1. ✅ Leer `TECHNICAL_API_DETAILED_RESPONSES.md` (sección Appointments)
2. ✅ Implementar:
   - Lista de citas
   - Detalle de cita
   - Crear cita
   - Iniciar cita
   - Completar cita
   - No-show
   - Reprogramar/Cancelar

### Semana 5: Notificaciones y Polish
1. ✅ Leer `TECHNICAL_API_DETAILED_RESPONSES.md` (sección Notificaciones)
2. ✅ Implementar:
   - Push notifications
   - Lista de notificaciones
   - Badge de contador
   - Testing completo
   - UI/UX polish

---

## 📋 Resumen de Endpoints por Prioridad

### 🔴 Prioridad ALTA (Implementar primero)

```
✅ POST /api/tenant/login
✅ POST /api/tenant/logout
✅ GET  /api/technicals/{id}/tickets?type={type}
✅ GET  /api/tickets/{id}/detail
✅ POST /api/tickets/{id}/update-status
✅ GET  /api/technicals/{id}/appointments?date={date}
✅ GET  /api/appointments/{id}/details
✅ POST /api/appointments/{id}/start
✅ POST /api/appointments/{id}/complete
```

### 🟡 Prioridad MEDIA (Implementar segundo)

```
✅ POST /api/tickets/{id}/add-history
✅ POST /api/tickets/{id}/upload-evidence
✅ POST /api/tickets/{id}/add-private-note
✅ POST /api/appointments/{id}/no-show
✅ POST /api/appointments/{id}/reschedule
✅ POST /api/appointments/{id}/cancel
✅ GET  /api/tenant/notifications
✅ POST /api/tenant/register-push-token
```

### 🟢 Prioridad BAJA (Implementar al final)

```
✅ GET  /api/technicals (solo para técnico jefe)
✅ POST /api/tickets/{id}/send-message-to-technical
✅ POST /api/tickets/{id}/appointments (crear cita)
✅ POST /api/tenant/notifications/{id}/read
✅ POST /api/tenant/notifications/mark-all-read
```

---

## 🎨 Pantallas Principales a Implementar

### Para Técnico Regular (`is_default: false`)

1. **Login** → Detecta tipo de técnico
2. **Dashboard Personal** → Resumen de SUS tickets/citas
3. **Mis Tickets** → Lista filtrable
4. **Detalle de Ticket** → Con acciones (update status, evidencia, notas)
5. **Mis Citas** → Calendario/lista
6. **Detalle de Cita** → Con acciones (start, complete, no-show)
7. **Notificaciones** → Lista con badge
8. **Perfil** → Datos del técnico

### Para Técnico Jefe (`is_default: true`)

**Todas las anteriores MÁS**:

9. **Dashboard Global** → Resumen de TODOS los tickets/citas
10. **Todos los Tickets** → Vista global
11. **Todos los Técnicos** → Lista de equipo
12. **Estadísticas** → Métricas del equipo

---

## 🔑 Información Clave

### Base URL
```
https://adkassist.com/api
```

### Autenticación
```javascript
// Todas las rutas protegidas requieren:
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Diferencia Clave: Regular vs Jefe

```javascript
// En la respuesta del login:
if (response.technical.is_default === true) {
  // Es TÉCNICO JEFE
  // - Puede ver TODOS los tickets
  // - Puede ver TODOS los técnicos
  // - Dashboard global
} else {
  // Es TÉCNICO REGULAR
  // - Solo ve SUS tickets asignados
  // - Solo ve SUS citas
  // - Dashboard personal
}
```

### Estados de Appointment

```javascript
// Flujo normal:
'scheduled'         // Programada
  ↓ (POST /start)
'in_progress'       // Técnico llegó
  ↓ (POST /complete)
'awaiting_feedback' // Técnico completó, espera rating del member
  ↓ (Member da rating)
'completed'         // Finalizada

// Flujos alternativos:
'scheduled' → (POST /no-show) → 'no_show'
'scheduled' → (POST /cancel) → 'cancelled'
```

### Upload de Archivos

```javascript
// Para evidencia:
const formData = new FormData();
formData.append('evidence', {
  uri: fileUri,
  type: 'image/jpeg', // o 'video/mp4'
  name: 'evidencia.jpg'
});
formData.append('description', 'Descripción opcional');

fetch(`${API_URL}/tickets/${ticketId}/upload-evidence`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  },
  body: formData
});
```

---

## 🐛 Manejo de Errores

### Errores Comunes

```javascript
// 401 - Token inválido o expirado
if (response.status === 401) {
  // Logout y redirigir a login
  await AsyncStorage.removeItem('token');
  navigation.navigate('Login');
}

// 403 - Sin permisos
if (response.status === 403) {
  // Mostrar mensaje: "No tienes permisos para esta acción"
}

// 404 - Recurso no encontrado
if (response.status === 404) {
  // Mostrar mensaje: "Recurso no encontrado"
}

// 422 - Error de validación
if (response.status === 422) {
  const errors = response.data.errors;
  // Mostrar errores de validación en el formulario
}

// 500 - Error del servidor
if (response.status === 500) {
  // Mostrar mensaje: "Error del servidor, intenta más tarde"
}
```

---

## 📞 Contacto y Soporte

Si tienes dudas sobre:

- **APIs**: Revisar `TECHNICAL_API_DETAILED_RESPONSES.md`
- **Flujos**: Revisar `TECHNICAL_COMPLETE_GUIDE.md`
- **Backend**: Revisar `TECHNICAL_COMPLETE_ANALYSIS.md`
- **Tareas**: Revisar `TECHNICAL_IMPLEMENTATION_CHECKLIST.md`

Si aún tienes dudas, contacta al equipo de backend.

---

## ✅ Checklist Rápido

Antes de empezar, asegúrate de tener:

- [ ] Node.js instalado
- [ ] React Native / Expo configurado
- [ ] Acceso al repositorio del proyecto
- [ ] Token de prueba para testing
- [ ] Credenciales de técnico de prueba:
  - Email: `technical@example.com`
  - Password: `password123`
- [ ] Credenciales de técnico jefe de prueba:
  - Email: `chief@example.com`
  - Password: `password123`

---

## 🎯 Objetivo Final

Crear una app móvil que permita a los técnicos:

✅ **Ver** sus tickets y citas asignadas
✅ **Actualizar** el estado de tickets
✅ **Subir** evidencia (fotos/videos)
✅ **Gestionar** citas (iniciar, completar, no-show)
✅ **Recibir** notificaciones push
✅ **Comunicarse** con los members

**Para técnicos jefe, además**:
✅ **Ver** todos los tickets del sistema
✅ **Ver** todos los técnicos del equipo
✅ **Acceder** a estadísticas globales

---

## 📊 Progreso Sugerido

Marca tu progreso:

- [ ] ✅ Leí `TECHNICAL_COMPLETE_GUIDE.md`
- [ ] ✅ Leí `TECHNICAL_API_QUICK_REFERENCE.md`
- [ ] ✅ Leí `TECHNICAL_API_DETAILED_RESPONSES.md` (Autenticación)
- [ ] ✅ Implementé Login
- [ ] ✅ Implementé detección de tipo de técnico
- [ ] ✅ Implementé Dashboard
- [ ] ✅ Implementé Lista de Tickets
- [ ] ✅ Implementé Detalle de Ticket
- [ ] ✅ Implementé Acciones de Ticket
- [ ] ✅ Implementé Lista de Citas
- [ ] ✅ Implementé Detalle de Cita
- [ ] ✅ Implementé Acciones de Cita
- [ ] ✅ Implementé Notificaciones
- [ ] ✅ Implementé Push Notifications
- [ ] ✅ Testing completo
- [ ] ✅ App lista para producción

---

**¡Buena suerte con la implementación! 🚀**

---

**Última actualización**: 2024-01-15
**Versión**: 1.0
**Autor**: Equipo de Backend
