# Arquitectura del Sistema - VerdeScan

Este documento describe la arquitectura completa de VerdeScan, una Progressive Web App para gestión de reciclaje en Posadas.

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura Frontend](#arquitectura-frontend)
- [Arquitectura Backend](#arquitectura-backend)
- [Flujos de Datos](#flujos-de-datos)
- [Seguridad](#seguridad)
- [Performance](#performance)
- [Escalabilidad](#escalabilidad)

---

## Visión General

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (PWA)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Next.js 15 + React 19 + TypeScript       │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │   Tailwind CSS + ShadCN/UI + Lucide Icons  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │        Service Worker (next-pwa)           │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                    WebSocket (Realtime)
                    REST API (HTTP)
                           │
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Supabase)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │         PostgreSQL Database + RLS                 │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │   Auth (OAuth + Email/Password)            │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │   Realtime (WebSocket)                     │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │   Storage (Imágenes, Assets)               │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                      (API Call)
                           │
┌─────────────────────────────────────────────────────────┐
│              SERVICIOS EXTERNOS                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Google Gemini 2.5 Flash (IA)                   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Google OAuth                                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Características Arquitecturales

1. **Progressive Web App (PWA)**
   - Instalable en dispositivos móviles y desktop
   - Funciona offline con Service Worker
   - Actualización en background

2. **Server-Side Rendering (SSR)**
   - Next.js App Router con Server Components
   - Mejor SEO y tiempo de carga inicial

3. **Real-time Sync**
   - Supabase Realtime con WebSockets
   - Sincronización instantánea del tacho virtual

4. **Edge-First**
   - Vercel Edge Functions para API routes
   - CDN global para assets estáticos

---

## Arquitectura Frontend

### Estructura de Carpetas

```
src/
├── app/                     # App Router (Next.js 15)
│   ├── (auth)/              # Grupo de rutas públicas
│   ├── dashboard/           # Dashboard de usuarios
│   ├── admin/               # Panel de administración
│   ├── promotor/            # Panel de promotores
│   ├── api/                 # API Routes
│   │   └── recycling-tip/   # Endpoint de IA
│   └── layout.tsx           # Layout raíz
│
├── components/              # Componentes reutilizables
│   ├── dashboard/           # Componentes del dashboard
│   └── ui/                  # UI primitives (ShadCN)
│
├── contexts/                # React Contexts
│   └── AuthContext.tsx      # Estado global de autenticación
│
├── lib/                     # Lógica de negocio
│   ├── ai/                  # Integración con IA
│   ├── neighborhoods.ts     # Configuración de barrios
│   └── utils.ts             # Utilidades
│
└── supabase/                # Cliente y tipos de Supabase
    ├── client.ts
    └── types.ts
```

### Patrones de Diseño

#### 1. Server Components + Client Components

```typescript
// Server Component (por defecto en app/)
// dashboard/page.tsx
export default async function DashboardPage() {
  // Fetch data en el servidor
  const initialData = await getInitialData()

  return (
    <div>
      {/* Client Component para interactividad */}
      <DashboardClient initialData={initialData} />
    </div>
  )
}

// Client Component
'use client'
export function DashboardClient({ initialData }) {
  const [data, setData] = useState(initialData)
  // Lógica de UI interactiva
}
```

#### 2. Composición de Componentes

```typescript
// Usando ShadCN/UI con composición
<Card>
  <CardHeader>
    <CardTitle>Tacho Virtual</CardTitle>
  </CardHeader>
  <CardContent>
    <VirtualBinDisplay />
  </CardContent>
</Card>
```

#### 3. Context + Hooks

```typescript
// AuthContext.tsx
export const AuthContext = createContext<AuthContextType>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

// Uso en componentes
function MyComponent() {
  const { user, signOut } = useAuth()
  // ...
}
```

### Gestión de Estado

1. **Estado del Servidor**: React Server Components
2. **Estado Global**: React Context (AuthContext)
3. **Estado Local**: useState, useReducer
4. **Estado en Caché**: Supabase Client con caché automático
5. **Estado Realtime**: Supabase Realtime subscriptions

### Rutas y Navegación

```
/                           → Landing page
/login                      → Login de usuarios
/register                   → Registro de usuarios
/auth/callback              → Callback de OAuth

/dashboard                  → Dashboard principal
/dashboard/scan             → Escaneo de productos
/dashboard/raffles          → Sorteos
/dashboard/leaderboard      → Ranking de barrios

/admin/login                → Login de admin
/admin/dashboard            → Panel de administración

/promotor/login             → Login de promotor
/promotor/dashboard         → Panel de promotor

/api/recycling-tip          → API de consejos de IA
/api/user/virtual-bin       → API del tacho virtual
```

---

## Arquitectura Backend

### Base de Datos (PostgreSQL)

#### Esquema de Tablas

```sql
-- Usuarios (perfil público)
users
  ├── id (UUID) → FK a auth.users
  ├── email
  ├── name
  ├── points (canjeables)
  ├── total_earned_points (históricos)
  ├── neighborhood
  └── role (user | admin)

-- Tacho virtual
user_virtual_bin
  ├── user_id → FK a users
  ├── material_type (avu | lata | botella)
  ├── quantity
  └── last_scanned_at

-- Escaneos
scans
  ├── user_id → FK a users
  ├── qr_code
  ├── points_earned
  ├── material_details
  └── scanned_at

-- Productos escaneables
products
  ├── gtin (código de barras)
  ├── name
  ├── weight (gramos)
  ├── category
  ├── points_per_kg
  └── active

-- Sorteos
raffles
  ├── title
  ├── prize
  ├── ticket_cost
  ├── category
  ├── sponsor
  └── draw_date

-- Tickets de sorteos
raffle_tickets
  ├── user_id → FK a users
  ├── raffle_id → FK a raffles
  └── ticket_number

-- Cuentas staff
staff_accounts
  ├── username
  ├── password_hash
  ├── account_type (promotor | ecopunto)
  └── is_active

-- Tokens OTP
recycling_tokens
  ├── user_id → FK a users
  ├── token_code
  ├── material_type
  ├── points_value
  ├── status (pending | validated | expired)
  └── validated_by → FK a staff_accounts
```

#### Funciones Importantes

```sql
-- Gestión del tacho virtual
add_to_virtual_bin(user_id, material_type, quantity)
remove_from_virtual_bin(user_id, material_type, quantity)
get_total_bin_items(user_id)

-- Rankings
get_neighborhood_rankings()

-- Triggers
handle_new_user()           -- Crea perfil en users
update_updated_at_column()  -- Actualiza timestamps
```

### Row Level Security (RLS)

```sql
-- Ejemplo: Usuarios solo ven sus propios datos
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Admins ven todo
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    auth.uid()::text = id::text
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### Realtime

```typescript
// Suscripción a cambios en el tacho virtual
const channel = supabase
  .channel('user-virtual-bin')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'user_virtual_bin',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Actualizar UI en tiempo real
      refetchVirtualBin()
    }
  )
  .subscribe()
```

---

## Flujos de Datos

### 1. Flujo de Escaneo de Productos

```
┌─────────────┐
│   Usuario   │
│  escanea    │
│  código     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  @zxing/library     │
│  detecta código     │
│  7790139000462      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Valida producto            │
│  en catálogo (config local) │
└──────┬──────────────────────┘
       │
       ▼
┌───────────────────────────────────┐
│  POST /api/user/virtual-bin/add   │
│  { material_type, quantity }      │
└──────┬────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Verifica autenticación     │
│  (Supabase Auth)            │
└──────┬──────────────────────┘
       │
       ▼
┌───────────────────────────────┐
│  Llama función PostgreSQL    │
│  add_to_virtual_bin()         │
└──────┬────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  UPSERT en user_virtual_bin  │
│  (incrementa quantity)       │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Supabase Realtime           │
│  emite evento de cambio      │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Dashboard escucha evento    │
│  y actualiza UI              │
└──────────────────────────────┘
```

### 2. Flujo de Autenticación

```
┌─────────────────────┐
│  Usuario hace       │
│  login              │
└──────┬──────────────┘
       │
       ├───── Opción 1: Email/Password ─────┐
       │                                      │
       │                                      ▼
       │                            ┌──────────────────┐
       │                            │  Supabase Auth   │
       │                            │  verifica        │
       │                            └────────┬─────────┘
       │                                      │
       ├───── Opción 2: Google OAuth ────────┤
       │                                      │
       ▼                                      ▼
┌──────────────────┐            ┌────────────────────┐
│  Google OAuth    │            │  Crea sesión       │
│  (redirect)      │            │  JWT token         │
└──────┬───────────┘            └────────┬───────────┘
       │                                  │
       │                                  ▼
       │                        ┌────────────────────┐
       │                        │  Trigger:          │
       │                        │  handle_new_user() │
       │                        └────────┬───────────┘
       │                                  │
       └──────────────────────────────────┤
                                          │
                                          ▼
                              ┌────────────────────┐
                              │  Crea perfil en    │
                              │  tabla users       │
                              └────────┬───────────┘
                                       │
                                       ▼
                              ┌────────────────────┐
                              │  Redirect a        │
                              │  /dashboard        │
                              └────────────────────┘
```

### 3. Flujo de Consejos de IA

```
┌─────────────────────┐
│  Usuario describe   │
│  su actividad       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────┐
│  POST /api/recycling-tip    │
│  { activity, neighborhood } │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Valida entrada             │
│  (mínimo 10 caracteres)     │
└──────┬──────────────────────┘
       │
       ▼
┌───────────────────────────────┐
│  Construye prompt con:        │
│  - Actividad del usuario      │
│  - Barrio                     │
│  - Puntos acumulados          │
└──────┬────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Llama Google Gemini 2.5     │
│  Flash API                   │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Recibe respuesta de IA      │
│  (consejo personalizado)     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Retorna JSON al frontend    │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Muestra consejo en UI       │
└──────────────────────────────┘
```

### 4. Flujo de Ranking de Barrios

```
┌─────────────────────┐
│  Usuario ve         │
│  /dashboard/        │
│  leaderboard        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Llama función PostgreSQL   │
│  get_neighborhood_rankings()│
└──────┬──────────────────────┘
       │
       ▼
┌───────────────────────────────┐
│  Agrupa por neighborhood      │
│  SUM(total_earned_points)     │
│  (NO usa points canjeables)   │
└──────┬────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Calcula:                    │
│  - Total puntos              │
│  - Cantidad usuarios         │
│  - Promedio por usuario      │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Ordena DESC por total       │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Retorna ranking al frontend │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Muestra tabla con:          │
│  - Posición                  │
│  - Barrio                    │
│  - Puntos                    │
│  - Usuarios                  │
└──────────────────────────────┘
```

---

## Seguridad

### 1. Autenticación

- **Supabase Auth**: Gestión de sesiones con JWT
- **OAuth 2.0**: Google Sign-In
- **Cookies HTTP-only**: Tokens seguros
- **Refresh tokens**: Renovación automática de sesión

### 2. Autorización (RLS)

```sql
-- Ejemplo: Solo el owner o admin puede modificar
CREATE POLICY "Users or admins can update"
  ON user_virtual_bin
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 3. Validación de Entrada

```typescript
// Validación en API route
if (typeof activity !== 'string' || activity.length < 10) {
  return NextResponse.json(
    { error: 'Actividad inválida' },
    { status: 400 }
  )
}
```

### 4. Rate Limiting

- **Supabase**: 100 req/s por IP en plan gratuito
- **Vercel**: Rate limiting por función edge

### 5. Variables de Entorno

```bash
# Nunca en el repositorio
.env.local

# Solo variables públicas en NEXT_PUBLIC_*
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Variables secretas sin prefijo
GOOGLE_API_KEY=...
```

---

## Performance

### 1. Optimizaciones Frontend

#### Server-Side Rendering
```typescript
// Fetch en el servidor, no en el cliente
export default async function Page() {
  const data = await fetchData()
  return <Component data={data} />
}
```

#### Code Splitting
```typescript
// Lazy loading de componentes
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false
})
```

#### Image Optimization
```typescript
import Image from 'next/image'

<Image
  src="/icon.png"
  alt="Icon"
  width={512}
  height={512}
  priority
/>
```

### 2. Caché Strategies (Service Worker)

```javascript
// Google Fonts: Cache primero
{
  urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
  handler: "CacheFirst",
  options: {
    cacheName: "google-fonts",
    expiration: {
      maxEntries: 4,
      maxAgeSeconds: 365 * 24 * 60 * 60 // 1 año
    }
  }
}

// API: Red primero con fallback
{
  urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
  handler: "NetworkFirst",
  options: {
    cacheName: "supabase-api",
    networkTimeoutSeconds: 10
  }
}
```

### 3. Database Performance

```sql
-- Índices para búsquedas rápidas
CREATE INDEX idx_users_neighborhood ON users(neighborhood);
CREATE INDEX idx_users_total_earned_points ON users(total_earned_points DESC);
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_scanned_at ON scans(scanned_at DESC);
```

### 4. Bundle Optimization

```json
// next.config.ts implícito
{
  "swcMinify": true,
  "compiler": {
    "removeConsole": {
      "exclude": ["error", "warn"]
    }
  }
}
```

---

## Escalabilidad

### Horizontal Scaling

1. **Frontend**:
   - Vercel Edge Network (CDN global)
   - Serverless Functions (auto-scaling)

2. **Backend**:
   - Supabase maneja escalado automático
   - Connection pooling para PostgreSQL
   - Read replicas (plan Pro)

### Vertical Scaling

- **Base de datos**: Upgrade plan de Supabase
- **Funciones**: Aumentar memoria/timeout en Vercel

### Monitoreo

```typescript
// Logging de errores
console.error('[Error]', error)

// Métricas en Vercel Analytics
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Límites y Consideraciones

| Recurso | Límite (Free Tier) | Plan Pro |
|---------|-------------------|----------|
| Supabase DB | 500 MB | 8 GB+ |
| Supabase Storage | 1 GB | 100 GB+ |
| Supabase Requests | 50K/mes | Ilimitado |
| Vercel Functions | 100 GB-hrs | 1000 GB-hrs |
| Vercel Bandwidth | 100 GB | 1 TB |

---

## Conclusión

VerdeScan está construido con una arquitectura moderna, escalable y segura que aprovecha:

- **Next.js 15** para SSR y PWA
- **Supabase** para backend completo con Realtime
- **TypeScript** para type safety
- **Tailwind + ShadCN** para UI consistente
- **Google Gemini** para IA generativa

Esta arquitectura permite:
- ✅ Alta performance (PWA + SSR + Caché)
- ✅ Seguridad robusta (RLS + Auth + Validación)
- ✅ Escalabilidad (Serverless + Auto-scaling)
- ✅ Developer Experience (TypeScript + Modern Stack)
- ✅ User Experience (Realtime + Offline + Responsive)

---

**Última actualización**: 2025-10-28
**Versión**: 1.0.0
