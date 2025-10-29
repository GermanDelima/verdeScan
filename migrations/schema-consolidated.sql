-- ============================================
-- VERDESCAN - SCHEMA CONSOLIDADO
-- ============================================
-- Este archivo refleja el estado REAL actual de la base de datos

--
-- IMPORTANTE: Este es el schema consolidado que reemplaza a todos los anteriores
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Table: users
-- Almacena los datos de usuarios registrados vía OAuth (Google)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  total_earned_points INTEGER NOT NULL DEFAULT 0,
  neighborhood VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN users.points IS 'Puntos actuales disponibles para canjear';
COMMENT ON COLUMN users.total_earned_points IS 'Total de puntos ganados históricos (incluye canjeados)';

-- Table: scans
-- Almacena los escaneos de QR realizados por los usuarios
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  material_details TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN scans.material_details IS 'Detalle de materiales reciclados en este escaneo (ej: "Metal (Latas): 50 unidad, Vidrio: 20 unidad")';

-- Table: raffles
-- Almacena los sorteos disponibles en la plataforma
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

COMMENT ON COLUMN raffles.category IS 'Categoría del sorteo (ej: "mensual", "especial")';
COMMENT ON COLUMN raffles.sponsor IS 'Patrocinador del sorteo';

-- Add check constraint for raffles status
ALTER TABLE raffles ADD CONSTRAINT raffles_status_check
  CHECK (status IN ('active', 'completed', 'cancelled'));

-- Table: raffle_tickets
-- Almacena los tickets de sorteo comprados por usuarios
CREATE TABLE raffle_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raffle_id UUID NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(raffle_id, ticket_number)
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_neighborhood ON users(neighborhood);
CREATE INDEX idx_users_total_earned_points ON users(total_earned_points DESC);

-- Scans indexes
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_scanned_at ON scans(scanned_at DESC);

-- Raffles indexes
CREATE INDEX idx_raffles_status ON raffles(status);
CREATE INDEX idx_raffles_draw_date ON raffles(draw_date);
CREATE INDEX idx_raffles_category ON raffles(category);

-- Raffle tickets indexes
CREATE INDEX idx_raffle_tickets_user_id ON raffle_tickets(user_id);
CREATE INDEX idx_raffle_tickets_raffle_id ON raffle_tickets(raffle_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: handle_new_user
-- Trigger function para crear usuario en public.users cuando se registra vía OAuth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, neighborhood, points)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'neighborhood',
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, users.name),
    neighborhood = COALESCE(EXCLUDED.neighborhood, users.neighborhood);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: update_updated_at_column
-- Trigger function para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: get_neighborhood_rankings
-- Retorna el ranking de barrios por total de puntos ganados
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

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Crear usuario en public.users cuando se registra en auth.users
-- NOTA: Este trigger se crea en auth.users, no en public.users
-- Ejecutar: CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
--           FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: Actualizar updated_at en users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_tickets ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Scans policies
CREATE POLICY "Users can view their own scans" ON scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans" ON scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Raffles policies
CREATE POLICY "Anyone can view raffles" ON raffles
  FOR SELECT USING (true);

-- Raffle tickets policies
CREATE POLICY "Users can view their own raffle tickets" ON raffle_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own raffle tickets" ON raffle_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. TRIGGER EN AUTH.USERS:
--    El trigger on_auth_user_created debe crearse manualmente en auth.users:
--
--    CREATE TRIGGER on_auth_user_created
--      AFTER INSERT ON auth.users
--      FOR EACH ROW
--      EXECUTE FUNCTION handle_new_user();
--
--    Este trigger se crea automáticamente si ejecutaste supabase-oauth-setup.sql

-- 2. TABLAS ELIMINADAS:
--    Las tablas 'rewards' y 'redemption_codes' fueron eliminadas
--    Si necesitas restaurarlas, debes crearlas nuevamente

-- 3. MIGRACIONES APLICADAS:
--    Este schema consolida las siguientes migraciones aplicadas:
--    - supabase-schema.sql (base)
--    - supabase-oauth-setup.sql (handle_new_user trigger)
--    - add-material-details-column.sql (scans.material_details)
--    - supabase-raffles-update.sql (raffles.category, sponsor, image_url)
--    - supabase-fix-ranking-points.sql (users.total_earned_points)
--    - supabase-neighborhood-update.sql (neighborhood updates)

-- ============================================
-- FIN DEL SCHEMA CONSOLIDADO
-- ============================================
