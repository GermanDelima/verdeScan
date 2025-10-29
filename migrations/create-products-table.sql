-- Migración: Sistema de Productos para Escaneo
-- Fecha: 2025-01-27
-- Descripción: Crea la tabla products para almacenar productos escaneables (latas, botellas, etc)
-- y migra el producto hardcodeado existente

-- 1. Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gtin VARCHAR(20) UNIQUE NOT NULL, -- Código de barras (GTIN-13 o EAN-13)
  name VARCHAR(255) NOT NULL,
  weight DECIMAL(10,2) NOT NULL, -- Peso en gramos
  category VARCHAR(100) NOT NULL, -- "Aluminio", "Plástico", "Vidrio", etc
  points_per_kg INTEGER NOT NULL DEFAULT 50, -- Puntos que se dan por kg
  active BOOLEAN DEFAULT true, -- Si el producto está activo para escaneo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agregar comentarios a la tabla
COMMENT ON TABLE products IS 'Catálogo de productos escaneables para el sistema de reciclaje';
COMMENT ON COLUMN products.gtin IS 'Código de barras GTIN-13 o EAN-13';
COMMENT ON COLUMN products.weight IS 'Peso del producto en gramos';
COMMENT ON COLUMN products.category IS 'Categoría del material: Aluminio, Plástico, Vidrio, etc';
COMMENT ON COLUMN products.points_per_kg IS 'Puntos que se otorgan por cada kilogramo de este material';
COMMENT ON COLUMN products.active IS 'Si false, el producto no se puede escanear';

-- 3. Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_products_gtin ON products(gtin);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- 4. Configurar RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden leer productos activos
CREATE POLICY "Usuarios pueden leer productos activos"
  ON products
  FOR SELECT
  USING (auth.role() = 'authenticated' AND active = true);

-- Política: Admins pueden hacer todo
CREATE POLICY "Admins pueden gestionar productos"
  ON products
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- 5. Insertar el producto hardcodeado existente
-- Este es el producto que actualmente está en el código
INSERT INTO products (gtin, name, weight, category, points_per_kg, active)
VALUES (
  '7790139000462',
  'Lata de Cerveza 355ml',
  14.0,
  'Aluminio',
  50,
  true
)
ON CONFLICT (gtin) DO NOTHING;

-- 6. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- 7. Verificación de la migración
DO $$
BEGIN
  RAISE NOTICE '✅ Tabla products creada correctamente';
  RAISE NOTICE '✅ RLS habilitado';
  RAISE NOTICE '✅ Políticas de seguridad creadas';
  RAISE NOTICE '✅ Índices creados';
  RAISE NOTICE '✅ Producto inicial insertado';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Productos actuales:';
END $$;

SELECT
  gtin,
  name,
  weight || 'g' as peso,
  category,
  points_per_kg || ' pts/kg' as puntos,
  CASE WHEN active THEN '✓ Activo' ELSE '✗ Inactivo' END as estado
FROM products
ORDER BY created_at DESC;
