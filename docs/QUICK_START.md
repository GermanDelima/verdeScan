# 🚀 Inicio Rápido - VerdeScan

## Configuración Inicial

### Paso 1: Ejecutar Migraciones en Supabase

Ejecuta estos scripts SQL **EN ORDEN** en Supabase SQL Editor:

```bash
1. migrations/admin-and-staff-accounts.sql       # Cuentas de admin y staff
2. migrations/fix-rls-policies.sql              # Arreglar políticas RLS
3. migrations/create-tokens-system.sql          # Sistema de tokens
4. migrations/create-virtual-bin.sql            # Tacho virtual (NUEVO)
5. migrations/diagnose-and-fix-admin.sql        # Configurar admin (actualiza el email)
```

### Paso 2: Configurar Variables de Entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key  ← IMPORTANTE
NEXT_PUBLIC_GEMINI_API_KEY=tu-gemini-key
```

**Dónde encontrar las keys:**
- Supabase Dashboard → Settings → API
- `anon key` → NEXT_PUBLIC_SUPABASE_ANON_KEY
- `service_role key` → SUPABASE_SERVICE_ROLE_KEY ⚠️ (secreta)

### Paso 3: Iniciar la Aplicación

```bash
npm run dev
```

---

## Flujo Completo del Sistema

### 1️⃣ Como Administrador

**Login:**
- URL: `http://localhost:3000/admin/login`
- Email: El que configuraste en el script de diagnóstico
- Password: Tu contraseña de Supabase

**Crear Cuentas:**
1. En el dashboard del admin, completa el formulario
2. Crea promotores:
   - Usuario: `kioskero1`
   - Password: `Pass123`
   - Tipo: Promotor / Kioskero
3. Crea ecopuntos:
   - Usuario: `ecopunto_centro`
   - Password: `Pass123`
   - Tipo: Ecopunto
4. Las cuentas aparecen en "Cuentas Activas"

---

### 2️⃣ Como Usuario Final

**Registro:**
- URL: `http://localhost:3000/register`
- Completa el formulario de registro
- Confirma tu email (revisa bandeja de entrada)

**Login:**
- URL: `http://localhost:3000/login`
- Ingresa email y password

**Generar Token de Reciclaje:**
1. En el dashboard, toca el botón "Canjear"
2. Selecciona el material:
   - Aceite Vegetal Usado (+20 puntos)
   - Lata de Aluminio (+1 punto)
   - Botella de Plástico (+1 punto)
3. Se genera un código de 6 dígitos (Ej: **A3B9K2**)
4. El código es válido por 15 minutos
5. Anota o recuerda el código

**Ir al Kiosco/Ecopunto:**
1. Dirígete al punto de reciclaje
2. Entrega tu material (lata, botella o aceite)
3. Muestra el código al promotor

---

### 3️⃣ Como Promotor/Ecopunto

**Login:**
- URL: `http://localhost:3000/promotor/login`
- Usuario: `kioskero1` (o el que creó el admin)
- Password: `Pass123` (o la que configuró el admin)

**Validar Token:**
1. El usuario te muestra su código (Ej: **A3B9K2**)
2. Verifica que entregó el material correcto
3. En tu dashboard, ingresa el código en el campo grande
4. Click "Validar y Acreditar Puntos"
5. ✅ Los puntos se acreditan automáticamente al usuario
6. Ves la confirmación con:
   - Nombre del usuario
   - Material entregado
   - Puntos acreditados

---

## Ejemplo Completo Paso a Paso

### Escenario: Usuario recicla una lata

**1. Usuario (Juan):**
```
1. Abre http://localhost:3000/login
2. Inicia sesión
3. Click en "Canjear"
4. Selecciona "Lata de Aluminio"
5. Se genera código: X9Y3Z1
6. Va al kiosco con su lata
```

**2. Promotor (María):**
```
1. Abre http://localhost:3000/promotor/login
2. Inicia sesión como kioskero1
3. Recibe la lata de Juan
4. Juan muestra el código: X9Y3Z1
5. María ingresa X9Y3Z1 en su dashboard
6. Click "Validar y Acreditar Puntos"
```

**3. Sistema:**
```
✓ Token X9Y3Z1 es válido
✓ No ha expirado (< 15 minutos)
✓ No ha sido usado antes
✓ Acredita +1 punto a Juan
✓ Marca token como validado
✓ Muestra confirmación a María
```

**4. Juan:**
```
✓ Sus puntos aumentan de 10 → 11
✓ Puede ver el nuevo total en su dashboard
```

---

## URLs del Sistema

| Rol | URL | Descripción |
|-----|-----|-------------|
| **Admin** | `/admin/login` | Login de administrador |
| **Admin** | `/admin/dashboard` | Panel de gestión de cuentas |
| **Promotor** | `/promotor/login` | Login de promotor/ecopunto |
| **Promotor** | `/promotor/dashboard` | Panel de validación de tokens |
| **Usuario** | `/register` | Registro de nuevo usuario |
| **Usuario** | `/login` | Login de usuario |
| **Usuario** | `/dashboard` | Dashboard del usuario |

