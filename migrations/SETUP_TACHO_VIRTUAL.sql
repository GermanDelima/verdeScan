-- ========================================
-- CONFIGURACIÓN COMPLETA DEL TACHO VIRTUAL
-- ========================================
-- Este es el ÚNICO script que necesitas ejecutar en Supabase
-- Ejecuta TODO este archivo en el SQL Editor de Supabase
--
-- ¿Qué hace este script?
-- 1. Crea la tabla user_virtual_bin (si no existe)
-- 2. Crea 3 funciones necesarias (add_to_virtual_bin, remove_from_virtual_bin, get_total_bin_items)
-- 3. Configura políticas RLS (seguridad)
-- 4. Habilita Realtime
-- 5. Verifica que todo se creó correctamente

-- ========================================
-- PASO 1: CREAR TABLA (si no existe)
-- ========================================

CREATE TABLE IF NOT EXISTS user_virtual_bin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL CHECK (material_type IN ('avu', 'lata', 'botella')),
  quantity INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, material_type)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_virtual_bin_user_id ON user_virtual_bin(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_bin_material ON user_virtual_bin(material_type);

-- ========================================
-- PASO 2: HABILITAR ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE user_virtual_bin ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas (si existen)
DROP POLICY IF EXISTS "Users can view their own virtual bin" ON user_virtual_bin;
DROP POLICY IF EXISTS "Users can update their own virtual bin" ON user_virtual_bin;
DROP POLICY IF EXISTS "Users can modify their own virtual bin" ON user_virtual_bin;
DROP POLICY IF EXISTS "Users can insert their own virtual bin" ON user_virtual_bin;
DROP POLICY IF EXISTS "Users can delete their own virtual bin" ON user_virtual_bin;

-- Crear políticas correctas
CREATE POLICY "Users can view their own virtual bin" ON user_virtual_bin
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own virtual bin" ON user_virtual_bin
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their own virtual bin" ON user_virtual_bin
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own virtual bin" ON user_virtual_bin
  FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- PASO 3: CREAR FUNCIONES
-- ========================================

-- Función 1: Agregar material al tacho virtual
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
  -- Insertar o actualizar usando UPSERT
  INSERT INTO user_virtual_bin (user_id, material_type, quantity, last_scanned_at)
  VALUES (p_user_id, p_material_type, p_quantity, NOW())
  ON CONFLICT (user_id, material_type)
  DO UPDATE SET
    quantity = user_virtual_bin.quantity + p_quantity,
    last_scanned_at = NOW();
END;
$$;

-- Función 2: Remover material del tacho virtual (al canjear)
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

-- Función 3: Obtener total de items en el tacho
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
  -- Sumar todas las cantidades del tacho virtual del usuario
  SELECT COALESCE(SUM(quantity), 0) INTO total
  FROM user_virtual_bin
  WHERE user_id = p_user_id;

  RETURN total;
END;
$$;

-- ========================================
-- PASO 4: OTORGAR PERMISOS
-- ========================================

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION add_to_virtual_bin(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_from_virtual_bin(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_bin_items(UUID) TO authenticated;

-- También dar permisos al rol anon (por si acaso)
GRANT EXECUTE ON FUNCTION add_to_virtual_bin(UUID, TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION remove_from_virtual_bin(UUID, TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_total_bin_items(UUID) TO anon;

-- ========================================
-- PASO 5: HABILITAR REALTIME
-- ========================================

-- Habilitar Realtime (ignorar error si ya está habilitado)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE user_virtual_bin;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Tabla ya está en Realtime - OK';
END $$;

-- ========================================
-- PASO 6: VERIFICACIÓN
-- ========================================

-- Verificar tabla
SELECT
  '1. Tabla user_virtual_bin: ' ||
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'user_virtual_bin'
  ) THEN '✅ CREADA' ELSE '❌ NO EXISTE' END as resultado;

-- Verificar políticas RLS
SELECT
  '2. Políticas RLS: ' || COUNT(*)::text || '/4 ' ||
  CASE WHEN COUNT(*) = 4 THEN '✅' ELSE '❌' END as resultado
FROM pg_policies
WHERE tablename = 'user_virtual_bin';

-- Verificar funciones
SELECT
  '3. Funciones: ' || COUNT(*)::text || '/3 ' ||
  CASE WHEN COUNT(*) = 3 THEN '✅' ELSE '❌' END as resultado
FROM information_schema.routines
WHERE routine_name IN ('add_to_virtual_bin', 'remove_from_virtual_bin', 'get_total_bin_items');

-- Listar funciones creadas
SELECT
  '   - ' || routine_name as funciones_creadas
FROM information_schema.routines
WHERE routine_name IN ('add_to_virtual_bin', 'remove_from_virtual_bin', 'get_total_bin_items')
ORDER BY routine_name;

-- Verificar Realtime
SELECT
  '4. Realtime: ' ||
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'user_virtual_bin'
  ) THEN '✅ HABILITADO' ELSE '❌ DESHABILITADO' END as resultado;

-- Mensaje final
SELECT '🎉 CONFIGURACIÓN COMPLETADA. Ahora puedes escanear códigos de barras.' as mensaje_final;
