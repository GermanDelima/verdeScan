# 📁 Migraciones de Base de Datos - VerdeScan

## 🚀 Setup desde Cero (Nueva Instalación)

Si estás configurando VerdeScan por primera vez, ejecuta estos archivos **EN ORDEN** en Supabase SQL Editor:

### Opción A: Script TODO-EN-UNO
```bash
# Usando psql CLI (no funciona en Supabase Web UI)
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f 00-SETUP-COMPLETO.sql
```

### Opción B: Paso a Paso en Supabase Dashboard ⭐ RECOMENDADO

1. Ve a tu proyecto en Supabase Dashboard
2. Abre **SQL Editor** → **New Query**
3. Ejecuta estos archivos uno por uno **EN ESTE ORDEN**:

```bash
1. schema-consolidated.sql           # Base principal (users, scans, raffles)
2. create-products-table.sql         # Productos escaneables
3. create-tokens-system.sql          # Tokens de reciclaje
4. SETUP_TACHO_VIRTUAL.sql           # Tacho virtual
5. admin-and-staff-accounts.sql      # Sistema de staff/promotores
6. fix-rls-policies.sql              # Políticas RLS (IMPORTANTE - AL FINAL)
7. setup-raffles-policies.sql        # Sorteos y políticas
```

4. **(Opcional)** Verificar que todo funciona:
   - Crea un usuario de prueba desde tu app
   - Verifica que puedes hacer login
   - Revisa que las tablas se crearon correctamente

---

## 📂 Estructura de Archivos

### ✅ **Archivos Esenciales** (en repositorio)

#### Scripts Principales (7 archivos)
1. `schema-consolidated.sql` - Schema base (users, scans, raffles, raffle_tickets)
2. `create-products-table.sql` - Tabla de productos con códigos de barras
3. `create-tokens-system.sql` - Sistema de tokens de reciclaje
4. `SETUP_TACHO_VIRTUAL.sql` - Tacho virtual de usuario
5. `admin-and-staff-accounts.sql` - Cuentas de administrador y staff
6. `fix-rls-policies.sql` - Políticas RLS corregidas
7. `setup-raffles-policies.sql` - Configuración de sorteos

#### Scripts de Utilidad
- `00-SETUP-COMPLETO.sql` - Script maestro (requiere psql CLI)
- `README.md` - Este archivo
- `ANALISIS_ARCHIVOS.md` - Análisis de archivos obsoletos

### 📦 **Carpeta obsolete/** (archivos antiguos y de desarrollo)

Archivos movidos a `obsolete/` que NO deberían subirse a GitHub público:
- `diagnose-and-fix-admin.sql` - Contiene datos específicos del desarrollador
- `supabase-test-data.sql` - Datos de prueba
- `fix-ranking-rls.sql` - Funcionalidad duplicada
- `LIMPIAR_OBSOLETOS.bat` - Script ya ejecutado
- *(otros archivos obsoletos)*

---

## 🎯 Tablas Creadas

Después de ejecutar todos los scripts principales, tendrás estas tablas:

### Tablas Principales
- `users` - Usuarios registrados
- `scans` - Escaneos de QR/códigos de barras
- `raffles` - Sorteos disponibles
- `raffle_tickets` - Tickets de sorteos comprados por usuarios

### Tablas de Sistema
- `products` - Productos escaneables (códigos de barras)
- `recycling_tokens` - Tokens de reciclaje (códigos de 6 dígitos)
- `material_points_config` - Configuración de puntos por material (AVU, latas, botellas)
- `user_virtual_bin` - Tacho virtual de cada usuario
- `staff_accounts` - Cuentas de staff (promotores, kioskeros, ecopuntos)

### Total: **9 tablas**

---

## 🔧 Funciones y Triggers

### Funciones Principales
- `handle_new_user()` - Crea usuario en public.users cuando se registra en auth.users
- `get_neighborhood_rankings()` - Obtiene ranking de barrios por puntos
- `add_to_virtual_bin()` - Agrega material al tacho virtual
- `remove_from_virtual_bin()` - Remueve material del tacho virtual
- `get_total_bin_items()` - Cuenta total de items en tacho virtual
- `update_updated_at_column()` - Actualiza timestamp automáticamente
- `generate_token()` - Genera token de reciclaje único
- `validate_token()` - Valida y usa token de reciclaje
- `authenticate_staff()` - Autentica cuentas de staff

