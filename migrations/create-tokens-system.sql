-- Sistema de Tokens OTP para Validación de Reciclaje
-- Ejecuta este script en Supabase SQL Editor

-- ========================================
-- CREAR TABLA DE TOKENS
-- ========================================

CREATE TABLE IF NOT EXISTS recycling_tokens (
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

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_recycling_tokens_user_id ON recycling_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_recycling_tokens_token_code ON recycling_tokens(token_code);
CREATE INDEX IF NOT EXISTS idx_recycling_tokens_status ON recycling_tokens(status);
CREATE INDEX IF NOT EXISTS idx_recycling_tokens_created_at ON recycling_tokens(created_at DESC);

-- ========================================
-- POLÍTICAS RLS
-- ========================================

ALTER TABLE recycling_tokens ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propios tokens
CREATE POLICY "Users can view their own tokens" ON recycling_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear sus propios tokens
CREATE POLICY "Users can create their own tokens" ON recycling_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar (cancelar) sus propios tokens pendientes
CREATE POLICY "Users can update their own pending tokens" ON recycling_tokens
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- ========================================
-- FUNCIÓN PARA GENERAR CÓDIGOS DE TOKEN
-- ========================================

CREATE OR REPLACE FUNCTION generate_token_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; -- Sin I, O para evitar confusión
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generar código de 6 caracteres
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FUNCIÓN PARA LIMPIAR TOKENS EXPIRADOS
-- ========================================

CREATE OR REPLACE FUNCTION expire_old_tokens()
RETURNS void AS $$
BEGIN
  UPDATE recycling_tokens
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VALORES DE PUNTOS POR MATERIAL
-- ========================================

-- Tabla de configuración de puntos por material
CREATE TABLE IF NOT EXISTS material_points_config (
  material_type TEXT PRIMARY KEY CHECK (material_type IN ('avu', 'lata', 'botella')),
  points_per_unit INTEGER NOT NULL,
  unit_description TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar valores por defecto
INSERT INTO material_points_config (material_type, points_per_unit, unit_description)
VALUES
  ('avu', 20, '1 Litro de Aceite Vegetal Usado'),
  ('lata', 1, '1 Lata de Aluminio'),
  ('botella', 1, '1 Botella de Plástico')
ON CONFLICT (material_type) DO NOTHING;

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver configuración de puntos
SELECT
  material_type,
  points_per_unit,
  unit_description
FROM material_points_config
ORDER BY material_type;

-- Ver estructura de la tabla de tokens
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'recycling_tokens'
ORDER BY ordinal_position;
