-- SOLUCIÓN DEFINITIVA PARA ERROR DE PERMISOS (RLS)
-- Ejecuta este script en el Editor SQL de Supabase para arreglar el error al subir platillos.

-- 1. Asegurar que RLS está activo
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas que puedan estar bloqueando
DROP POLICY IF EXISTS "Users can insert their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.menu_items;
DROP POLICY IF EXISTS "Owner Manage Menu" ON public.menu_items;

-- 3. Crear la política correcta para INSERTAR
-- Esta política permite insertar SOLO si el user_id coincide con tu usuario logueado
CREATE POLICY "Users can insert their own menu items" 
ON public.menu_items FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Crear política para ACTUALIZAR (Editar)
DROP POLICY IF EXISTS "Users can update their own menu items" ON public.menu_items;
CREATE POLICY "Users can update their own menu items" 
ON public.menu_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Crear política para ELIMINAR
DROP POLICY IF EXISTS "Users can delete their own menu items" ON public.menu_items;
CREATE POLICY "Users can delete their own menu items" 
ON public.menu_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Crear política para VER (Select)
-- Todo el mundo (incluso sin loguear) debe poder ver el menú para pedir
DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON public.menu_items;
CREATE POLICY "Menu items are viewable by everyone" 
ON public.menu_items FOR SELECT 
USING (true);