### Triggers
- `on_auth_user_created` - Se ejecuta al crear usuario en auth.users
- `update_users_updated_at` - Actualiza updated_at en users
- `update_material_points_config_updated_at` - Actualiza timestamp en config

---

## 🔐 Políticas RLS (Row Level Security)

Todas las tablas tienen políticas RLS configuradas para:
- ✅ Los usuarios solo pueden ver/modificar sus propios datos
- ✅ Los sorteos son públicos (anyone can view active raffles)
- ✅ Los usuarios pueden ver sus propios boletos de sorteo
- ✅ Las tablas de configuración son de solo lectura para usuarios
- ✅ Solo admins pueden gestionar sorteos, productos y staff

---

## ⚠️ IMPORTANTE

### Orden de Ejecución
**DEBES** ejecutar los scripts en el orden especificado arriba. Si no lo haces:
- `create-tokens-system.sql` depende de que exista la tabla `users`
- `SETUP_TACHO_VIRTUAL.sql` depende de `material_points_config`
- `fix-rls-policies.sql` debe ejecutarse **AL FINAL** para evitar errores de recursión

### No Ejecutar Dos Veces
Los scripts usan `CREATE TABLE IF NOT EXISTS` para prevenir errores, pero **NO** deberías ejecutar todo de nuevo en una base de datos existente con datos.

### Backups
Antes de ejecutar migraciones en producción, **SIEMPRE** haz backup de tu base de datos.

---

## 🆘 Troubleshooting

### Error: "infinite recursion detected"
- **Solución:** Ejecuta `fix-rls-policies.sql`
- **Causa:** Políticas RLS recursivas en la tabla users

### Error: "relation already exists"
- **Causa:** Ya ejecutaste ese script antes
- **Solución:** Salta ese archivo o usa `DROP TABLE` antes (¡cuidado con los datos!)

### Error: "function does not exist"
- **Causa:** No ejecutaste todos los scripts en orden
- **Solución:** Ejecuta todos los scripts desde el principio

### Error: "permission denied for table"
- **Causa:** Políticas RLS no están configuradas correctamente
- **Solución:** Ejecuta `fix-rls-policies.sql` y `setup-raffles-policies.sql`

### Los sorteos no aparecen
- **Solución:** Ejecuta `setup-raffles-policies.sql` para crear ejemplos
- **Verificar:** Que las políticas RLS permitan SELECT público en raffles

### Admin no puede hacer login
- **Causa:** El usuario no tiene `role = 'admin'`
- **Solución:**
  1. Ve a Table Editor → users
  2. Busca tu usuario por email
  3. Edita el campo `role` y pon `'admin'`

---

## 📝 Historial de Cambios

Ver `docs/SCHEMA-CHANGES.md` para detalles de cambios consolidados en el schema.

Ver `ANALISIS_ARCHIVOS.md` para análisis de archivos obsoletos movidos.

---

## 🔒 Seguridad y GitHub

### Archivos que NO deben subirse a GitHub público:
- ❌ `obsolete/diagnose-and-fix-admin.sql` - Contiene datos personales
- ❌ `obsolete/supabase-test-data.sql` - Datos de prueba con información real
- ❌ Cualquier archivo con emails o datos sensibles

### Archivos seguros para GitHub público:
- ✅ Todos los scripts principales (schema-consolidated.sql, etc.)
- ✅ README.md y documentación
- ✅ Scripts sin datos personales

### Recomendación de .gitignore:
```gitignore
# Migraciones obsoletas y específicas del desarrollador
migrations/obsolete/
migrations/*-local.sql
migrations/*-dev.sql
migrations/*-backup-*.sql
```

---

## 🚀 Setup Rápido (Resumen)

```bash
# 1. Copia estos archivos a Supabase SQL Editor (uno por uno):
schema-consolidated.sql
create-products-table.sql
create-tokens-system.sql
SETUP_TACHO_VIRTUAL.sql
admin-and-staff-accounts.sql
fix-rls-policies.sql
setup-raffles-policies.sql

# 2. Configura tu cuenta como admin:
# En Table Editor → users, edita tu usuario y pon role = 'admin'

# 3. ¡Listo! Tu base de datos está configurada.
```

---

**Última actualización:** 2025-01-29
**Versión del Schema:** 1.0 (Consolidado)
