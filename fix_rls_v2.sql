-- ==============================================================================
-- CORRECCIÓN DEFINITIVA DE PERMISOS (RLS)
-- ==============================================================================
-- Ejecuta este script para permitir que los clientes (invitados) puedan:
-- 1. Ver el perfil del restaurante (nombre, logo).
-- 2. Ver el menú.
-- 3. Crear órdenes.

-- 1. PROFILES (Perfil del Restaurante)
-- Asegura que cualquiera pueda LEER la info básica del restaurante
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- 2. MENU_ITEMS (Platillos)
-- Asegura que cualquiera pueda LEER el menú
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public menu_items are viewable by everyone" ON public.menu_items;

CREATE POLICY "Public menu_items are viewable by everyone"
ON public.menu_items FOR SELECT
USING (true);

-- 3. ORDERS (Pedidos)
-- Asegura que cualquiera pueda CREAR (INSERT) una orden
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can create orders" ON public.orders;

CREATE POLICY "Public can create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

-- Asegura que cualquiera pueda VER (SELECT) las órdenes (para confirmar su pedido)
-- (En producción idealmente filtrarías por ID de sesión/cookie, pero para MVP esto desbloquea el problema)
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;

CREATE POLICY "Public can view orders"
ON public.orders FOR SELECT
USING (true);

-- NOTA: Si usas una tabla 'tables' o 'categories' separada, avísame.
-- Por defecto 'tables' es un número en el perfil y 'categories' son texto en menu_items.
