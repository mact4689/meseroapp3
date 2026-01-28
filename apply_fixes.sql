-- ==============================================================================
-- SCRIPT DE CORRECCIÓN (NO BORRA DATOS)
-- ==============================================================================
-- Ejecuta este script si ya tienes datos y solo quieres arreglar problemas
-- de permisos o actualizaciones en tiempo real.
-- ==============================================================================

-- 1. CORREGIR POLÍTICAS RLS (Sin borrar tablas)

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
-- Aseguramos políticas de escritura del dueño
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Menu Items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON public.menu_items;
DROP POLICY IF EXISTS "Public Read Menu" ON public.menu_items;
CREATE POLICY "Public Read Menu" ON public.menu_items FOR SELECT USING (true);
-- Escritura dueño
DROP POLICY IF EXISTS "Users can insert their own menu items" ON public.menu_items;
CREATE POLICY "Users can insert their own menu items" ON public.menu_items FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own menu items" ON public.menu_items;
CREATE POLICY "Users can update their own menu items" ON public.menu_items FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own menu items" ON public.menu_items;
CREATE POLICY "Users can delete their own menu items" ON public.menu_items FOR DELETE USING (auth.uid() = user_id);

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- Insert público (CRÍTICO FIX)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public Create Orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
-- Lectura dueño
DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON public.orders;
CREATE POLICY "Restaurant owners can view their orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Restaurant owners can update their orders" ON public.orders;
CREATE POLICY "Restaurant owners can update their orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);


-- 2. HABILITAR REALTIME
-- Intentar crear la publicación si no existe, o añadir tablas si ya existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR TABLE public.orders, public.menu_items;
    ELSE
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Ya está añadido
END $$;
