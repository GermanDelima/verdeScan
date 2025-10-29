# Base de Datos - VerdeScan

Documentación completa del schema de base de datos PostgreSQL en Supabase.

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Tablas](#tablas)
- [Relaciones](#relaciones)
- [Funciones](#funciones)
- [Triggers](#triggers)
- [Row Level Security](#row-level-security)
- [Índices](#índices)
- [Migraciones](#migraciones)

---

## Visión General

VerdeScan utiliza **PostgreSQL** hospedado en **Supabase** con las siguientes características:

- **Realtime**: Sincronización automática con WebSockets
- **Row Level Security (RLS)**: Seguridad a nivel de fila
- **Triggers**: Automatización de tareas
- **Functions**: Lógica de negocio en el servidor
- **UUID**: Identificadores únicos universales
- **Timestamps**: Control de fechas con zona horaria

### Extensiones Habilitadas

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Tablas

### 1. users

Perfil público de usuarios registrados.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  total_earned_points INTEGER NOT NULL DEFAULT 0,
  neighborhood VARCHAR(100),
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Columnas:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | FK a auth.users (Supabase Auth) |
| `email` | TEXT | Email del usuario (único) |
| `name` | TEXT | Nombre completo del usuario |
| `points` | INTEGER | **Puntos canjeables** (aumenta al ganar, disminuye al gastar) |
| `total_earned_points` | INTEGER | **Puntos históricos** (solo aumenta, determina ranking) |
| `neighborhood` | VARCHAR(100) | Barrio de residencia en Posadas |
| `role` | TEXT | Rol del usuario: 'user' \| 'admin' |
| `created_at` | TIMESTAMPTZ | Fecha de registro |
| `updated_at` | TIMESTAMPTZ | Última actualización |

**Constraints:**
- PK en `id`
- UNIQUE en `email`
- FK a `auth.users(id)` con CASCADE DELETE

**Índices:**
- `idx_users_neighborhood` en `neighborhood`
- `idx_users_total_earned_points` en `total_earned_points DESC`
- `idx_users_role` en `role`

**Sistema Dual de Puntos:**

```sql
-- Al ganar puntos (escaneo):
UPDATE users SET
  points = points + 10,
  total_earned_points = total_earned_points + 10
WHERE id = user_id;

-- Al gastar puntos (sorteo):
UPDATE users SET
  points = points - 100  -- Solo disminuye points
  -- total_earned_points NO cambia
WHERE id = user_id;
```

---

### 2. user_virtual_bin

Tacho virtual de cada usuario para almacenar materiales antes de canjear.

```sql
CREATE TABLE user_virtual_bin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL CHECK (material_type IN ('avu', 'lata', 'botella')),
  quantity INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, material_type)
);
```

**Columnas:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | FK a users |
| `material_type` | TEXT | Tipo: 'avu' \| 'lata' \| 'botella' |
| `quantity` | INTEGER | Cantidad de unidades |
| `last_scanned_at` | TIMESTAMPTZ | Último escaneo |

**Constraints:**
- CHECK en `material_type`
- UNIQUE en `(user_id, material_type)` - Un registro por tipo de material por usuario
- FK a `users(id)` con CASCADE DELETE

**Índices:**
- `idx_virtual_bin_user_id` en `user_id`
- `idx_virtual_bin_material` en `material_type`

**Realtime Habilitado:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_virtual_bin;
```

---

### 3. scans

Historial de escaneos de QR y códigos de barras.

```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  material_details TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Columnas:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | FK a users |
| `qr_code` | TEXT | Código QR o código de barras escaneado |
| `points_earned` | INTEGER | Puntos ganados en este escaneo |
| `material_details` | TEXT | Detalles del material reciclado |
| `scanned_at` | TIMESTAMPTZ | Fecha y hora del escaneo |

**Ejemplo de material_details:**
```
"Metal (Latas): 50 unidad, Vidrio: 20 unidad"
```

**Índices:**
- `idx_scans_user_id` en `user_id`
- `idx_scans_scanned_at` en `scanned_at DESC`

---

### 4. products

Catálogo de productos escaneables (códigos de barras).

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gtin VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  points_per_kg INTEGER NOT NULL DEFAULT 50,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columnas:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `gtin` | VARCHAR(20) | Código de barras GTIN-13/EAN-13 (único) |
| `name` | VARCHAR(255) | Nombre del producto |
| `weight` | DECIMAL(10,2) | Peso en gramos |
| `category` | VARCHAR(100) | Categoría: 'Aluminio', 'Plástico', 'Vidrio' |
| `points_per_kg` | INTEGER | Puntos por kilogramo |
| `active` | BOOLEAN | Si el producto está activo para escaneo |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Última actualización |

**Ejemplo de producto:**
```sql
INSERT INTO products (gtin, name, weight, category, points_per_kg, active)
VALUES ('7790139000462', 'Lata de Cerveza 355ml', 14.0, 'Aluminio', 50, true);
```

**Índices:**
- `idx_products_gtin` en `gtin`
- `idx_products_category` en `category`
- `idx_products_active` en `active`

---

### 5. raffles

Sorteos disponibles en la plataforma.

```sql
CREATE TABLE raffles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prize TEXT NOT NULL,
  ticket_cost INTEGER NOT NULL DEFAULT 10,
  draw_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  category TEXT,
  sponsor TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Columnas:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `title` | TEXT | Título del sorteo |
| `description` | TEXT | Descripción detallada |
| `prize` | TEXT | Premio |
| `ticket_cost` | INTEGER | Costo en puntos por boleto |
| `draw_date` | TIMESTAMPTZ | Fecha del sorteo |
| `status` | TEXT | 'active' \| 'completed' \| 'cancelled' |
| `category` | TEXT | 'eco' \| 'comercio' \| 'descuento' |
| `sponsor` | TEXT | Patrocinador del sorteo |
| `image_url` | TEXT | URL de la imagen |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

**Constraints:**
- CHECK en `status IN ('active', 'completed', 'cancelled')`

**Índices:**
- `idx_raffles_status` en `status`
- `idx_raffles_draw_date` en `draw_date`
- `idx_raffles_category` en `category`

**Categorías de Sorteos:**
- **eco**: Productos sustentables, abono, plantines
- **comercio**: Premios de comercios locales
- **descuento**: Cupones y vouchers

---

### 6. raffle_tickets

Tickets de sorteo comprados por usuarios.

```sql
CREATE TABLE raffle_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(raffle_id, ticket_number)
);
```

**Columnas:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | FK a users |
| `raffle_id` | UUID | FK a raffles |
| `ticket_number` | TEXT | Número de boleto (único por sorteo) |
| `created_at` | TIMESTAMPTZ | Fecha de compra |

**Constraints:**
- UNIQUE en `(raffle_id, ticket_number)`
- FK a `users(id)` y `raffles(id)` con CASCADE DELETE

**Índices:**
- `idx_raffle_tickets_user_id` en `user_id`
- `idx_raffle_tickets_raffle_id` en `raffle_id`

---

### 7. staff_accounts

Cuentas de staff (promotores, ecopuntos).

```sql
CREATE TABLE staff_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('promotor', 'ecopunto')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
```

**Columnas:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `username` | TEXT | Nombre de usuario (único) |
| `password_hash` | TEXT | Hash de la contraseña |
| `account_type` | TEXT | 'promotor' \| 'ecopunto' |
| `created_by` | UUID | FK a users (admin que lo creó) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Última actualización |
| `is_active` | BOOLEAN | Si la cuenta está activa |

**Constraints:**
- UNIQUE en `username`
- CHECK en `account_type`
- FK a `users(id)` con SET NULL

**Índices:**
- `idx_staff_accounts_username` en `username`
- `idx_staff_accounts_type` en `account_type`
- `idx_staff_accounts_created_by` en `created_by`

---

### 8. recycling_tokens

Tokens OTP para validación de reciclaje.

```sql
CREATE TABLE recycling_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_code TEXT NOT NULL UNIQUE,
  material_type TEXT NOT NULL CHECK (material_type IN ('avu', 'lata', 'botella')),
  points_value INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES staff_accounts(id) ON DELETE SET NULL,
  validation_location TEXT
);
```

**Columnas:**

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | FK a users |
| `token_code` | TEXT | Código OTP (6 caracteres alfanuméricos) |
| `material_type` | TEXT | Tipo de material |
| `points_value` | INTEGER | Valor en puntos |
| `status` | TEXT | Estado del token |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `expires_at` | TIMESTAMPTZ | Fecha de expiración |
| `validated_at` | TIMESTAMPTZ | Fecha de validación (NULL si pending) |
| `validated_by` | UUID | FK a staff_accounts (quién validó) |
| `validation_location` | TEXT | Ubicación de validación |

**Estados posibles:**
- `pending`: Esperando validación
- `validated`: Validado y canjeado
- `expired`: Expirado por tiempo
- `cancelled`: Cancelado por el usuario

**Índices:**
- `idx_recycling_tokens_user_id` en `user_id`
- `idx_recycling_tokens_token_code` en `token_code`
- `idx_recycling_tokens_status` en `status`
- `idx_recycling_tokens_created_at` en `created_at DESC`

---

### 9. material_points_config

Configuración de puntos por tipo de material.

```sql
CREATE TABLE material_points_config (
  material_type TEXT PRIMARY KEY CHECK (material_type IN ('avu', 'lata', 'botella')),
  points_per_unit INTEGER NOT NULL,
  unit_description TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Datos por defecto:**
```sql
INSERT INTO material_points_config (material_type, points_per_unit, unit_description)
VALUES
  ('avu', 20, '1 Litro de Aceite Vegetal Usado'),
  ('lata', 1, '1 Lata de Aluminio'),
  ('botella', 1, '1 Botella de Plástico');
```

---

## Relaciones

### Diagrama Entity-Relationship

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth)
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐        ┌──────────────────┐
│     users       │◄───────│ staff_accounts   │
│                 │ 1:N    │ (created_by)     │
└────────┬────────┘        └──────────────────┘
         │
         │ 1:N
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│user_virtual_bin  │            │      scans       │
│(1 por material)  │            │  (historial)     │
└──────────────────┘            └──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│ recycling_tokens │◄──────┐
│                  │        │ validated_by
└──────────────────┘        │
         │                  │
         │ 1:N        ┌─────────────────┐
         │            │ staff_accounts  │
         ▼            └─────────────────┘
┌──────────────────┐
│ raffle_tickets   │
│                  │
└────────┬─────────┘
         │
         │ N:1
         ▼
┌──────────────────┐
│     raffles      │
└──────────────────┘
```

---

## Funciones

### add_to_virtual_bin

Agrega material al tacho virtual del usuario.

```sql
CREATE OR REPLACE FUNCTION add_to_virtual_bin(
  p_user_id UUID,
  p_material_type TEXT,
  p_quantity INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_virtual_bin (user_id, material_type, quantity, last_scanned_at)
  VALUES (p_user_id, p_material_type, p_quantity, NOW())
  ON CONFLICT (user_id, material_type)
  DO UPDATE SET
    quantity = user_virtual_bin.quantity + p_quantity,
    last_scanned_at = NOW();
END;
$$;
```

**Uso:**
```sql
SELECT add_to_virtual_bin('user-uuid', 'lata', 1);
```

---

### remove_from_virtual_bin

Remueve material del tacho virtual (al canjear).

```sql
CREATE OR REPLACE FUNCTION remove_from_virtual_bin(
  p_user_id UUID,
  p_material_type TEXT,
  p_quantity INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_quantity INTEGER;
BEGIN
  -- Obtener cantidad actual
  SELECT quantity INTO current_quantity
  FROM user_virtual_bin
  WHERE user_id = p_user_id AND material_type = p_material_type;

  -- Si no existe o no tiene suficiente, retornar false
  IF current_quantity IS NULL OR current_quantity < p_quantity THEN
    RETURN FALSE;
  END IF;

  -- Actualizar cantidad
  UPDATE user_virtual_bin
  SET quantity = quantity - p_quantity
  WHERE user_id = p_user_id AND material_type = p_material_type;

  -- Si la cantidad llega a 0, eliminar el registro
  DELETE FROM user_virtual_bin
  WHERE user_id = p_user_id
    AND material_type = p_material_type
    AND quantity <= 0;

  RETURN TRUE;
END;
$$;
```

**Uso:**
```sql
SELECT remove_from_virtual_bin('user-uuid', 'lata', 5);
-- Retorna TRUE si exitoso, FALSE si no hay suficientes items
```

---

### get_total_bin_items

Obtiene el total de items en el tacho virtual.

```sql
CREATE OR REPLACE FUNCTION get_total_bin_items(
  p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(quantity), 0) INTO total
  FROM user_virtual_bin
  WHERE user_id = p_user_id;

  RETURN total;
END;
$$;
```

**Uso:**
```sql
SELECT get_total_bin_items('user-uuid');
-- Retorna: 42
```

---

### get_neighborhood_rankings

Obtiene el ranking de barrios por puntos históricos.

```sql
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
    u.neighborhood::TEXT,
    SUM(u.total_earned_points)::BIGINT as total_points,
    COUNT(u.id)::BIGINT as user_count,
    ROUND(AVG(u.total_earned_points), 2) as avg_points
  FROM users u
  WHERE u.neighborhood IS NOT NULL
    AND u.neighborhood != ''
  GROUP BY u.neighborhood
  ORDER BY total_points DESC, avg_points DESC;
END;
$$ LANGUAGE plpgsql;
```

**Uso:**
```sql
SELECT * FROM get_neighborhood_rankings();
```

**Resultado:**
| neighborhood | total_points | user_count | avg_points |
|-------------|--------------|------------|------------|
| Centro | 15420 | 85 | 181.41 |
| Villa Urquiza | 12300 | 67 | 183.58 |
| Villa Sarita | 9850 | 54 | 182.41 |

---

### generate_token_code

Genera un código OTP aleatorio de 6 caracteres.

```sql
CREATE OR REPLACE FUNCTION generate_token_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**Uso:**
```sql
SELECT generate_token_code();
-- Retorna: "A3X9K2"
```

---

### is_admin

Verifica si el usuario actual es administrador.

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Triggers

### handle_new_user

Se ejecuta cuando se crea un usuario en `auth.users`.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, neighborhood, points)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'neighborhood',
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, users.name),
    neighborhood = COALESCE(EXCLUDED.neighborhood, users.neighborhood);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

### update_updated_at_column

Actualiza automáticamente la columna `updated_at`.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_accounts_updated_at
  BEFORE UPDATE ON staff_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Row Level Security

### Políticas en users

```sql
-- Ver sus propios datos
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins ven todos los usuarios
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    auth.uid()::text = id::text
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insertar sus propios datos
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Actualizar sus propios datos
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Políticas en user_virtual_bin

```sql
-- Ver su propio tacho
CREATE POLICY "Users can view their own virtual bin" ON user_virtual_bin
  FOR SELECT
  USING (auth.uid() = user_id);

-- Insertar en su tacho
CREATE POLICY "Users can insert their own virtual bin" ON user_virtual_bin
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Modificar su tacho
CREATE POLICY "Users can modify their own virtual bin" ON user_virtual_bin
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Eliminar de su tacho
CREATE POLICY "Users can delete their own virtual bin" ON user_virtual_bin
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Políticas en staff_accounts

```sql
-- Solo admins ven staff
CREATE POLICY "Admins can view all staff accounts" ON staff_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Solo admins crean staff
CREATE POLICY "Admins can create staff accounts" ON staff_accounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

### Políticas en raffles

```sql
-- Todos ven sorteos activos
CREATE POLICY "Anyone can view raffles" ON raffles
  FOR SELECT USING (true);
```

---

## Índices

Lista completa de índices para optimización de queries:

```sql
-- users
CREATE INDEX idx_users_neighborhood ON users(neighborhood);
CREATE INDEX idx_users_total_earned_points ON users(total_earned_points DESC);
CREATE INDEX idx_users_role ON users(role);

-- user_virtual_bin
CREATE INDEX idx_virtual_bin_user_id ON user_virtual_bin(user_id);
CREATE INDEX idx_virtual_bin_material ON user_virtual_bin(material_type);

-- scans
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_scanned_at ON scans(scanned_at DESC);

-- products
CREATE INDEX idx_products_gtin ON products(gtin);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(active);

-- raffles
CREATE INDEX idx_raffles_status ON raffles(status);
CREATE INDEX idx_raffles_draw_date ON raffles(draw_date);
CREATE INDEX idx_raffles_category ON raffles(category);

-- raffle_tickets
CREATE INDEX idx_raffle_tickets_user_id ON raffle_tickets(user_id);
CREATE INDEX idx_raffle_tickets_raffle_id ON raffle_tickets(raffle_id);

-- staff_accounts
CREATE INDEX idx_staff_accounts_username ON staff_accounts(username);
CREATE INDEX idx_staff_accounts_type ON staff_accounts(account_type);
CREATE INDEX idx_staff_accounts_created_by ON staff_accounts(created_by);

-- recycling_tokens
CREATE INDEX idx_recycling_tokens_user_id ON recycling_tokens(user_id);
CREATE INDEX idx_recycling_tokens_token_code ON recycling_tokens(token_code);
CREATE INDEX idx_recycling_tokens_status ON recycling_tokens(status);
CREATE INDEX idx_recycling_tokens_created_at ON recycling_tokens(created_at DESC);
```

---

## Migraciones

### Orden de Ejecución

Para configurar la base de datos desde cero, ejecuta los scripts en este orden:

```bash
1. migrations/schema-consolidated.sql
   └─ Crea tablas base: users, scans, raffles, raffle_tickets

2. migrations/admin-and-staff-accounts.sql
   └─ Agrega columna role a users y crea staff_accounts

3. migrations/SETUP_TACHO_VIRTUAL.sql
   └─ Crea user_virtual_bin con funciones y Realtime

4. migrations/create-tokens-system.sql
   └─ Crea recycling_tokens y material_points_config

5. migrations/create-products-table.sql
   └─ Crea products con producto inicial
```

### Scripts de Verificación

```sql
-- Verificar que todas las tablas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar funciones
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar Realtime
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

---

## Backup y Restauración

### Backup

```bash
# Desde Supabase Dashboard
Settings > Database > Database Backups

# Desde CLI (si tienes acceso directo)
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### Restauración

```bash
# Ejecutar backup en nuevo proyecto
psql -h db.yyy.supabase.co -U postgres -d postgres < backup.sql
```

---

## Conclusión

La base de datos de VerdeScan está diseñada para:

✅ **Escalabilidad**: Índices optimizados y queries eficientes
✅ **Seguridad**: RLS en todas las tablas
✅ **Integridad**: Foreign keys y constraints
✅ **Tiempo Real**: Supabase Realtime habilitado
✅ **Auditoría**: Timestamps en todas las tablas
✅ **Flexibilidad**: Funciones y triggers para lógica compleja

---

**Última actualización**: 2025-10-28
**Versión del Schema**: 1.0.0
