# Cambios del Schema - Consolidación

**Fecha:** 2025-10-24
**Archivo generado:** `schema-consolidated.sql`

## 📋 Resumen

Este documento detalla las diferencias entre el schema original (`supabase-schema.sql`) y el schema consolidado actual que refleja el estado REAL de la base de datos.

---

## ✅ TABLAS ACTUALES EN LA BASE DE DATOS

### 1. **users** (8 columnas)
| Columna | Tipo | Nullable | Default | Estado |
|---------|------|----------|---------|--------|
| id | uuid | NO | uuid_generate_v4() | ✅ Original |
| email | text | NO | - | ✅ Original |
| name | text | NO | - | ✅ Original |
| points | integer | NO | 0 | ✅ Original |
| created_at | timestamptz | NO | now() | ✅ Original |
| updated_at | timestamptz | NO | now() | ✅ Original |
| neighborhood | varchar(100) | YES | null | ✅ Original |
| **total_earned_points** | integer | NO | 0 | ⭐ **AGREGADA** |

**Cambios:**
- ⭐ **Nueva columna:** `total_earned_points` - Almacena el total histórico de puntos ganados (incluye canjeados)

---

### 2. **scans** (6 columnas)
| Columna | Tipo | Nullable | Default | Estado |
|---------|------|----------|---------|--------|
| id | uuid | NO | uuid_generate_v4() | ✅ Original |
| user_id | uuid | NO | - | ✅ Original |
| qr_code | text | NO | - | ✅ Original |
| points_earned | integer | NO | - | ✅ Original |
| scanned_at | timestamptz | NO | now() | ✅ Original |
| **material_details** | text | YES | null | ⭐ **AGREGADA** |

**Cambios:**
- ⭐ **Nueva columna:** `material_details` - Detalle de materiales reciclados (ej: "Metal: 50 unidad")

---

### 3. **raffles** (11 columnas)
| Columna | Tipo | Nullable | Default | Estado |
|---------|------|----------|---------|--------|
| id | uuid | NO | uuid_generate_v4() | ✅ Original |
| title | text | NO | - | ✅ Original |
| description | text | NO | - | ✅ Original |
| prize | text | NO | - | ✅ Original |
| ticket_cost | integer | NO | 10 | ✅ Original |
| draw_date | timestamptz | NO | - | ✅ Original |
| status | text | NO | 'active' | ✅ Original |
| created_at | timestamptz | NO | now() | ✅ Original |
| **category** | text | YES | null | ⭐ **AGREGADA** |
| **sponsor** | text | YES | null | ⭐ **AGREGADA** |
| **image_url** | text | YES | null | ⭐ **AGREGADA** |

**Cambios:**
- ⭐ **Nueva columna:** `category` - Categoría del sorteo (ej: "mensual", "especial")
- ⭐ **Nueva columna:** `sponsor` - Patrocinador del sorteo
- ⭐ **Nueva columna:** `image_url` - URL de imagen del sorteo
- ⭐ **Nuevo constraint:** `raffles_status_check` - Valida status ('active', 'completed', 'cancelled')

---

### 4. **raffle_tickets** (5 columnas)
✅ **Sin cambios** - Igual al schema original

---

## ❌ TABLAS ELIMINADAS

Las siguientes tablas fueron eliminadas de la base de datos:

### ❌ **rewards**
- **Razón:** Eliminada manualmente por el usuario
- **Impacto:** Funcionalidad de recompensas deshabilitada

### ❌ **redemption_codes**
- **Razón:** Eliminada manualmente por el usuario
- **Impacto:** Códigos de canje deshabilitados

---

## 🔧 FUNCIONES

### ✅ Funciones Existentes

1. **handle_new_user()** ⭐ AGREGADA
   - Trigger function para crear usuario en `public.users` cuando se registra vía OAuth
   - Se ejecuta automáticamente en `auth.users` AFTER INSERT

2. **update_updated_at_column()** ✅ ORIGINAL
   - Actualiza automáticamente el campo `updated_at`

