-- Sistema de Cuentas de Administradores y Personal
-- Ejecutar este SQL en el Editor SQL de Supabase

-- Agregar columna role a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Crear índice para búsquedas de role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Crear tabla staff_accounts para promotores y ecopuntos
CREATE TABLE IF NOT EXISTS staff_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('promotor', 'ecopunto')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Crear índices para staff_accounts
CREATE INDEX IF NOT EXISTS idx_staff_accounts_username ON staff_accounts(username);
CREATE INDEX IF NOT EXISTS idx_staff_accounts_type ON staff_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_staff_accounts_created_by ON staff_accounts(created_by);

-- Habilitar RLS en staff_accounts
ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;

-- Política: Solo los administradores pueden ver cuentas de personal
CREATE POLICY "Admins can view all staff accounts" ON staff_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Política: Solo los administradores pueden crear cuentas de personal
CREATE POLICY "Admins can create staff accounts" ON staff_accounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Política: Solo los administradores pueden actualizar cuentas de personal
CREATE POLICY "Admins can update staff accounts" ON staff_accounts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Política: Solo los administradores pueden eliminar cuentas de personal
CREATE POLICY "Admins can delete staff accounts" ON staff_accounts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Trigger para actualizar automáticamente updated_at en la tabla staff_accounts
CREATE TRIGGER update_staff_accounts_updated_at
  BEFORE UPDATE ON staff_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para verificar si el usuario es administrador
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

-- Actualizar políticas RLS para la tabla users para permitir a los administradores ver todos los usuarios
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    auth.uid()::text = id::text
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Comentario: Para crear una cuenta de administrador, actualizar manualmente el role del usuario:
-- UPDATE users SET role = 'admin' WHERE email = 'tu-email-admin@ejemplo.com';
