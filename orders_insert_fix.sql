-- PERMITIR INSERTAR ÓRDENES DESDE CLIENTES SIN LOGIN
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-01-29

-- ========================================
-- ORDERS - Permitir INSERT público
-- ========================================

-- Los clientes (sin login) necesitan poder crear órdenes
DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;
CREATE POLICY "Public Insert Orders" ON public.orders 
  FOR INSERT 
  WITH CHECK (true);  -- Cualquiera puede insertar

-- Verificar que RLS esté habilitado
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ¡LISTO! Los clientes ya pueden ordenar
-- ========================================
