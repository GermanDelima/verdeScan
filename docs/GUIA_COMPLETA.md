# Guía Completa - VerdeScan Posadas Recicla

Guía paso a paso para desarrolladores que quieren entender, instalar y contribuir al proyecto.

---

## Índice

1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Características Principales](#características-principales)
3. [Stack Tecnológico Completo](#stack-tecnológico-completo)
4. [Instalación desde Cero](#instalación-desde-cero)
5. [Configuración Avanzada](#configuración-avanzada)
6. [Desarrollo](#desarrollo)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [Contribuir](#contribuir)

---

## Resumen del Proyecto

**VerdeScan** es una Progressive Web App (PWA) de gamificación de reciclaje para la ciudad de Posadas, Misiones, Argentina.

### Objetivo

Incentivar el reciclaje mediante:
- Sistema de puntos canjeables
- Ranking de barrios
- Sorteos y premios
- Consejos personalizados con IA

### Usuarios

1. **Ciudadanos**: Escanean productos, acumulan puntos, participan en sorteos
2. **Administradores**: Gestionan usuarios, productos, sorteos y staff
3. **Promotores**: Validan tokens OTP en la comunidad
4. **Ecopuntos**: Puntos de recolección autorizados

---

## Características Principales

### 1. Sistema de Tacho Virtual

Los usuarios escanean códigos de barras de productos reciclables (latas, botellas, aceite vegetal usado) y estos se agregan a su "tacho virtual".

**Flujo:**
```
Escanear código → Validar producto → Agregar a tacho virtual → Sincronización Realtime
```

**Materiales soportados:**
- **AVU**: Aceite Vegetal Usado (20 pts/litro)
- **Latas**: Aluminio (1 pt/unidad)
- **Botellas**: Plástico PET (1 pt/unidad)

### 2. Sistema Dual de Puntos

**Problema resuelto**: Los gastos (sorteos) no deben afectar el ranking de barrios.

**Solución**: Dos columnas separadas:
- `points`: Puntos canjeables (aumenta y disminuye)
- `total_earned_points`: Puntos históricos (solo aumenta, determina ranking)

```typescript
// Al ganar puntos
UPDATE users SET
  points = points + 10,
  total_earned_points = total_earned_points + 10

// Al gastar puntos
UPDATE users SET
  points = points - 100
  // total_earned_points NO cambia
```

### 3. Progressive Web App (PWA)

**Características:**
- ✅ Instalable como app nativa
- ✅ Funciona offline con Service Worker
- ✅ Shortcuts de app (Escanear, Dashboard)
- ✅ Caché inteligente
- ✅ Manifest.json completo
- ✅ Responsive design (mobile-first)

**Estrategias de caché:**
- Google Fonts: CacheFirst (365 días)
- Supabase API: NetworkFirst (24h)
- Imágenes: CacheFirst (24h)
- JS/CSS: StaleWhileRevalidate (24h)

### 4. Realtime Sync

Supabase Realtime sincroniza el tacho virtual instantáneamente entre dispositivos.

```typescript
const channel = supabase
  .channel('user-virtual-bin')
  .on('postgres_changes', {
    event: '*',
    table: 'user_virtual_bin'
  }, handleChange)
  .subscribe()
```

### 5. Inteligencia Artificial

Google Gemini 2.5 Flash genera consejos personalizados de reciclaje basados en:
- Barrio del usuario
- Actividad reciente
- Puntos acumulados

```typescript
POST /api/recycling-tip
{
  "activity": "Separé latas y botellas esta semana",
  "neighborhood": "Villa Urquiza"
}
```

---

## Stack Tecnológico Completo

### Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Next.js** | 15.5.4 | Framework React con App Router |
| **React** | 19.2.0 | Biblioteca UI |
| **TypeScript** | 5.9.3 | Tipado estático |
| **Tailwind CSS** | 3.4.18 | Framework CSS |
| **next-pwa** | 5.6.0 | PWA support |

### UI Components

| Librería | Propósito |
|---------|-----------|
| **ShadCN/UI** | Sistema de componentes |
| **Radix UI** | Primitivos accesibles |
| **Lucide React** | Iconos |
| **class-variance-authority** | Variantes de componentes |
| **tailwind-merge** | Merge de clases Tailwind |
| **clsx** | Concatenación de clases |

### Backend

| Tecnología | Propósito |
|-----------|-----------|
| **Supabase** | BaaS completo |
| **PostgreSQL** | Base de datos |
| **Row Level Security** | Seguridad a nivel de fila |
| **Realtime** | WebSockets para sync |

### Herramientas

| Librería | Propósito |
|---------|-----------|
| **@zxing/library** | Escaneo de códigos de barras/QR |
| **recharts** | Gráficos |
| **@google/generative-ai** | API de Google Gemini |

---

## Instalación desde Cero

### Prerrequisitos

```bash
# Node.js 18 o superior
node --version
# v18.0.0 o mayor

# npm 9 o superior
npm --version
# 9.0.0 o mayor

# Git
git --version
```

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/posadas-recicla.git
cd posadas-recicla
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

**Tiempo estimado**: 2-5 minutos

**Dependencias principales instaladas:**
- next (15.5.4)
- react (19.2.0)
- @supabase/supabase-js (2.74.0)
- @google/generative-ai (0.24.1)
- tailwindcss (3.4.18)
- ... y más (ver package.json)

### Paso 3: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Click en "New Project"
3. Completa:
   - **Name**: `verdescan-posadas`
   - **Database Password**: (genera uno seguro)
   - **Region**: `South America (São Paulo)`
4. Click en "Create new project"
5. **Espera 2-3 minutos** mientras se aprovisiona

### Paso 4: Configurar Variables de Entorno

```bash
# Crea archivo .env.local
cp .env.example .env.local
```

Edita `.env.local`:

```env
# Supabase (REQUERIDO)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google AI (OPCIONAL)
GOOGLE_API_KEY=AIzaSy...
```

**Obtener credenciales de Supabase:**
1. En tu proyecto Supabase, ve a **Settings** > **API**
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Obtener API Key de Google AI (opcional):**
1. Ve a [ai.google.dev](https://ai.google.dev)
2. Click en "Get API Key"
3. Crea un proyecto o usa uno existente
4. Copia la API key

### Paso 5: Configurar Base de Datos

Ejecuta los siguientes scripts **EN ORDEN** en Supabase SQL Editor:

#### 5.1 Schema Base

```bash
# En Supabase:
# 1. Ve a SQL Editor
# 2. Click en "New Query"
# 3. Copia y pega el contenido de:
migrations/schema-consolidated.sql

# 4. Click en "Run" o Ctrl+Enter
```

**Qué crea:**
- Tablas: users, scans, raffles, raffle_tickets
- Funciones: handle_new_user, get_neighborhood_rankings
- Triggers: on_auth_user_created
- Políticas RLS

#### 5.2 Sistema de Roles y Staff

```bash
migrations/admin-and-staff-accounts.sql
```

**Qué crea:**
- Columna `role` en users
- Tabla `staff_accounts`
- Políticas RLS para admins
- Función `is_admin()`

#### 5.3 Tacho Virtual

```bash
migrations/SETUP_TACHO_VIRTUAL.sql
```

**Qué crea:**
- Tabla `user_virtual_bin`
- Funciones: add_to_virtual_bin, remove_from_virtual_bin, get_total_bin_items
- Políticas RLS
- Habilita Realtime

#### 5.4 Sistema de Tokens OTP

```bash
migrations/create-tokens-system.sql
```

**Qué crea:**
- Tabla `recycling_tokens`
- Tabla `material_points_config`
- Función `generate_token_code()`

#### 5.5 Catálogo de Productos

```bash
migrations/create-products-table.sql
```

**Qué crea:**
- Tabla `products`
- Producto inicial: Lata de Cerveza 355ml

### Paso 6: Crear Usuario Administrador

**Opción A: Usuario Existente**

Si ya tienes un usuario registrado:

```sql
-- En Supabase SQL Editor
UPDATE users SET role = 'admin' WHERE email = 'tu-email@example.com';
```

**Opción B: Crear Nuevo Admin**

1. Registra un usuario en la app (`/register`)
2. Ejecuta el UPDATE anterior
3. O usa el script `migrations/diagnose-and-fix-admin.sql`

### Paso 7: Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

**Primera ejecución:**
- Verás la landing page
- Click en "Iniciar Sesión" o "Registrarse"
- Crea tu usuario
- Ve al dashboard

---

## Configuración Avanzada

### OAuth con Google

1. **Crear proyecto en Google Cloud Console**
   - Ve a [console.cloud.google.com](https://console.cloud.google.com)
   - Crea un proyecto nuevo: "VerdeScan"

2. **Habilitar Google+ API**
   - Ve a "APIs & Services" > "Library"
   - Busca "Google+ API"
   - Click en "Enable"

3. **Crear credenciales OAuth 2.0**
   - Ve a "APIs & Services" > "Credentials"
   - Click en "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "VerdeScan Web"
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/auth/callback`
     - Production: `https://tu-dominio.com/auth/callback`

4. **Configurar en Supabase**
   - Ve a Supabase Dashboard > Authentication > Providers
   - Habilita "Google"
   - Ingresa Client ID y Client Secret
   - Copia la URL de callback y agrégala en Google Cloud Console

5. **Probar**
   - Ve a `/login`
   - Click en "Continuar con Google"
   - Autoriza la app
   - Deberías ser redirigido al dashboard

Ver guía completa: `docs/GOOGLE_OAUTH_SETUP.md`

### Configurar Barrios de Posadas

Edita `src/lib/neighborhoods.ts`:

```typescript
export const NEIGHBORHOODS = [
  // Centro
  "Centro",
  "A-3-2",

  // Norte
  "Villa Urquiza",
  "Villa Sarita",
  "Villa Blosset",

  // Sur
  "Villa Cabello",
  "Itaembé Guazú",
  "Itaembé Miní",

  // ... agregar más barrios
]
```

### Personalizar Colores

Edita `src/app/globals.css`:

```css
:root {
  --primary: 142 76% 36%;        /* Verde reciclaje */
  --primary-foreground: 0 0% 100%;
  --secondary: 199 89% 48%;      /* Azul secundario */
  --secondary-foreground: 0 0% 100%;

  /* Personaliza otros colores */
  --accent: 142 76% 36%;
  --destructive: 0 84% 60%;
}
```

### Configurar Puntos por Material

```sql
-- En Supabase SQL Editor
SELECT * FROM material_points_config;

-- Actualizar valores
UPDATE material_points_config
SET points_per_unit = 25
WHERE material_type = 'lata';
```

---

## Desarrollo

### Estructura de Rutas

```
src/app/
├── page.tsx                    # Landing page (/)
├── login/page.tsx              # Login (/login)
├── register/page.tsx           # Registro (/register)
│
├── dashboard/                  # Dashboard de usuarios
│   ├── page.tsx                # Dashboard principal
│   ├── scan/page.tsx           # Escaneo de productos
│   ├── raffles/page.tsx        # Sorteos
│   ├── leaderboard/page.tsx    # Ranking
│   └── validate/page.tsx       # Validación de códigos
│
├── admin/                      # Panel de admin
│   ├── login/page.tsx
│   └── dashboard/page.tsx
│
├── promotor/                   # Panel de promotor
│   ├── login/page.tsx
│   └── dashboard/page.tsx
│
└── api/                        # API Routes
    ├── recycling-tip/route.ts
    └── user/virtual-bin/
        ├── add/route.ts
        └── route.ts
```

### Crear un Nuevo Componente

```bash
# Estructura recomendada
src/components/
├── dashboard/           # Componentes específicos del dashboard
│   └── mi-componente.tsx
└── ui/                  # Componentes UI reutilizables (ShadCN)
    └── mi-ui-component.tsx
```

**Ejemplo:**

```typescript
// src/components/dashboard/mi-componente.tsx
'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function MiComponente() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Componente</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click Me</Button>
      </CardContent>
    </Card>
  )
}
```

### Agregar un Nuevo Producto Escaneable

```sql
-- En Supabase SQL Editor
INSERT INTO products (gtin, name, weight, category, points_per_kg, active)
VALUES (
  '7790123456789',
  'Botella Coca-Cola 2L',
  65.0,
  'Plástico',
  30,
  true
);
```

### Agregar un Nuevo Sorteo

```sql
INSERT INTO raffles (
  title,
  description,
  prize,
  ticket_cost,
  draw_date,
  category,
  sponsor,
  status
)
VALUES (
  'Sorteo Semanal - Kit Eco',
  'Kit de productos sustentables para el hogar',
  'Kit con 5 productos ecológicos',
  100,
  '2025-11-15 18:00:00-03',
  'eco',
  'EcoTienda Posadas',
  'active'
);
```

### Debugging

```typescript
// En componentes cliente
'use client'

export function MyComponent() {
  console.log('[DEBUG] Component rendered')

  useEffect(() => {
    console.log('[DEBUG] Effect ran')
  }, [])

  // ...
}
```

**Ver logs:**
- Frontend: Consola del navegador (F12)
- API Routes: Terminal donde corre `npm run dev`
- Supabase: Logs en Supabase Dashboard

---

## Testing

### Testing Manual

1. **Registro de Usuario**
   - Ve a `/register`
   - Completa todos los campos
   - Selecciona un barrio
   - Click en "Registrarse"
   - Verifica redirección a `/dashboard`

2. **Escaneo de Producto**
   - Ve a `/dashboard/scan`
   - Permite acceso a la cámara
   - Escanea código: `7790139000462`
   - Verifica mensaje de éxito
   - Ve a `/dashboard`
   - Verifica que el contador aumentó

3. **Ranking de Barrios**
   - Ve a `/dashboard/leaderboard`
   - Verifica que tu barrio aparece
   - Verifica que los puntos son correctos

4. **Sorteos**
   - Ve a `/dashboard/raffles`
   - Selecciona un sorteo
   - Compra boletos
   - Verifica que tus puntos disminuyeron
   - Verifica que tienes boletos asignados

### Testing de Funcionalidades Realtime

```typescript
// Abre dos navegadores/tabs
// Tab 1: Dashboard (/dashboard)
// Tab 2: Scan (/dashboard/scan)

// En Tab 2: Escanea un producto
// En Tab 1: Verifica que el contador se actualiza automáticamente
```

### Testing de PWA

```bash
# 1. Build de producción
npm run build

# 2. Iniciar servidor
npm run start

# 3. Abrir en Chrome
# http://localhost:3000

# 4. Verificar:
# - DevTools > Application > Manifest
# - DevTools > Application > Service Workers
# - Ícono de instalación en la barra de direcciones

# 5. Instalar la app
# Click en el ícono de instalación

# 6. Probar offline
# DevTools > Network > Offline
# Recarga la página
# Verifica que funciona
```

---

## Deployment

### Opción 1: Vercel (Recomendado)

1. **Push a GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Importar en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "New Project"
   - Importa tu repositorio de GitHub
   - Vercel detecta Next.js automáticamente

3. **Configurar Variables de Entorno**
   - En el dashboard de Vercel:
   - Settings > Environment Variables
   - Agrega:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `GOOGLE_API_KEY`

4. **Desplegar**
   - Click en "Deploy"
   - Espera 2-3 minutos
   - Tu app estará en `https://tu-proyecto.vercel.app`

5. **Dominio Personalizado**
   - Settings > Domains
   - Agrega tu dominio
   - Configura DNS según instrucciones

### Opción 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Opción 3: Servidor Propio (VPS)

```bash
# Build
npm run build

# Copiar archivos al servidor
scp -r .next package.json user@servidor:/var/www/verdescan/

# En el servidor
cd /var/www/verdescan
npm install --production
npm run start

# Configurar Nginx como reverse proxy
# Ver guía completa en docs/
```

---

## Troubleshooting

### Problema: El tacho virtual no se actualiza

**Síntomas:**
- Escaneo exitoso
- Contador no aumenta

**Solución:**
1. Ejecuta `migrations/diagnostico-tacho-virtual.sql`
2. Verifica que las 3 funciones existen
3. Verifica que Realtime está habilitado
4. Ver guía completa: `SOLUCION_TACHO_VIRTUAL.md`

### Problema: No puedo hacer login como admin

**Síntomas:**
- Error "No autorizado"
- No puedo acceder a `/admin/dashboard`

**Solución:**
```sql
-- Verifica tu rol
SELECT email, role FROM users WHERE email = 'tu-email@example.com';

-- Si no es 'admin', actualiza:
UPDATE users SET role = 'admin' WHERE email = 'tu-email@example.com';
```

Ver guía completa: `SOLUCION_ADMIN.md`

### Problema: El ranking muestra 0 en todos los barrios

**Síntomas:**
- `/dashboard/leaderboard` muestra 0 puntos

**Solución:**
1. Verifica que los usuarios tienen barrio asignado:
   ```sql
   SELECT email, neighborhood FROM users WHERE neighborhood IS NULL;
   ```
2. Ejecuta `migrations/supabase-update-existing-users.sql`
3. Ver guía: `docs/SOLUCION-RANKING-BARRIOS.md`

### Problema: Los gastos afectan el ranking

**Síntomas:**
- Compro boletos de sorteo
- El ranking de mi barrio disminuye

**Verificación:**
```sql
-- Verifica que usa total_earned_points
SELECT * FROM get_neighborhood_rankings();
```

**Solución:**
- Ejecuta `migrations/supabase-fix-ranking-points.sql`
- Ver guía: `docs/SOLUCION-PUNTOS-RANKING.md`

### Problema: Service Worker no se actualiza

**Síntomas:**
- Hago cambios
- No se reflejan en producción

**Solución:**
```bash
# 1. Desregistrar Service Worker
# DevTools > Application > Service Workers > Unregister

# 2. Limpiar caché
# DevTools > Application > Clear storage

# 3. Hard refresh
# Ctrl + Shift + R (Windows/Linux)
# Cmd + Shift + R (Mac)
```

---

## Contribuir

### Flujo de Contribución

1. **Fork el proyecto**
   ```bash
   # En GitHub, click en "Fork"
   ```

2. **Clonar tu fork**
   ```bash
   git clone https://github.com/tu-usuario/posadas-recicla.git
   cd posadas-recicla
   ```

3. **Crear rama para tu feature**
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```

4. **Hacer cambios y commits**
   ```bash
   git add .
   git commit -m "feat: Descripción del cambio"
   ```

5. **Push a tu fork**
   ```bash
   git push origin feature/nombre-descriptivo
   ```

6. **Crear Pull Request**
   - Ve a tu fork en GitHub
   - Click en "New Pull Request"
   - Describe tus cambios
   - Click en "Create Pull Request"

### Convenciones de Código

- **TypeScript**: Usa tipos estrictos
- **Nombres**: camelCase para variables, PascalCase para componentes
- **Imports**: Organiza y agrupa imports
- **Comentarios**: Escribe en español, claros y concisos

**Ejemplo:**

```typescript
// Bueno ✅
interface UserProfile {
  id: string
  name: string
  points: number
}

export function UserCard({ user }: { user: UserProfile }) {
  // Renderiza el perfil del usuario
  return (
    <Card>
      <CardTitle>{user.name}</CardTitle>
      <p>Puntos: {user.points}</p>
    </Card>
  )
}

// Malo ❌
function card(u) {
  return <div>{u.name}</div>
}
```

### Commits Semánticos

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan funcionalidad)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

**Ejemplos:**
```bash
git commit -m "feat: Agregar filtro por categoría en sorteos"
git commit -m "fix: Corregir actualización de puntos en ranking"
git commit -m "docs: Actualizar guía de instalación"
```

---

## Recursos Adicionales

### Documentación del Proyecto

- **[README.md](../README.md)** - Introducción y guía rápida
- **[ARQUITECTURA.md](ARQUITECTURA.md)** - Arquitectura del sistema
- **[BASE_DE_DATOS.md](BASE_DE_DATOS.md)** - Schema de base de datos
- **[CHANGELOG.md](../CHANGELOG.md)** - Historial de cambios

### Documentación Externa

- **[Next.js Docs](https://nextjs.org/docs)** - Framework
- **[Supabase Docs](https://supabase.com/docs)** - Backend
- **[Tailwind CSS Docs](https://tailwindcss.com/docs)** - Estilos
- **[ShadCN/UI](https://ui.shadcn.com/)** - Componentes
- **[Google AI Docs](https://ai.google.dev/docs)** - Gemini API

### Comunidad

- **GitHub Issues**: Para reportar bugs o solicitar features
- **GitHub Discussions**: Para preguntas y discusiones
- **Pull Requests**: Para contribuciones de código

---

## Licencia

Este proyecto está bajo la Licencia ISC. Ver archivo [LICENSE](../LICENSE) para más detalles.

---

## Contacto

Para preguntas o soporte:
- **GitHub Issues**: Para reportar problemas técnicos
- **Email**: Para consultas comerciales o privadas

---

**Última actualización**: 2025-10-28
**Versión de la guía**: 1.0.0
**Autor**: Equipo VerdeScan

---

Hecho con 💚 para un Posadas más verde y sustentable
