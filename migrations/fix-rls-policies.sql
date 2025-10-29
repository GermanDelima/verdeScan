-- Arreglo de Políticas RLS para evitar recursión infinita
-- Ejecuta este script en Supabase SQL Editor

-- ========================================
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS DE USERS
-- ========================================

DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- ========================================
-- PASO 2: CREAR POLÍTICAS SIMPLES (SIN RECURSIÓN)
-- ========================================

-- Política SELECT: Los usuarios pueden ver su propia información
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Política INSERT: Los usuarios pueden insertar su propia información
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política UPDATE: Los usuarios pueden actualizar su propia información
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- ========================================
-- PASO 3: USAR SERVICE ROLE PARA ADMINS
-- ========================================

-- IMPORTANTE: Para que los admins puedan ver/editar todos los usuarios,
-- las llamadas desde el backend deben usar la SERVICE_ROLE_KEY
-- no la ANON_KEY. Esto bypasea RLS completamente.

-- En las APIs del admin (/api/admin/*), necesitamos usar:
-- const supabase = createClient(url, SERVICE_ROLE_KEY)

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver todas las políticas de la tabla users
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