3. **get_neighborhood_rankings()** ✅ MODIFICADA
   - **Cambio:** Ahora usa `total_earned_points` en lugar de `points`
   - Retorna ranking de barrios por puntos totales ganados

---

## 🎯 TRIGGERS

### ✅ Triggers Activos

1. **on_auth_user_created** (en auth.users) ⭐ AGREGADO
   - Se ejecuta AFTER INSERT en `auth.users`
   - Llama a `handle_new_user()`
   - **IMPORTANTE:** Este trigger debe crearse manualmente en auth.users

2. **update_users_updated_at** (en users) ✅ ORIGINAL
   - Se ejecuta BEFORE UPDATE en `users`
   - Llama a `update_updated_at_column()`

---

## 🔐 ROW LEVEL SECURITY (RLS)

### ✅ Políticas Activas

**users:**
- Users can view their own data ✅
- Users can insert their own data ✅
- Users can update their own data ✅

**scans:**
- Users can view their own scans ✅
- Users can create their own scans ✅

**raffles:**
- Anyone can view raffles ✅

**raffle_tickets:**
- Users can view their own raffle tickets ✅
- Users can create their own raffle tickets ✅

### ❌ Políticas Eliminadas

Las políticas RLS de las tablas eliminadas (`rewards`, `redemption_codes`) ya no existen.

---

## 📊 ÍNDICES

### ⭐ Índices Nuevos Agregados

```sql
-- Users
CREATE INDEX idx_users_total_earned_points ON users(total_earned_points DESC);

-- Raffles
CREATE INDEX idx_raffles_category ON raffles(category);
```

### ✅ Índices Originales Mantenidos

- `idx_users_neighborhood`
- `idx_scans_user_id`
- `idx_scans_scanned_at`
- `idx_raffles_status`
- `idx_raffles_draw_date`
- `idx_raffle_tickets_user_id`
- `idx_raffle_tickets_raffle_id`

---

## 🗂️ MIGRACIONES CONSOLIDADAS

El schema consolidado incluye los cambios de las siguientes migraciones:

### ✅ Aplicadas (consolidadas en schema-consolidated.sql)

1. ✅ `supabase-schema.sql` - Schema base original
2. ✅ `supabase-oauth-setup.sql` - OAuth + handle_new_user trigger
3. ✅ `add-material-details-column.sql` - Columna material_details en scans
4. ✅ `supabase-raffles-update.sql` - Columnas category, sponsor, image_url en raffles
5. ✅ `supabase-fix-ranking-points.sql` - Columna total_earned_points en users
6. ✅ `supabase-neighborhood-update.sql` - Actualizaciones de neighborhood
7. ✅ `supabase-update-existing-users.sql` - Actualizaciones de usuarios existentes

### ❌ Obsoletas (pueden eliminarse)

1. ❌ `check-database-setup.js` - Script de verificación (no es migración)
2. ❌ `debug-ranking.sql` - Queries de debug
3. ❌ `supabase-test-data.sql` - Datos de prueba
4. ❌ `supabase-rewards-ecologicas.sql` - Rewards eliminadas
5. ❌ `fix-ranking-rls.sql` - Fix ya aplicado
6. ❌ `verificar-y-migrar-usuarios.sql` - Script de verificación

---

## ⚠️ PRÓXIMOS PASOS RECOMENDADOS

1. **Actualizar types.ts** para que coincida con el schema consolidado:
   - Agregar `material_details` a `scans`
   - Agregar `category`, `sponsor`, `image_url` a `raffles`
   - Eliminar tablas `rewards` y `redemption_codes`

2. **Borrar migraciones obsoletas** listadas arriba

3. **Mantener schema-consolidated.sql** como fuente de verdad

4. **Nuevas migraciones:** A partir de ahora, crear migraciones incrementales que modifiquen este schema base

---

## 📝 Notas Finales

- El schema consolidado es la representación exacta del estado actual de la base de datos a fecha 2025-10-24
- Se recomienda NO ejecutar este schema en una base de datos existente (ya está aplicado)
- Usar este archivo como **referencia y documentación** del estado actual
- Para nuevas instalaciones, este es el archivo a ejecutar

---

**Generado automáticamente por Claude Code**
