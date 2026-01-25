-- ==============================================================================
-- SCRIPT DE CORRECCIÓN DE PERMISOS (RLS)
-- ==============================================================================
-- Copia y pega TODO este contenido en el Editor SQL de tu panel de Supabase
-- y presiona "RUN". Esto arreglará el error "Menu Not Available".
-- ==============================================================================

-- 1. Habilitar RLS en todas las tablas importantes (por seguridad)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas para evitar conflictos
-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
-- Menu Items
DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON public.menu_items;
DROP POLICY IF EXISTS "Users can insert their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can update their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can delete their own menu items" ON public.menu_items;
-- Orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can update their orders" ON public.orders;

-- 3. Crear Nuevas Políticas Correctas

-- PROFILES: Todo el mundo puede ver (para cargar el logo/nombre en el menú)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- MENU_ITEMS: Todo el mundo puede ver (para cargar platillos)
CREATE POLICY "Menu items are viewable by everyone" 
ON public.menu_items FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own menu items" 
ON public.menu_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own menu items" 
ON public.menu_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own menu items" 
ON public.menu_items FOR DELETE 
USING (auth.uid() = user_id);

-- ORDERS: Todo el mundo puede crear (clientes sin loguear)
CREATE POLICY "Anyone can create orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Solo el dueño del restaurante puede ver/editar sus órdenes
CREATE POLICY "Restaurant owners can view their orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can update their orders" 
ON public.orders FOR UPDATE 
USING (auth.uid() = user_id);

-- ==============================================================================
-- FIN DEL SCRIPT
-- Si ves "Success" abajo a la derecha, recarga tu menú QR.
-- ==============================================================================
