# VerdeScan - Posadas Recicla

Una **Progressive Web App (PWA)** moderna diseñada para incentivar la economía circular mediante la recompensa por el correcto reciclaje de envases ligeros y aceite de cocina usado (AVU). Diseño UX responsive adaptado a dispositivos móviles y desktop.

IMPACTO REAL
---
Si solo 1000 personas en Posadas reciclan 1 lata por día...

→ Son 365,000 latas al año

→ Eso equivale a 5,110 kg de aluminio reciclado

→ Se ahorran 485,450 kWh de energía

→ Se evitan 25.55 toneladas de emisiones de CO₂

Eso es equivalente a plantar 1,170 árboles. 🏞

Y si reciclamos aceite vegetal usado

→ 1 litro de AVU contamina 1,000 litros de agua

→ Si 500 familias reciclan 1 litro al mes...

→ Estamos salvando 6 MILLONES de litros de agua al año!

No es solo una app. Es un MOVIMIENTO.
Y vos podés ser parte de esta transformación.

---

## Tabla de Contenidos

- [Características Principales](#características-principales)
- [Cómo Funciona la App](#cómo-funciona-la-app)
- [Tecnologías y Stack](#tecnologías-y-stack)
- [Sistema de Roles e Interfaces](#sistema-de-roles-e-interfaces)
- [Base de Datos](#base-de-datos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Scripts Disponibles](#scripts-disponibles)
- [Documentación](#documentación)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Características Principales

### Sistema de Reciclaje Virtual

- **Tacho Virtual**: Escanea códigos de barras de productos reciclables (latas, botellas, AVU)
- **Sistema de Tokens OTP**: Genera un token único de 6 caracteres válido por 15 minutos para validar tu reciclaje en kioscos y ecopuntos
- **Catálogo de Productos**: Base de datos de productos escaneables con peso y valor en puntos
- **Actualización en Tiempo Real**: Supabase Realtime sincroniza el tacho virtual instantáneamente

### Sistema de Puntos Dual

- **Puntos Canjeables** (`points`): Puntos disponibles para gastar en recompensas, sorteos y cargas SUBE
- **Puntos Históricos** (`total_earned_points`): Total acumulado que determina el ranking (nunca disminuye)
- **Separación Transparente**: Los gastos no afectan el ranking de barrios

### Sistema de Canje SUBE

- **Canje de Envases Ligeros**: 10 puntos = 2 boletos SUBE (latas y botellas)
- **Canje de AVU**: 20 puntos = 4 boletos SUBE (aceite vegetal usado)
- **Validación en Tiempo Real**: Verifica puntos disponibles antes de procesar
- **Interfaz Intuitiva**: Modal con confirmación y pantalla de éxito personalizada
- **Proceso Transparente**: Muestra tiempo de procesamiento (24-48h) y puntos restantes

### Gamificación

- **Ranking de Barrios**: Competencia amistosa entre barrios de Posadas
- **Sorteos/Rifas**: Sistema completo con categorías (Eco, Comercio Local, Descuentos)
- **Mis Participaciones**: Visualización compacta de sorteos activos donde el usuario tiene tickets
- **Patrocinadores**: Premios de comercios locales
- **Contador Dinámico**: Muestra cantidad real de sorteos disponibles desde la base de datos

### Panel de Promotores

- **Validación de Tokens**: Sistema para validar códigos OTP de usuarios
- **Tanque de AVU**: Visualización del progreso de recolección de aceite (capacidad 200 litros)
  - Barra de progreso con porcentaje en tiempo real
  - Alerta amarilla al 80% de capacidad
  - Alerta verde al 100% con botón "Llamar para Recolección"
- **Contadores de Materiales**:
  - Contador de latas de aluminio validadas
  - Contador de botellas plásticas validadas
  - Resumen visual con iconos y estadísticas
- **Actualización Automática**: Las estadísticas se refrescan después de cada validación

### Panel de Administración

- **Gestión de Usuarios**: Ver, editar roles y gestionar cuentas
- **CRUD de Productos**: Crear, editar y eliminar productos del catálogo escaneable
- **CRUD de Sorteos**: Interfaz completa para gestionar rifas
  - Formulario con todos los campos (título, premio, costo, fecha, categoría, patrocinador)
  - Edición y eliminación de sorteos existentes
  - Estadísticas de participación
  - Manejo de imágenes y estados (activo/completado/cancelado)
- **Gestión de Staff**: Crear cuentas de promotores y ecopuntos
- **Estadísticas Completas**: Dashboard con métricas del sistema

### Inteligencia Artificial (Desactivada)

- **Consejos Personalizados**: Google Gemini 2.5 Flash genera tips de reciclaje
- **Contextual**: Basado en el barrio, actividad reciente y puntos del usuario
- **API Integrada**: Endpoint `/api/recycling-tip` para obtener consejos

### Progressive Web App (PWA)

- **Instalable**: Se puede instalar como app nativa en móviles y desktop
- **Offline-First**: Service Worker con caché inteligente
- **App Shortcuts**: Acceso rápido a escaneo y dashboard
- **Push Ready**: Preparado para notificaciones push
- **Optimizada**: Estrategias de caché para rendimiento óptimo

### Diseño UX Responsive

- **Mobile-First**: Diseñado primero para móviles
- **Adaptativo**: Se ajusta a tablets y desktop perfectamente
- **Tailwind CSS**: Sistema de utilidades para diseño consistente
- **ShadCN/UI**: Componentes accesibles y elegantes
- **Temas**: Colores personalizados para la marca ecológica

---

## Cómo Funciona la App

VerdeScan opera con un sistema de **doble validación** que garantiza la trazabilidad y transparencia del proceso de reciclaje. El objetivo es acreditar **Puntos Oficiales** únicamente por la entrega efectiva de materiales reciclables.

### 1. REGISTRÁ TU MATERIAL (Fase de Preparación)

#### Envases Ligeros (Latas y Botellas)
- **Escaneo desde Casa**: Escaneá el código de barras (GTIN) de tus latas de aluminio o botellas de plástico desde tu hogar
- **Registro Pendiente**: Cada escaneo registra tu intención de reciclar y asigna un peso estimado según nuestra base de datos
- **Puntos Reservados**: Por cada envase escaneado se reserva **1 Punto Oficial**, que se acreditará tras la validación física

#### Aceite Vegetal Usado (AVU)
- **Recolección en Envases de 1 Litro**: Los kioscos participantes te proveerán envases retornables de 1 litro para facilitar el acopio
- **Intercambio de Envases**: Al entregar un litro lleno, recibís otro envase vacío para mantener la trazabilidad
- **Puntos Reservados**: Por cada litro de AVU entregado, acumularás **20 Puntos Oficiales**

> **Importante**: En esta fase, los puntos están reservados pero NO acreditados. La acreditación solo ocurre tras la validación física en el Punto de Recogida.

### 2. VALIDÁ TU ENTREGA (Fase de Validación Asistida)

#### Generación del Token Único (OTP)
- Al llegar al Kiosco o Ecopunto, el Usuario toca en la app **canjear puntos**
- La app generará un **Token Único (OTP)** de 6 caracteres válido por **15 minutos**
- Este token es de un solo uso y se invalida automáticamente tras su validación

#### Doble Validación Anti-Fraude
1. **Entregás físicamente** tus envases o litro de AVU al referente del kiosco
2. El referente **verifica el material** y su estado
3. El referente **ingresa tu Token Único** en su interfaz de la Plataforma
4. **Sistema valida** y acredita los puntos instantáneamente si todo es correcto

> **Sistema Anti-Fraude**: Este proceso de doble validación previene el fraude, asegurando que solo se recompensen los residuos efectivamente reciclados. Cualquier intento de fraude resultará en la anulación de puntos y suspensión de cuenta.

### 3. CANJEÁ TUS PUNTOS

Una vez acreditados, tus Puntos Oficiales pueden ser canjeados por:

#### a) Carga en Tarjeta SUBE Misionero
- **10 Puntos** (envases ligeros) = **2 boletos SUBE**
- **20 Puntos** (1 litro AVU) = **4 boletos SUBE**
- Ingresá el alias de tu tarjeta SUBE en la app
- Los boletos se acreditan en 24-48 horas
- Mensaje de confirmación personalizado con tu nombre

> **Privacidad**: El alias de tu tarjeta SUBE se procesa de forma segura y solo se utiliza para acreditar el saldo. No se almacena ni se comparte con terceros.

#### b) Boletos para Sorteos y Premios
- **5 Puntos Oficiales** = **1 boleto de sorteo**
- Participá en sorteos de premios patrocinados por comercios locales
- Categorías: Eco, Comercio Local y Descuentos
- Visualizá tus participaciones activas en "Mis Participaciones"

#### c) Donaciones a Proyectos Sociales y Medioambientales
- Convertí tus puntos en apoyo a iniciativas comunitarias
- Contribuí a proyectos que transforman tu ciudad

### 4. COMPETÍ Y TRANSFORMÁ TU BARRIO

- **Ranking en Tiempo Real**: Seguí cómo está posicionado tu barrio en el ranking de reciclaje
- **Impacto Colectivo**: Cada punto suma para el total histórico de tu barrio (los gastos no afectan el ranking)
- **Inspirá a tu Comunidad**: Convertí a tu barrio en un ejemplo de impacto positivo

### Programa de Incentivos para Kioscos Patrocinadores

Los kioscos que participen como **Puntos de Recogida de AVU** y dispongan un tambor de 200 litros para el acopio de aceite vegetal usado recibirán:

- **Descuento en la Boleta de Luz**: Incentivo económico mensual por su contribución ambiental
- **Reconocimiento en la App**: Aparecen destacados como "Kioscos Verdes" en el mapa de ecopuntos
- **Apoyo a la Comunidad**: Se convierten en referentes ecológicos del barrio

---

## Tecnologías y Stack

### Framework y Lenguajes

- **Next.js 15** - Framework React con App Router y Server Components
- **React 19** - Biblioteca UI moderna
- **TypeScript 5.9** - Tipado estático para mayor confiabilidad

### Base de Datos

- **Supabase** - Backend as a Service con PostgreSQL
  - **Realtime**: Sincronización en tiempo real con WebSockets
  - **Row Level Security (RLS)**: Seguridad a nivel de fila
  - **Auth**: Sistema de autenticación integrado con Google OAuth
  - **Edge Functions**: Funciones serverless

### Escaneo de Códigos

- **@zxing/library 0.21.3** - Biblioteca para escanear códigos de barras y QR
  - Soporta múltiples formatos: EAN-13, EAN-8, UPC-A, UPC-E, Code-128, QR
  - Acceso a cámara web y móvil
  - Detección automática y precisa

### Estilos y UI

- **Tailwind CSS 3.4.17** - Framework de utilidades CSS
- **PostCSS 8** - Procesador CSS
- **Autoprefixer 10.4.20** - Prefijos CSS automáticos
- **ShadCN/UI** - Sistema de componentes basado en Radix UI
  - `@radix-ui/react-dialog` - Modales accesibles
  - `@radix-ui/react-select` - Selectores personalizados
  - `@radix-ui/react-label` - Labels accesibles
  - `@radix-ui/react-slot` - Composición de componentes
  - `@radix-ui/react-tabs` - Pestañas accesibles
- **Lucide React 0.469.0** - Iconos modernos y elegantes (6000+ iconos)
- **class-variance-authority** - Manejo de variantes de componentes
- **tailwind-merge** - Fusión inteligente de clases Tailwind
- **tailwindcss-animate** - Animaciones con Tailwind
- **clsx** - Utilidad para concatenar clases CSS

### PWA (Progressive Web App)

- **next-pwa 5.6.0** - Plugin para transformar Next.js en PWA
- **Service Worker**: Caché inteligente con estrategias:
  - CacheFirst para fuentes y recursos estáticos
  - NetworkFirst para API y datos dinámicos
  - StaleWhileRevalidate para JS/CSS
- **Workbox**: Framework de Google para Service Workers
- **Manifest.json**: Configuración de instalación y temas

### Inteligencia Artificial

- **Google Gemini 2.5 Flash** - Modelo de IA generativa
- **@google/generative-ai** - SDK oficial de Google AI
- Generación de consejos personalizados de reciclaje

### Autenticación

- **@supabase/auth-helpers-nextjs** - Helpers para Next.js
- **@supabase/ssr** - Manejo de sesiones server-side
- **Google OAuth** - Autenticación social

### Herramientas de Desarrollo

- **ESLint 9** - Linter para código JavaScript/TypeScript
- **TypeScript 5.9** - Compilador y verificador de tipos

---

## Sistema de Roles e Interfaces

VerdeScan cuenta con tres interfaces especializadas para diferentes tipos de usuarios, cada una optimizada para sus necesidades específicas.

### 1. Panel de Usuario

**Acceso**: `/dashboard`
**Autenticación**: Email/contraseña o Google OAuth

#### Funcionalidades Principales

##### Dashboard Principal
```
┌────────────────────────────────────────────┐
│  VerdeScan                        [Avatar] │
├────────────────────────────────────────────┤
│                                            │
│  ¡Hola, [Nombre]!                          │
│                                            │
│  ┌─────────────┐  ┌─────────────┐         │
│  │   Puntos    │  │   Ranking   │         │
│  │     150     │  │     #12     │         │
│  └─────────────┘  └─────────────┘         │
│                                            │
│  Tacho Virtual                             │
│  ┌────────────────────────────────┐       │
│  │ AVU: 2L  Latas: 5  Botellas: 3 │       │
│  └────────────────────────────────┘       │
│                                            │
│  [Escanear Producto]                       │
│  [Ver Sorteos (3 disponibles)]             │
│  [Cargar SUBE]                             │
│                                            │
└────────────────────────────────────────────┘
```

##### Sistema de Escaneo (`/dashboard/scan`)
- **Scanner integrado** con @zxing/library
- Acceso a cámara frontal o trasera
- Detección automática de códigos de barras y QR
- Feedback visual y sonoro al detectar código
- Búsqueda en catálogo de productos
- Agregar al tacho virtual con animación
- Sincronización en tiempo real con Supabase

##### Sorteos y Participaciones (`/dashboard/raffles`)
- **Lista de sorteos activos** con filtros por categoría
- Tarjetas visuales con imagen, premio, patrocinador
- Compra de boletos con puntos
- **"Mis Participaciones"**: Sección compacta que muestra:
  - Sorteos en los que el usuario tiene tickets
  - Cantidad de tickets por sorteo
  - Días restantes hasta el sorteo
  - Diseño minimalista y claro

##### Canje SUBE (`/dashboard`)
- **Dos opciones de canje**:
  - Tarjeta "Envases Ligeros": 10 puntos = 2 boletos
  - Tarjeta "AVU": 20 puntos = 4 boletos
- Modal de confirmación con:
  - Input para alias de SUBE (validación obligatoria)
  - Resumen del canje (puntos a descontar, boletos a recibir)
  - Verificación de puntos disponibles
- Pantalla de éxito:
  - "¡Felicidades, [Nombre]! Se acreditaron N boletos a tu SUBE"
  - Tiempo de procesamiento: 24-48 horas
  - Puntos restantes actualizados
- **Deducción automática** de puntos desde la base de datos

##### Ranking de Barrios (`/dashboard/leaderboard`)
- Tabla de posiciones de barrios de Posadas
- Usa `total_earned_points` (no se ve afectado por gastos)
- Actualización en tiempo real
- Destaca el barrio del usuario

##### Consejos de IA (`/dashboard`)
- **Google Gemini 2.5 Flash** genera tips personalizados
- Basado en barrio, actividad y puntos
- Endpoint: `/api/recycling-tip`
- Se actualiza periódicamente

#### Tabla: `users`

```sql
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  points INTEGER,           -- Puntos canjeables
  total_earned_points INTEGER, -- Históricos para ranking
  neighborhood TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP
)
```

---

### 2. Panel de Promotor

**Acceso**: `/promotor/login`
**Autenticación**: Username/contraseña (tabla `staff_accounts`)

#### Funcionalidades Principales

##### Dashboard de Promotor
```
┌────────────────────────────────────────────┐
│  Panel Promotor               [@username]  │
├────────────────────────────────────────────┤
│                                            │
│  Validar Token                             │
│  ┌─────────────────────┐                  │
│  │ Código: [______]    │ [Validar]        │
│  └─────────────────────┘                  │
│                                            │
│  Tanque de AVU (200L)                      │
│  ┌──────────────────────────────────┐     │
│  │ ████████░░░░░░░░░░░░░░  45.0%    │     │
│  └──────────────────────────────────┘     │
│  90 litros de 200L                         │
│                                            │
│  ⚠️ Tanque al 80% - Considerar recolección │
│                                            │
│  Contadores de Materiales                  │
│  ┌────────────┐  ┌────────────┐           │
│  │ 🥫 Latas   │  │ 🍾 Botellas │           │
│  │    124     │  │     87     │           │
│  └────────────┘  └────────────┘           │
│                                            │
│  Resumen Total                             │
│  AVU: 90L  |  Latas: 124  |  Botellas: 87 │
│  Total validaciones: 301                   │
│                                            │
└────────────────────────────────────────────┘
```

##### Sistema de Validación de Tokens
- **Input de código**: Campo para ingresar el token OTP de 6 caracteres
- **Validación automática**: Verifica token, usuario y material
- **Feedback visual**: Mensajes de éxito o error claros
- Endpoint: `/api/tokens/validate`
- Proceso:
  1. Verifica que el token existe y está activo
  2. Valida que no está expirado (15 minutos)
  3. Marca token como `validated`
  4. Acredita puntos al usuario
  5. Registra `validated_by` con el staff_id
  6. Actualiza estadísticas del promotor

##### Tanque de AVU (200 Litros)
- **Barra de progreso visual** con gradiente (ámbar a amarillo)
- **Porcentaje en tiempo real** calculado: `(litros / 200) * 100`
- **Sistema de alertas**:
  - **80-99%**: Alerta amarilla "⚠️ Tanque al X% - Considerar recolección"
  - **100%**: Alerta verde "🎯 ¡Tanque Lleno! [Llamar para Recolección]"
- **Contador de litros**: "X litros de 200L"
- Los datos provienen de `/api/tokens/stats?staff_id={id}`

##### Contadores de Materiales
- **Latas de aluminio**: Icono 🥫 + contador
- **Botellas plásticas**: Icono 🍾 + contador
- **Tarjetas visuales** con diseño minimalista
- **Resumen total**: Barra inferior con totales agregados

##### API de Estadísticas (`/api/tokens/stats`)
```typescript
// GET /api/tokens/stats?staff_id={uuid}
// Response:
{
  avu_liters: 90,
  can_count: 124,
  bottle_count: 87,
  total_validations: 301
}
```

El endpoint consulta `recycling_tokens` filtrando por:
- `validated_by = staff_id`
- `status = 'validated'`

Luego cuenta por `material_type`:
- `'avu'` → avu_liters (cada token = 1 litro)
- `'lata'` → can_count
- `'botella'` → bottle_count

##### Actualización Automática
- Las estadísticas se recargan después de cada validación exitosa
- `useEffect` detecta cambios en `validationResult?.success`
- Función `loadStats()` hace fetch al endpoint
- Spinner de carga mientras obtiene datos

#### Tabla: `staff_accounts`

```sql
staff_accounts (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,
  account_type TEXT, -- 'promotor' o 'ecopunto'
  created_by UUID,   -- FK a users (admin)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
)
```

---

### 3. Panel de Administración

**Acceso**: `/admin/login`
**Autenticación**: Email/contraseña (usuarios con `role = 'admin'`)

#### Funcionalidades Principales

##### Dashboard de Admin
```
┌────────────────────────────────────────────┐
│  Panel Admin                      [Avatar] │
├────────────────────────────────────────────┤
│  [Usuarios] [Productos] [Sorteos] [Staff]  │
│                                            │
│  Estadísticas Generales                    │
│  ┌───────────┐ ┌───────────┐ ┌──────────┐ │
│  │ Usuarios  │ │  Puntos   │ │ Sorteos  │ │
│  │   1,247   │ │  45,892   │ │    12    │ │
│  └───────────┘ └───────────┘ └──────────┘ │
│                                            │
│  [Tab activo: Sorteos]                     │
│                                            │
│  Crear Nuevo Sorteo                        │
│  Título: [________________]                │
│  Premio: [________________]                │
│  Costo: [___] puntos                       │
│  Fecha sorteo: [__/__/____]                │
│  Categoría: [Eco ▼]                        │
│  Patrocinador: [________________]          │
│  Imagen URL: [________________]            │
│  Estado: [Activo ▼]                        │
│  [Guardar Sorteo]                          │
│                                            │
│  Sorteos Existentes                        │
│  ┌────────────────────────────────┐       │
│  │ Premio Eco                      │       │
│  │ Categoría: Eco | 5 puntos      │       │
│  │ Sorteo: 15/03/2025             │       │
│  │ [Editar] [Eliminar]            │       │
│  └────────────────────────────────┘       │
│                                            │
└────────────────────────────────────────────┘
```

##### Gestión de Usuarios
- **Lista completa** de usuarios registrados
- **Editar roles**: Cambiar entre 'user' y 'admin'
- **Ver estadísticas**: Puntos, barrio, actividad
- **Filtros**: Por barrio, puntos, fecha de registro

##### CRUD de Productos
- **Crear productos**: GTIN, nombre, peso, categoría
- **Editar información**: Actualizar peso, puntos por kg
- **Activar/desactivar**: Control de disponibilidad
- **Vista de catálogo**: Lista de todos los productos

##### CRUD de Sorteos (Completo)
- **Formulario de creación/edición**:
  - Título del sorteo
  - Descripción detallada
  - Premio a sortear
  - Costo en puntos (ticket_cost)
  - Fecha del sorteo (draw_date)
  - Categoría: Eco / Comercio Local / Descuentos
  - Patrocinador (sponsor)
  - URL de imagen (opcional)
  - Estado: Activo / Completado / Cancelado

- **Lista de sorteos existentes**:
  - Tarjetas con toda la información
  - Botón "Editar": Carga datos en el formulario
  - Botón "Eliminar": Confirmación y borrado

- **Estadísticas**:
  - Total de sorteos activos
  - Total de tickets vendidos
  - Participación por categoría

- **Conexión directa con Supabase** (sin API routes):
  ```typescript
  // Crear
  await supabase.from('raffles').insert([raffleData])

  // Actualizar
  await supabase.from('raffles').update(raffleData).eq('id', id)

  // Eliminar
  await supabase.from('raffles').delete().eq('id', id)
  ```

##### Gestión de Staff
- **Crear cuentas de promotores**:
  - Username único
  - Contraseña (hasheada con bcrypt)
  - Tipo: Promotor o Ecopunto
  - Ubicación/zona asignada

- **Lista de staff**:
  - Activos/Inactivos
  - Estadísticas de validaciones
  - Opción de activar/desactivar

- **Control de acceso**: Solo admins pueden crear staff

#### Tablas Relacionadas

```sql
raffles (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prize TEXT NOT NULL,
  ticket_cost INTEGER NOT NULL,
  draw_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active',
  category TEXT,
  sponsor TEXT,
  image_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

raffle_tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  raffle_id UUID REFERENCES raffles(id),
  ticket_number INTEGER,
  purchased_at TIMESTAMP
)
```

---

## Base de Datos

### Diagrama de Relaciones (Completo)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE SCHEMA                           │
└─────────────────────────────────────────────────────────────────────────┘

auth.users (Supabase Auth)
    │
    ├──> users (Perfil público extendido)
    │    ├── id UUID PRIMARY KEY (FK: auth.users.id)
    │    ├── email TEXT UNIQUE NOT NULL
    │    ├── name TEXT NOT NULL
    │    ├── points INTEGER DEFAULT 0           -- Puntos canjeables
    │    ├── total_earned_points INTEGER DEFAULT 0  -- Históricos (ranking)
    │    ├── neighborhood TEXT NOT NULL
    │    ├── role TEXT DEFAULT 'user'           -- 'user' o 'admin'
    │    ├── avatar_url TEXT
    │    ├── created_at TIMESTAMP
    │    └── updated_at TIMESTAMP
    │
    ├──> user_virtual_bin (Tacho virtual - Material pendiente)
    │    ├── id UUID PRIMARY KEY
    │    ├── user_id UUID NOT NULL (FK: users.id)
    │    ├── material_type TEXT NOT NULL        -- 'avu', 'lata', 'botella'
    │    ├── quantity INTEGER DEFAULT 1
    │    ├── last_scanned_at TIMESTAMP
    │    └── UNIQUE(user_id, material_type)
    │
    ├──> scans (Historial de escaneos)
    │    ├── id UUID PRIMARY KEY
    │    ├── user_id UUID NOT NULL (FK: users.id)
    │    ├── qr_code TEXT NOT NULL
    │    ├── points_earned INTEGER DEFAULT 0
    │    ├── material_type TEXT
    │    ├── material_details JSONB
    │    └── scanned_at TIMESTAMP DEFAULT NOW()
    │
    ├──> recycling_tokens (Tokens OTP para validación)
    │    ├── id UUID PRIMARY KEY
    │    ├── user_id UUID NOT NULL (FK: users.id)
    │    ├── token_code TEXT UNIQUE NOT NULL     -- 6 caracteres
    │    ├── material_type TEXT NOT NULL         -- 'avu', 'lata', 'botella'
    │    ├── quantity INTEGER DEFAULT 1
    │    ├── points_value INTEGER NOT NULL
    │    ├── status TEXT DEFAULT 'pending'       -- 'pending', 'validated', 'expired', 'cancelled'
    │    ├── expires_at TIMESTAMP NOT NULL       -- 15 minutos
    │    ├── validated_at TIMESTAMP
    │    ├── validated_by UUID (FK: staff_accounts.id)
    │    ├── validation_location TEXT
    │    └── created_at TIMESTAMP
    │
    └──> raffle_tickets (Tickets de sorteos comprados)
         ├── id UUID PRIMARY KEY
         ├── user_id UUID NOT NULL (FK: users.id)
         ├── raffle_id UUID NOT NULL (FK: raffles.id)
         ├── ticket_number INTEGER NOT NULL
         └── purchased_at TIMESTAMP DEFAULT NOW()

products (Catálogo de productos escaneables)
    ├── id UUID PRIMARY KEY
    ├── gtin TEXT UNIQUE NOT NULL               -- Código de barras
    ├── name TEXT NOT NULL
    ├── brand TEXT
    ├── weight NUMERIC                          -- Gramos
    ├── category TEXT                           -- 'lata', 'botella', etc.
    ├── points_per_kg INTEGER
    ├── is_active BOOLEAN DEFAULT true
    └── created_at TIMESTAMP

raffles (Sorteos/Rifas)
    ├── id UUID PRIMARY KEY
    ├── title TEXT NOT NULL
    ├── description TEXT
    ├── prize TEXT NOT NULL
    ├── ticket_cost INTEGER NOT NULL            -- Puntos por ticket
    ├── draw_date TIMESTAMP NOT NULL
    ├── status TEXT DEFAULT 'active'            -- 'active', 'completed', 'cancelled'
    ├── category TEXT                           -- 'eco', 'comercio', 'descuento'
    ├── sponsor TEXT                            -- Comercio patrocinador
    ├── image_url TEXT
    ├── created_at TIMESTAMP
    └── updated_at TIMESTAMP

staff_accounts (Cuentas de promotores y ecopuntos)
    ├── id UUID PRIMARY KEY
    ├── username TEXT UNIQUE NOT NULL
    ├── password_hash TEXT NOT NULL
    ├── account_type TEXT NOT NULL              -- 'promotor' o 'ecopunto'
    ├── created_by UUID (FK: users.id)          -- Admin que lo creó
    ├── is_active BOOLEAN DEFAULT true
    ├── location TEXT                           -- Ubicación/zona asignada
    ├── created_at TIMESTAMP
    └── updated_at TIMESTAMP

material_points_config (Configuración de puntos por material)
    ├── material_type TEXT PRIMARY KEY          -- 'avu', 'lata', 'botella'
    ├── points_per_unit INTEGER NOT NULL
    ├── description TEXT
    └── updated_at TIMESTAMP
```

### Funciones de Base de Datos (PostgreSQL)

#### Gestión del Tacho Virtual

```sql
-- Agregar material al tacho virtual
CREATE OR REPLACE FUNCTION add_to_virtual_bin(
  p_user_id UUID,
  p_material_type TEXT,
  p_quantity INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_virtual_bin (user_id, material_type, quantity, last_scanned_at)
  VALUES (p_user_id, p_material_type, p_quantity, NOW())
  ON CONFLICT (user_id, material_type)
  DO UPDATE SET
    quantity = user_virtual_bin.quantity + p_quantity,
    last_scanned_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Remover material del tacho virtual
CREATE OR REPLACE FUNCTION remove_from_virtual_bin(
  p_user_id UUID,
  p_material_type TEXT,
  p_quantity INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE user_virtual_bin
  SET quantity = GREATEST(quantity - p_quantity, 0),
      last_scanned_at = NOW()
  WHERE user_id = p_user_id AND material_type = p_material_type;

  -- Eliminar si quantity llega a 0
  DELETE FROM user_virtual_bin
  WHERE user_id = p_user_id
    AND material_type = p_material_type
    AND quantity = 0;
END;
$$ LANGUAGE plpgsql;

-- Obtener total de items en el tacho
CREATE OR REPLACE FUNCTION get_total_bin_items(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(quantity), 0)::INTEGER
  FROM user_virtual_bin
  WHERE user_id = p_user_id;
$$ LANGUAGE sql;
```

#### Rankings y Estadísticas

```sql
-- Obtener ranking de barrios
CREATE OR REPLACE FUNCTION get_neighborhood_rankings()
RETURNS TABLE (
  neighborhood TEXT,
  total_points BIGINT,
  user_count BIGINT,
  avg_points NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.neighborhood,
    SUM(u.total_earned_points) as total_points,
    COUNT(u.id) as user_count,
    AVG(u.total_earned_points) as avg_points
  FROM users u
  WHERE u.neighborhood IS NOT NULL
  GROUP BY u.neighborhood
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql;
```

### Triggers

```sql
-- Crear perfil de usuario automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, neighborhood)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'neighborhood', 'Sin barrio')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_raffles_updated_at BEFORE UPDATE ON raffles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Políticas de Seguridad (RLS - Row Level Security)

```sql
-- Usuarios pueden ver/editar su propio perfil
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Cualquiera puede ver sorteos activos
CREATE POLICY "Anyone can view active raffles"
  ON raffles FOR SELECT
  USING (status = 'active');

-- Solo admins pueden gestionar sorteos
CREATE POLICY "Admins can manage raffles"
  ON raffles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Usuarios pueden ver sus propios tickets
CREATE POLICY "Users can view own tickets"
  ON raffle_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden insertar sus propios tickets
CREATE POLICY "Users can insert own tickets"
  ON raffle_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden ver/editar su tacho virtual
CREATE POLICY "Users can manage own virtual bin"
  ON user_virtual_bin FOR ALL
  USING (auth.uid() = user_id);

-- Staff puede ver tokens para validar
CREATE POLICY "Staff can view tokens for validation"
  ON recycling_tokens FOR SELECT
  USING (status = 'pending');

-- Solo admins y sistema pueden gestionar tokens
CREATE POLICY "System can manage tokens"
  ON recycling_tokens FOR ALL
  USING (true);
```

### Índices para Optimización

```sql
-- Índices en users
CREATE INDEX idx_users_neighborhood ON users(neighborhood);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_points ON users(points);
CREATE INDEX idx_users_total_earned ON users(total_earned_points);

-- Índices en recycling_tokens
CREATE INDEX idx_tokens_user_id ON recycling_tokens(user_id);
CREATE INDEX idx_tokens_status ON recycling_tokens(status);
CREATE INDEX idx_tokens_validated_by ON recycling_tokens(validated_by);
CREATE INDEX idx_tokens_code ON recycling_tokens(token_code);

-- Índices en raffles
CREATE INDEX idx_raffles_status ON raffles(status);
CREATE INDEX idx_raffles_category ON raffles(category);
CREATE INDEX idx_raffles_draw_date ON raffles(draw_date);

-- Índices en raffle_tickets
CREATE INDEX idx_tickets_user_id ON raffle_tickets(user_id);
CREATE INDEX idx_tickets_raffle_id ON raffle_tickets(raffle_id);

-- Índices en products
CREATE INDEX idx_products_gtin ON products(gtin);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
```

---

## Instalación

### Prerrequisitos

- **Node.js 18+** y npm o pnpm
- **Cuenta en Supabase** (gratuita en supabase.com)
- **API Key de Google AI** (opcional, para consejos de IA)

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/posadas-recicla.git
cd posadas-recicla
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase (REQUERIDO)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-secreta

# Google AI (OPCIONAL - para consejos de reciclaje)
GOOGLE_API_KEY=tu-google-ai-api-key
```

**Obtener credenciales de Supabase:**
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un proyecto nuevo
3. Ve a Settings > API
4. Copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (¡MANTENER SECRETA!)

**Obtener API Key de Google AI:**
1. Ve a [ai.google.dev](https://ai.google.dev)
2. Crea un proyecto y habilita Gemini API
3. Genera una API key

### Paso 4: Configurar Base de Datos

**Ejecuta los scripts SQL en este orden exacto** en el SQL Editor de Supabase:

```bash
# 1. Schema consolidado (base de datos completa)
migrations/schema-consolidated.sql

# 2. Sistema de roles y staff
migrations/admin-and-staff-accounts.sql

# 3. Tacho virtual (IMPORTANTE para scanner)
migrations/SETUP_TACHO_VIRTUAL.sql

# 4. Sistema de tokens OTP
migrations/create-tokens-system.sql

# 5. Catálogo de productos escaneables
migrations/create-products-table.sql

# 6. Sistema de sorteos y políticas RLS
migrations/setup-raffles-policies.sql

# 7. Fix de políticas RLS (si es necesario)
migrations/fix-rls-policies.sql
```

Ver guía detallada en [migrations/README.md](migrations/README.md)

### Paso 5: Crear Cuenta Administrador

**Opción A: Promover usuario existente**
```sql
-- En Supabase SQL Editor
UPDATE users
SET role = 'admin'
WHERE email = 'tu-email@example.com';
```

**Opción B: Crear nuevo admin desde cero**
1. Registrate en la app normalmente (`/register`)
2. Ejecuta el query de la Opción A con tu email

### Paso 6: Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

La PWA estará disponible en modo desarrollo, pero para probarla completamente necesitas HTTPS (usa Vercel o similar).

---

## Configuración

### Configuración de OAuth (Google)

Para permitir login con Google:

1. **Crear proyecto en Google Cloud Console**
   - Ve a [console.cloud.google.com](https://console.cloud.google.com)
   - Crea un proyecto nuevo

2. **Configurar OAuth**
   - Ve a "APIs y servicios" > "Credenciales"
   - Crea credenciales OAuth 2.0
   - Agrega URIs de redirección:
     - `http://localhost:3000/auth/callback` (desarrollo)
     - `https://tu-dominio.com/auth/callback` (producción)

3. **Configurar en Supabase**
   - Ve a Authentication > Providers > Google
   - Pega Client ID y Client Secret
   - Habilita el provider

Ver guía completa en [docs/GOOGLE_OAUTH_SETUP.md](docs/GOOGLE_OAUTH_SETUP.md)

### Configuración de Barrios

Los barrios de Posadas están definidos en `src/lib/neighborhoods.ts`:

```typescript
export const NEIGHBORHOODS = [
  "Centro",
  "Villa Urquiza",
  "Villa Sarita",
  "San Jorge",
  "Itaembé Miní",
  "A-3-2",
  "Villa Lanús",
  "Villa Blosset",
  // ... agregar más barrios según necesidad
]
```

### Configuración de Puntos por Material

Los valores se configuran en la tabla `material_points_config`:

```sql
-- Ver configuración actual
SELECT * FROM material_points_config;

-- Actualizar puntos por lata
UPDATE material_points_config
SET points_per_unit = 1
WHERE material_type = 'lata';

-- Actualizar puntos por litro de AVU
UPDATE material_points_config
SET points_per_unit = 20
WHERE material_type = 'avu';

-- Actualizar puntos por botella
UPDATE material_points_config
SET points_per_unit = 1
WHERE material_type = 'botella';
```

### Personalización de Tema

Los colores del tema se configuran en `src/app/globals.css`:

```css
:root {
  --primary: 142 76% 36%;        /* Verde reciclaje */
  --primary-foreground: 0 0% 100%;
  --secondary: 199 89% 48%;      /* Azul secundario */
  --accent: 47 96% 53%;          /* Amarillo/ámbar */
  --destructive: 0 84% 60%;      /* Rojo */
  --muted: 210 40% 96%;
  --border: 214 32% 91%;
}
```

---

## Uso

### Para Usuarios

#### 1. Registrarse
- Ve a `/register`
- Ingresa nombre, email, contraseña y selecciona tu barrio
- O usa "Continuar con Google"

#### 2. Escanear Productos
- Ve a `/dashboard/scan`
- Permite acceso a la cámara
- Escanea el código de barras de una lata, botella o QR de AVU
- El producto se agrega automáticamente a tu tacho virtual
- Verás una confirmación visual con puntos ganados

#### 3. Generar Token de Validación
- Ve al kiosco o ecopunto
- Escanea el QR del punto de recogida
- La app genera un token OTP de 6 caracteres válido por 15 minutos
- Muestra el token al promotor
- El promotor valida y acredita tus puntos

#### 4. Participar en Sorteos
- Ve a `/dashboard/raffles`
- Explora sorteos activos por categoría (Eco, Comercio Local, Descuentos)
- Compra boletos con tus puntos canjeables
- Verifica tus participaciones en "Mis Participaciones"
- Espera al día del sorteo para conocer resultados

#### 5. Canjear Puntos por SUBE
- Ve a `/dashboard`
- Selecciona tipo de canje:
  - **Envases Ligeros**: 10 puntos = 2 boletos SUBE
  - **AVU**: 20 puntos = 4 boletos SUBE
- Ingresa el alias de tu tarjeta SUBE
- Confirma el canje
- Los boletos se acreditarán en 24-48 horas

#### 6. Ver Ranking de Barrios
- Ve a `/dashboard/leaderboard`
- Mira la posición de tu barrio en tiempo real
- El ranking usa `total_earned_points` (nunca disminuye con gastos)
- Compite con otros barrios de Posadas

---

### Para Promotores

#### 1. Login
```
URL: /promotor/login
Usuario: tu-username-asignado
Contraseña: tu-contraseña-asignada
```

#### 2. Validar Tokens
- El usuario te muestra su token OTP de 6 caracteres
- Ingresas el código en el campo "Código"
- Click en "Validar"
- El sistema:
  - Verifica el token
  - Acredita puntos al usuario
  - Actualiza tus estadísticas
  - Remueve material del tacho virtual del usuario

#### 3. Monitorear Tanque de AVU
- Visualiza el progreso del tanque de 200 litros
- Cuando llegue al 80%, considera programar recolección
- Al llegar al 100%, usa el botón "Llamar para Recolección"

#### 4. Ver Estadísticas
- Litros de AVU validados
- Cantidad de latas validadas
- Cantidad de botellas validadas
- Total de validaciones realizadas

---

### Para Administradores

#### 1. Login
```
URL: /admin/login
Email: tu-email@example.com (con role='admin')
Contraseña: tu-contraseña
```

#### 2. Gestionar Productos
- Tab "Productos"
- Agregar nuevos productos con GTIN, nombre, peso
- Editar puntos por kg
- Activar/desactivar productos del catálogo

#### 3. Gestionar Sorteos (CRUD Completo)
- Tab "Sorteos"
- **Crear sorteo**:
  - Completa el formulario con todos los campos
  - Título, descripción, premio, costo en puntos
  - Fecha de sorteo, categoría, patrocinador
  - URL de imagen (opcional)
  - Estado (Activo/Completado/Cancelado)
  - Click en "Guardar Sorteo"
- **Editar sorteo**:
  - Click en "Editar" en la tarjeta del sorteo
  - Modifica los campos necesarios
  - Click en "Guardar Sorteo"
- **Eliminar sorteo**:
  - Click en "Eliminar"
  - Confirma la acción
  - El sorteo se borra de la base de datos

#### 4. Gestionar Staff
- Tab "Staff"
- Crear cuentas de promotores:
  - Username único
  - Contraseña segura
  - Tipo: Promotor o Ecopunto
  - Ubicación/zona asignada
- Activar/desactivar cuentas según necesidad
- Ver estadísticas de validaciones por staff

#### 5. Ver Dashboard
- Estadísticas generales del sistema:
  - Total de usuarios registrados
  - Total de puntos en circulación
  - Total de sorteos activos
  - Actividad reciente

---

## Estructura del Proyecto

```
posadas-recicla/
│
├── src/
│   ├── app/                              # App Router de Next.js 15
│   │   ├── (auth)/                       # Grupo de rutas de autenticación
│   │   │   ├── login/page.tsx            # Login de usuarios
│   │   │   ├── register/page.tsx         # Registro de usuarios
│   │   │   └── auth/callback/route.ts    # Callback OAuth (Google)
│   │   │
│   │   ├── dashboard/                    # Dashboard de usuarios
│   │   │   ├── page.tsx                  # Vista principal con puntos, SUBE, consejos IA
│   │   │   ├── layout.tsx                # Layout con header y sidebar
│   │   │   ├── scan/page.tsx             # Escáner de códigos de barras y QR
│   │   │   ├── raffles/page.tsx          # Sorteos + Mis Participaciones
│   │   │   ├── leaderboard/page.tsx      # Ranking de barrios
│   │   │   └── validate/page.tsx         # Validación de códigos (usuarios)
│   │   │
│   │   ├── admin/                        # Panel de administración
│   │   │   ├── login/page.tsx            # Login de admin
│   │   │   └── dashboard/page.tsx        # Dashboard admin con CRUD completo
│   │   │
│   │   ├── promotor/                     # Panel de promotores
│   │   │   ├── login/page.tsx            # Login de promotor (staff)
│   │   │   └── dashboard/page.tsx        # Dashboard con tanque AVU, contadores
│   │   │
│   │   ├── api/                          # API Routes
│   │   │   ├── recycling-tip/route.ts    # Consejos de IA con Gemini
│   │   │   ├── tokens/
│   │   │   │   ├── validate/route.ts     # Validar tokens OTP
│   │   │   │   └── stats/route.ts        # Estadísticas de promotor
│   │   │   └── user/
│   │   │       └── virtual-bin/          # API del tacho virtual
│   │   │           ├── add/route.ts      # Agregar material
│   │   │           └── route.ts          # Obtener materiales
│   │   │
│   │   ├── layout.tsx                    # Layout raíz con metadata PWA
│   │   ├── page.tsx                      # Landing page
│   │   └── globals.css                   # Estilos globales + Tailwind
│   │
│   ├── components/                       # Componentes React
│   │   ├── dashboard/                    # Componentes del dashboard
│   │   │   ├── header.tsx                # Header con usuario y menú
│   │   │   ├── sidebar.tsx               # Navegación lateral
│   │   │   └── recycling-tips.tsx        # Consejos de IA con Gemini
│   │   │
│   │   └── ui/                           # Componentes UI (ShadCN/UI)
│   │       ├── button.tsx                # Botón con variantes
│   │       ├── card.tsx                  # Tarjetas de contenido
│   │       ├── dialog.tsx                # Modales (Radix UI)
│   │       ├── input.tsx                 # Inputs de formulario
│   │       ├── label.tsx                 # Labels accesibles
│   │       ├── select.tsx                # Select personalizado
│   │       ├── badge.tsx                 # Badges de estado
│   │       ├── tabs.tsx                  # Pestañas (usado en admin)
│   │       └── ...más componentes
│   │
│   ├── contexts/                         # Contextos de React
│   │   └── AuthContext.tsx               # Contexto de autenticación global
│   │
│   ├── lib/                              # Utilidades y configuración
│   │   ├── ai/
│   │   │   └── personalized-recycling-tips.ts  # Lógica de IA con Gemini
│   │   ├── neighborhoods.ts              # Lista de barrios de Posadas
│   │   └── utils.ts                      # Utilidades generales (cn, etc.)
│   │
│   └── supabase/                         # Configuración de Supabase
│       ├── client.ts                     # Cliente de Supabase (browser)
│       ├── server.ts                     # Cliente de Supabase (server)
│       └── types.ts                      # Tipos TypeScript generados
│
├── public/                               # Archivos estáticos
│   ├── icons/                            # Iconos de la PWA
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   │
│   ├── manifest.json                     # Manifiesto de la PWA
│   ├── sw.js                             # Service Worker (auto-generado)
│   └── workbox-*.js                      # Scripts de Workbox
│
├── migrations/                           # Scripts SQL de Supabase
│   ├── 00-SETUP-COMPLETO.sql             # Setup unificado (alternativa)
│   ├── schema-consolidated.sql           # Schema completo de base de datos
│   ├── SETUP_TACHO_VIRTUAL.sql           # Config tacho virtual + Realtime
│   ├── admin-and-staff-accounts.sql      # Sistema de roles y staff
│   ├── create-tokens-system.sql          # Sistema de tokens OTP
│   ├── create-products-table.sql         # Catálogo de productos
│   ├── setup-raffles-policies.sql        # Políticas RLS de sorteos
│   ├── fix-rls-policies.sql              # Fix de políticas duplicadas
│   ├── fix-ranking-rls.sql               # Fix de ranking
│   ├── README.md                         # Guía completa de instalación
│   ├── LIMPIAR_OBSOLETOS.bat             # Script para limpiar archivos viejos
│   └── obsolete/                         # Archivos obsoletos (NO subir a GitHub)
│       ├── diagnose-and-fix-admin.sql    # Contiene datos sensibles
│       └── supabase-test-data.sql        # Solo datos de prueba
│
├── docs/                                 # Documentación detallada
│   ├── ADMIN_PANEL.md                    # Guía del panel admin
│   ├── PROMOTOR_LOGIN.md                 # Guía de login de promotores
│   ├── PROMOTOR_STATS_DEBUG.md           # Debug de estadísticas de promotor
│   ├── QUICK_START.md                    # Inicio rápido
│   ├── REALTIME_SYNC.md                  # Sincronización en tiempo real
│   ├── SCHEMA-CHANGES.md                 # Cambios en el schema
│   ├── TOKENS_SYSTEM.md                  # Sistema de tokens OTP
│   ├── VIRTUAL_BIN.md                    # Sistema de tacho virtual
│   ├── GOOGLE_OAUTH_SETUP.md             # Configuración OAuth
│   ├── INSTALACION_GEMINI.md             # Configuración de IA
│   ├── ARQUITECTURA.md                   # Arquitectura del sistema
│   └── BASE_DE_DATOS.md                  # Estructura de BD
│
├── .env.local                            # Variables de entorno (NO subir)
├── .gitignore                            # Archivos ignorados por Git
├── next.config.ts                        # Config de Next.js + PWA (next-pwa)
├── tailwind.config.js                    # Config de Tailwind CSS
├── postcss.config.js                     # Config de PostCSS
├── tsconfig.json                         # Config de TypeScript
├── package.json                          # Dependencias del proyecto
├── package-lock.json                     # Lock de dependencias
└── README.md                             # Este archivo
```

---

## Scripts Disponibles

```bash
# Desarrollo
npm run dev                 # Inicia servidor de desarrollo en localhost:3000
npm run dev -- -H 0.0.0.0   # Desarrollo accesible en toda la red local

# Producción
npm run build               # Crea build optimizado para producción
npm run start               # Inicia servidor de producción

# Calidad de código
npm run lint                # Ejecuta ESLint para detectar errores

# Limpieza
rm -rf .next                # Eliminar caché de Next.js
npm cache clean --force     # Limpiar caché de npm
```

---

## Documentación

### Documentación General

- **[Inicio Rápido](docs/QUICK_START.md)** - Guía rápida de inicio
- **[Panel de Administración](docs/ADMIN_PANEL.md)** - Uso del panel admin
- **[Login de Promotores](docs/PROMOTOR_LOGIN.md)** - Guía para promotores
- **[Sincronización en Tiempo Real](docs/REALTIME_SYNC.md)** - Cómo funciona Realtime

### Sistemas Específicos

- **[Sistema de Tacho Virtual](docs/VIRTUAL_BIN.md)** - Funcionamiento del tacho virtual
- **[Sistema de Tokens OTP](docs/TOKENS_SYSTEM.md)** - Validación con tokens
- **[Cambios en el Schema](docs/SCHEMA-CHANGES.md)** - Historial de cambios de BD

### Configuración

- **[Google OAuth Setup](docs/GOOGLE_OAUTH_SETUP.md)** - Configurar login con Google
- **[Configuración de IA](docs/INSTALACION_GEMINI.md)** - Setup Google Gemini

### Troubleshooting

- **[Debug de Estadísticas de Promotor](docs/PROMOTOR_STATS_DEBUG.md)** - Solución de problemas con tanque AVU y contadores
- **[Instalación de Base de Datos](migrations/README.md)** - Guía paso a paso con troubleshooting

---

## Despliegue

### Vercel (Recomendado)

Vercel es la plataforma oficial de Next.js y ofrece el mejor rendimiento.

**Paso 1: Conectar Repositorio**
1. Ve a [vercel.com](https://vercel.com)
2. Importa tu repositorio de GitHub
3. Vercel detecta Next.js automáticamente

**Paso 2: Configurar Variables de Entorno**

En el dashboard de Vercel, agrega:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
GOOGLE_API_KEY=tu-google-ai-api-key
```

**Paso 3: Deploy**
```bash
# Desde la terminal (opcional)
npm i -g vercel
vercel
```

### Dominio Personalizado

**Importante**: La PWA requiere HTTPS obligatoriamente.

- Vercel proporciona HTTPS automáticamente
- Si usas otro host, configura certificado SSL
- Los Service Workers solo funcionan con HTTPS

### Configuración de OAuth en Producción

Actualiza las URIs de redirección en:
- Google Cloud Console: `https://tu-dominio.com/auth/callback`
- Supabase: Authentication > URL Configuration > Redirect URLs

---

## Contribuir

Las contribuciones son bienvenidas y apreciadas. Para contribuir:

### Proceso de Contribución

1. **Fork el proyecto**
   ```bash
   # Click en "Fork" en GitHub
   ```

2. **Crea una rama para tu feature**
   ```bash
   git checkout -b feature/NombreDelFeature
   ```

3. **Commit tus cambios**
   ```bash
   git commit -m 'Add: Nueva funcionalidad increíble'
   ```

4. **Push a la rama**
   ```bash
   git push origin feature/NombreDelFeature
   ```

5. **Abre un Pull Request**
   - Describe los cambios en detalle
   - Incluye screenshots si es UI
   - Referencia issues relacionados

### Guías de Contribución

- **TypeScript**: Usa tipado estricto, evita `any`
- **Comentarios**: En español, claros y concisos
- **Componentes**: Reutilizables y con props bien tipadas
- **Commits**: Usa mensajes descriptivos (Add/Update/Fix/Remove)
- **Tests**: Agrega tests si es posible
- **Documentación**: Actualiza README si cambias funcionalidad

---

## Licencia

Este proyecto está bajo la Licencia ISC.

---

## Agradecimientos

- **Next.js** por el framework increíble y la documentación excelente
- **Supabase** por el BaaS completo con Realtime y RLS
- **Google** por Gemini AI y las herramientas de desarrollo
- **ShadCN** por los componentes UI elegantes y accesibles
- **Radix UI** por las primitivas de componentes sin estilos
- **Lucide** por los iconos hermosos y consistentes
- **Tailwind CSS** por el sistema de utilidades CSS
- **ZXing** por la librería de escaneo de códigos
- **Vercel** por el hosting gratuito y optimizado

---

## Contacto y Soporte

- **GitHub Issues**: [Reporta bugs o solicita features](https://github.com/tu-usuario/posadas-recicla/issues)
- **Documentación**: Consulta la carpeta `/docs` para guías detalladas
- **Migraciones**: Ver `/migrations/README.md` para setup de base de datos

---

## Estado del Proyecto

**Estado Actual**: ✅ En Producción Activa

### Funcionalidades Implementadas

- ✅ PWA completa con Service Worker y manifest
- ✅ Sistema de autenticación con Google OAuth
- ✅ Escáner de códigos de barras (ZXing)
- ✅ Tacho virtual con sincronización Realtime
- ✅ Sistema de tokens OTP (validación)
- ✅ Doble sistema de puntos (canjeables + históricos)
- ✅ Ranking de barrios en tiempo real
- ✅ Sistema de sorteos completo con CRUD
- ✅ "Mis Participaciones" en sorteos
- ✅ Canje de puntos por boletos SUBE
- ✅ Panel de promotores con:
  - ✅ Tanque de AVU (200L) con alertas
  - ✅ Contadores de latas y botellas
  - ✅ Estadísticas en tiempo real
- ✅ Panel de administración con:
  - ✅ CRUD de usuarios
  - ✅ CRUD de productos
  - ✅ CRUD de sorteos (completo)
  - ✅ Gestión de staff
- ✅ Consejos personalizados con IA (Gemini)
- ✅ Diseño responsive mobile-first

### Próximas Características (Roadmap)

- 🔜 Notificaciones push para sorteos
- 🔜 Mapa interactivo de ecopuntos
- 🔜 Sistema de badges y niveles
- 🔜 Estadísticas avanzadas y gráficos
- 🔜 Exportación de reportes (PDF/Excel)
- 🔜 App móvil nativa (React Native)
- 🔜 Sistema de donaciones a proyectos
- 🔜 Chat de soporte en vivo
- 🔜 Gamificación con desafíos semanales

---

**Desarrollado con 💚 por [German Delima](https://www.linkedin.com/in/germandelima) para un Posadas más verde y sustentable**

> "Reciclá hoy, transformá mañana"

📧 **Contrataciones y Consultas**: [verdescan@gmail.com](mailto:verdescan@gmail.com)
💼 **LinkedIn**: [![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?logo=linkedin&logoColor=white)](https://linkedin.com/in/josíasgermándelima) 
💻 **GitHub**: [github.com/GermanDelima](https://github.com/GermanDelima)