---

## Valores de Puntos

| Material | Puntos | Unidad |
|----------|--------|--------|
| Aceite Vegetal Usado | **20** | 1 Litro |
| Lata de Aluminio | **1** | 1 Lata |
| Botella de Plástico | **1** | 1 Botella |

---

## Estructura del Proyecto

```
posadas-recicla/
├── migrations/                    # Scripts SQL de Supabase
│   ├── admin-and-staff-accounts.sql
│   ├── fix-rls-policies.sql
│   ├── create-tokens-system.sql
│   └── diagnose-and-fix-admin.sql
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── login/            # Login de admin
│   │   │   └── dashboard/        # Panel de admin
│   │   ├── promotor/
│   │   │   ├── login/            # Login de promotor
│   │   │   └── dashboard/        # Panel de validación
│   │   ├── dashboard/            # Dashboard de usuario
│   │   └── api/
│   │       ├── admin/staff/      # APIs de gestión de staff
│   │       ├── promotor/auth/    # API de auth de promotor
│   │       └── tokens/           # APIs de tokens
│   │           ├── generate/     # Generar tokens
│   │           └── validate/     # Validar tokens
│   └── supabase/
│       └── types.ts              # Tipos TypeScript
└── docs/                         # Documentación
    ├── ADMIN_PANEL.md
    ├── PROMOTOR_LOGIN.md
    ├── TOKENS_SYSTEM.md
    └── ARREGLO_FINAL.md
```

---

## Checklist de Configuración

Marca cada paso:

- [ ] Ejecuté `admin-and-staff-accounts.sql`
- [ ] Ejecuté `fix-rls-policies.sql`
- [ ] Ejecuté `create-tokens-system.sql`
- [ ] Ejecuté `create-virtual-bin.sql` (NUEVO)
- [ ] Ejecuté `diagnose-and-fix-admin.sql` (con mi email)
- [ ] Creé archivo `.env.local`
- [ ] Agregué `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Ejecuté `npm run dev`
- [ ] Probé login de admin
- [ ] Creé al menos 1 cuenta de promotor
- [ ] Probé login de promotor
- [ ] Probé escanear lata (verifica que se agregue al tacho)
- [ ] Probé generar token como usuario
- [ ] Probé validar token como promotor

---

## Solución Rápida de Problemas

### ❌ Error: "infinite recursion detected"
**Solución:** Ejecuta `fix-rls-policies.sql`

### ❌ Admin no puede login
**Solución:**
1. Verifica que ejecutaste `diagnose-and-fix-admin.sql`
2. Verifica que el email en el script sea correcto
3. Verifica que el email esté confirmado en Supabase

### ❌ Promotor no puede login
**Solución:**
1. Verifica que la cuenta fue creada por el admin
2. Verifica usuario y contraseña (case-sensitive)
3. Verifica que la cuenta esté activa

### ❌ Token no se genera
**Solución:**
1. Ejecuta `create-tokens-system.sql`
2. Verifica `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`
3. Revisa consola del navegador (F12)

### ❌ Token no se puede validar
**Solución:**
1. Verifica que no hayan pasado 15 minutos
2. Verifica que el código sea correcto
3. Verifica que no haya sido usado antes

### ❌ Error: "Error al cargar tacho virtual"
**Solución:**
1. Ejecuta `create-virtual-bin.sql` en Supabase
2. Verifica que la tabla `user_virtual_bin` existe
3. Lee `migrations/README_VIRTUAL_BIN.md` para más detalles
4. Recarga la página después de ejecutar la migración

### ❌ Los materiales no aparecen en color normal en "Canjear"
**Solución:**
1. Escanea al menos una lata en `/dashboard/scan`
2. Verifica que el escaneo se completó sin errores
3. Vuelve a `/dashboard` y abre "Canjear"
4. La lata debería aparecer con opacity-100 (color normal)

---

## Próximos Pasos

Una vez que todo funcione:

1. **Customizar puntos:**
   ```sql
   UPDATE material_points_config
   SET points_per_unit = 25
   WHERE material_type = 'avu';
   ```

2. **Crear más cuentas de promotores** desde el panel de admin

3. **Invitar usuarios** a registrarse en la app

4. **Monitorear validaciones:**
   ```sql
   SELECT COUNT(*) FROM recycling_tokens WHERE status = 'validated';
   ```

---

## Documentación Completa

- **Admin Panel:** `docs/ADMIN_PANEL.md`
- **Sistema de Tokens:** `docs/TOKENS_SYSTEM.md`
- **Login de Promotores:** `docs/PROMOTOR_LOGIN.md`
- **Arreglo de RLS:** `docs/ARREGLO_FINAL.md`

---

**¡Listo para reciclar!** 🌱♻️
