-- ==============================================================================
-- MIGRACIÓN: Crear tabla de roles personalizados
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Abre tu Supabase Dashboard: https://app.supabase.com
-- 2. Ve a "SQL Editor" en el menú lateral
-- 3. Copia y pega este código
-- 4. Haz clic en "Run"
-- ==============================================================================

-- Crear tabla custom_roles
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{
    "dashboard": true,
    "orders": true,
    "menu": false,
    "tables": false,
    "kds": false,
    "tickets": false,
    "staff": false,
    "reports": false,
    "business": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Owners can read their roles" 
  ON public.custom_roles FOR SELECT 
  USING (auth.uid() = restaurant_id);

CREATE POLICY "Owners can insert roles" 
  ON public.custom_roles FOR INSERT 
  WITH CHECK (auth.uid() = restaurant_id);

CREATE POLICY "Owners can update their roles" 
  ON public.custom_roles FOR UPDATE 
  USING (auth.uid() = restaurant_id);

CREATE POLICY "Owners can delete their roles" 
  ON public.custom_roles FOR DELETE 
  USING (auth.uid() = restaurant_id);

-- ==============================================================================
-- VERIFICACIÓN (Opcional):
-- ==============================================================================
-- SELECT * FROM public.custom_roles LIMIT 10;
