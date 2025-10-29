-- ============================================
-- VERDESCAN - SETUP COMPLETO DE BASE DE DATOS
-- ============================================
-- Este archivo configura TODA la base de datos desde cero
-- Ejecutar SOLO en una base de datos vacía
-- ============================================

-- PASO 1: Schema base (users, scans, raffles, raffle_tickets)
\i schema-consolidated.sql

-- PASO 2: Tabla de productos escaneables
\i create-products-table.sql

-- PASO 3: Sistema de tokens de reciclaje
\i create-tokens-system.sql

-- PASO 4: Tacho virtual
\i SETUP_TACHO_VIRTUAL.sql

-- PASO 5: Cuentas de staff y admin
\i admin-and-staff-accounts.sql

-- PASO 6: Arreglar políticas RLS (importante para evitar recursión infinita)
\i fix-rls-policies.sql

-- ============================================
-- SETUP COMPLETADO
-- ============================================
-- La base de datos está lista para usar VerdeScan
--
-- Próximos pasos:
-- 1. Configurar el email del admin en diagnose-and-fix-admin.sql
-- 2. Ejecutar diagnose-and-fix-admin.sql para configurar tu cuenta de admin
-- 3. (Opcional) Ejecutar supabase-test-data.sql para agregar datos de prueba
--
-- ============================================
