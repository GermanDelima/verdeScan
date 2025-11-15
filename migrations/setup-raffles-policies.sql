-- ============================================
-- POLÍTICAS RLS PARA RAFFLES
-- ============================================

-- Eliminar políticas existentes si existen (para evitar errores de duplicados)
DROP POLICY IF EXISTS "Anyone can view active raffles" ON raffles;
DROP POLICY IF EXISTS "Only admins can insert raffles" ON raffles;
DROP POLICY IF EXISTS "Only admins can update raffles" ON raffles;
DROP POLICY IF EXISTS "Only admins can delete raffles" ON raffles;

-- Habilitar RLS en la tabla raffles
ALTER TABLE raffles ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver sorteos activos
CREATE POLICY "Anyone can view active raffles"
ON raffles
FOR SELECT
USING (status = 'active');

-- Política: Solo admins pueden insertar sorteos
CREATE POLICY "Only admins can insert raffles"
ON raffles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Política: Solo admins pueden actualizar sorteos
CREATE POLICY "Only admins can update raffles"
ON raffles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Política: Solo admins pueden eliminar sorteos
CREATE POLICY "Only admins can delete raffles"
ON raffles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Insertar algunos sorteos de ejemplo
INSERT INTO raffles (title, description, prize, ticket_cost, draw_date, status, category, sponsor, image_url)
VALUES
  (
    'Kit de Jardinería Ecológica',
    '5 bolsas de abono orgánico premium y 10 plantines de especies nativas de Posadas. Perfecto para iniciar tu huerta sustentable en casa.',
    '5 Bolsas de Abono + 10 Plantines',
    100,
    NOW() + INTERVAL '5 days',
    'active',
    'eco',
    'Vivero Posadas Verde',
    NULL
  ),
  (
    'Descuento en Pizzería La Famiglia',
    'Cupón de 30% de descuento en cualquier pizza grande de la casa. Válido por 60 días.',
    '30% OFF en Pizza Grande',
    200,
    NOW() + INTERVAL '7 days',
    'active',
    'discount',
    'Pizzería La Famiglia',
    NULL
  ),
  (
    'Heladería Artesanal',
    '4 kilos de helado artesanal en los sabores que elijas. Helados artesanales con ingredientes locales.',
    '4kg de Helado Artesanal',
    300,
    NOW() + INTERVAL '10 days',
    'active',
    'commerce',
    'Heladería Del Pueblo',
    NULL
  ),
  (
    'Librería Cultural Posadas',
    'Voucher de $15.000 para comprar libros, útiles escolares o material didáctico en nuestra librería.',
    'Voucher $15.000 en Librería',
    200,
    NOW() + INTERVAL '14 days',
    'active',
    'commerce',
    'Librería Cultural',
    NULL
  ),
  (
    'Cine Posadas - Entradas Dobles',
    '2 entradas para cualquier función + 2 combos de pochoclo y gaseosa. Válido por 90 días.',
    '2 Entradas + 2 Combos de Cine',
    100,
    NOW() + INTERVAL '12 days',
    'active',
    'commerce',
    'Cine Posadas',
    NULL
  ),
  (
    'Pack Sustentable Premium',
    'Bicicleta urbana + kit de reciclaje para el hogar + 20 bolsas reutilizables. El premio más completo para una vida sustentable.',
    'Bicicleta + Kit de Reciclaje',
    500,
    NOW() + INTERVAL '30 days',
    'active',
    'eco',
    'Municipalidad de Posadas',
    NULL
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- POLÍTICAS RLS PARA RAFFLE_TICKETS
-- ============================================

-- Eliminar políticas existentes si existen (para evitar errores de duplicados)
DROP POLICY IF EXISTS "Users can view own tickets" ON raffle_tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON raffle_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON raffle_tickets;

-- Habilitar RLS en la tabla raffle_tickets
ALTER TABLE raffle_tickets ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios boletos
CREATE POLICY "Users can view own tickets"
ON raffle_tickets
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propios boletos (a través de la compra)
CREATE POLICY "Users can insert own tickets"
ON raffle_tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Solo admins pueden ver todos los boletos
CREATE POLICY "Admins can view all tickets"
ON raffle_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Verificar que se insertaron correctamente
SELECT id, title, ticket_cost, draw_date, status, category
FROM raffles
WHERE status = 'active'
ORDER BY draw_date ASC;
