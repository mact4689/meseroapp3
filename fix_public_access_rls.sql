-- ==============================================================================
-- FIX: PERMISOS DE ACCESO PÚBLICO (RLS) FOR GUEST USERS
-- ==============================================================================
-- Este script habilita el acceso de LECTURA pública a las tablas esenciales
-- para que el menú digital funcione sin iniciar sesión (invitados/QR).

-- 1. BUSINESS PROFILES
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.business_profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.business_profiles FOR SELECT
USING (true); -- Permite ver a CUALQUIER usuario (incluido anónimo)

-- 2. CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON public.categories;

CREATE POLICY "Public categories are viewable by everyone"
ON public.categories FOR SELECT
USING (true);

-- 3. MENU ITEMS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public menu items are viewable by everyone" ON public.menu_items;

CREATE POLICY "Public menu items are viewable by everyone"
ON public.menu_items FOR SELECT
USING (true);

-- 4. TABLES (Mesas) - Importante para validar QR
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public tables are viewable by everyone" ON public.tables;

CREATE POLICY "Public tables are viewable by everyone"
ON public.tables FOR SELECT
USING (true);

-- CONFIRMACIÓN
-- Ejecuta este script en el SQL Editor de Supabase para aplicar los cambios.
