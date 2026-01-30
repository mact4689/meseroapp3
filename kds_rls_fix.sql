-- CORRECCIÓN DE PERMISOS RLS PARA KDS
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-01-29

-- ========================================
-- 1. KITCHEN STATIONS - Permisos
-- ========================================

-- Primero eliminamos políticas existentes
DROP POLICY IF EXISTS "Public Read Stations" ON public.kitchen_stations;
DROP POLICY IF EXISTS "Owner Manage Stations" ON public.kitchen_stations;
DROP POLICY IF EXISTS "Owner Insert Stations" ON public.kitchen_stations;
DROP POLICY IF EXISTS "Owner Update Stations" ON public.kitchen_stations;
DROP POLICY IF EXISTS "Owner Delete Stations" ON public.kitchen_stations;

-- Lectura pública (para tablets KDS sin login)
CREATE POLICY "Public Read Stations" ON public.kitchen_stations 
  FOR SELECT 
  USING (true);

-- Insertar: Solo el owner autenticado
CREATE POLICY "Owner Insert Stations" ON public.kitchen_stations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Actualizar: Solo el owner autenticado
CREATE POLICY "Owner Update Stations" ON public.kitchen_stations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Eliminar: Solo el owner autenticado  
CREATE POLICY "Owner Delete Stations" ON public.kitchen_stations 
  FOR DELETE 
  USING (auth.uid() = user_id);


-- ========================================
-- 2. ORDERS - Permisos para que tablets puedan marcar items
-- ========================================

-- Actualizar la política de UPDATE de orders para que tablets puedan actualizar prepared_items
DROP POLICY IF EXISTS "Public Update Orders Prepared" ON public.orders;
CREATE POLICY "Public Update Orders Prepared" ON public.orders 
  FOR UPDATE 
  USING (true)  -- Cualquiera puede actualizar (las tablets lo necesitan)
  WITH CHECK (true);



-- ========================================
-- 3. Verificar que RLS esté habilitado
-- ========================================
ALTER TABLE public.kitchen_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;


-- ========================================
-- 4. Verificar publicación Realtime
-- ========================================
-- Si da error de "already exists", es OK, significa que ya está configurado
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_stations;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- ¡LISTO! Prueba de nuevo el KDS
-- ========================================
