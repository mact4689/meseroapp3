-- ==============================================================================
-- MIGRACIÓN: Agregar columna de roles a profiles
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Abre tu Supabase Dashboard: https://app.supabase.com
-- 2. Ve a "SQL Editor" en el menú lateral
-- 3. Copia y pega este código
-- 4. Haz clic en "Run"
-- ==============================================================================

-- Agregar columna role a profiles (si no existe)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';

-- Agregar columna restaurant_id para staff (si no existe)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Asegurar que todos los usuarios existentes tengan rol 'owner'
UPDATE public.profiles 
  SET role = 'owner' 
  WHERE role IS NULL;

-- ==============================================================================
-- VERIFICACIÓN (Opcional) - Ejecuta esto para confirmar que funcionó:
-- ==============================================================================
-- SELECT id, name, role, restaurant_id FROM public.profiles LIMIT 10;
