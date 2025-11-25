# 📝 CHANGELOG - API de Técnicos

## [1.1.0] - 2025-11-25

### ✅ Agregado

#### `technical_id` en objeto `user` del login

**Archivo modificado**: `app/Http/Controllers/Api/TenantController.php` (línea 92)

**Cambio**:
```php
// Agregar technical_id al objeto user para consistencia con tenant_id
$response['user']['technical_id'] = $technical->id;
```

**Antes**:
```json
{
  "user": {
    "id": 5,
    "name": "Juan Pérez",
    "roles": ["technical"]
  },
  "technical": {
    "id": 2
  }
}
```

**Después**:
```json
{
  "user": {
    "id": 5,
    "name": "Juan Pérez",
    "roles": ["technical"],
    "technical_id": 2  // ← NUEVO
  },
  "technical": {
    "id": 2
  }
}
```

**Razón del cambio**:
- ✅ **Consistencia**: Ahora technical usa el mismo patrón que member (`tenant_id`)
- ✅ **Facilidad**: El desarrollador mobile puede acceder a `user.technical_id` directamente
- ✅ **Compatibilidad**: No rompe código existente, solo agrega un campo nuevo

**Impacto**:
- ✅ **Backward compatible**: El código mobile existente sigue funcionando
- ✅ **Mejora**: Ahora el mobile puede usar `user.technical_id` o `technical.id` (ambos funcionan)

---

### 🔧 Modificado

#### Endpoint `POST /api/appointments/{appointment}/no-show`

**Archivo modificado**: `routes/api.php` (línea 178)

**Cambio**: Agregado endpoint faltante para marcar citas como no-show

```php
Route::post('/appointments/{appointment}/no-show', [\\App\\Http\\Controllers\\AppointmentController::class, 'noShow']);
```

**Razón del cambio**:
- ✅ El endpoint estaba documentado pero no expuesto en API
- ✅ Solo estaba disponible en rutas web
- ✅ Necesario para la app móvil

**Impacto**:
- ✅ Ahora los técnicos pueden marcar citas como no-show desde la app móvil

---

## [1.0.0] - 2025-11-24

### ✅ Inicial

- Documentación completa de APIs para técnicos
- 22 endpoints documentados
- Guías de implementación para desarrollador mobile

---

## 📊 Resumen de Cambios

### Versión 1.1.0
- **Archivos modificados**: 2
- **Endpoints agregados**: 1
- **Campos nuevos en respuestas**: 1
- **Breaking changes**: 0
- **Backward compatible**: ✅ Sí

---

## 🔄 Migración

### Para desarrolladores mobile

#### Opción 1: Usar el nuevo campo (RECOMENDADO)

```javascript
// Nuevo código - Más simple
const response = await authApi.login(email, password);

if (response.technical) {
  // ✅ Usar technical_id del objeto user (NUEVO)
  await AsyncStorage.setItem('technicalId', response.user.technical_id.toString());
}
```

#### Opción 2: Mantener código existente (COMPATIBLE)

```javascript
// Código anterior - Sigue funcionando
const response = await authApi.login(email, password);

if (response.technical) {
  // ✅ Usar id del objeto technical (ANTERIOR)
  await AsyncStorage.setItem('technicalId', response.technical.id.toString());
}
```

#### Opción 3: Código robusto (MEJOR)

```javascript
// Código que funciona con ambas versiones
const response = await authApi.login(email, password);

if (response.technical) {
  // ✅ Usar technical_id si existe, sino usar technical.id
  const technicalId = response.user.technical_id || response.technical.id;
  await AsyncStorage.setItem('technicalId', technicalId.toString());
}
```

---

## 📚 Documentación Actualizada

Los siguientes documentos fueron actualizados para reflejar los cambios:

1. ✅ `TECHNICAL_API_DETAILED_RESPONSES.md` - Ejemplos de respuesta actualizados
2. ✅ `TECHNICAL_LOGIN_ANALYSIS.md` - Análisis del problema y solución
3. ✅ `TECHNICAL_API_VERIFICATION.md` - Verificación de endpoints
4. ✅ `CHANGELOG.md` - Este documento

---

## 🐛 Bugs Corregidos

### Error 500 en `/api/technicals/{id}/tickets`

**Problema**: El endpoint devolvía Error 500

**Causa**: Posiblemente tickets sin relaciones completas (building, device, apartment NULL)

**Solución recomendada**: Verificar que los tickets tengan todas las relaciones o usar `leftJoin`

**Estado**: ⚠️ Pendiente de verificación en producción

---

## 🔜 Próximos Cambios

### Planificado para v1.2.0

- [ ] Endpoint para obtener estadísticas del técnico
- [ ] Endpoint para obtener historial de actividad
- [ ] Soporte para filtros avanzados en tickets
- [ ] Paginación en lista de tickets

---

**Última actualización**: 2025-11-25 07:51 AM
**Versión actual**: 1.1.0
**Mantenedor**: Equipo de Backend
