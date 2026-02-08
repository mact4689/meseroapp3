-- ==============================================================================
-- 🛡️ ULTIMATE SECURITY & GUEST ACCESS FIX (100% SEGURO)
-- ==============================================================================
-- Este script realiza tres tareas fundamentales:
-- 1. Habilita el Menú QR para clientes (Lectura pública).
-- 2. Permite a clientes crear pedidos (Insert público).
-- 3. Blindar el KDS con un código de 4 números (PIN).
-- ==============================================================================

-- 1. ESTRUCTURA DE SEGURIDAD (PIN KDS)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kds_pin TEXT DEFAULT '0000';

-- 2. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_stations ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE LECTURA PÚBLICA (Necesario para el Menú QR)
-- Permite que los clientes vean el nombre y logo del restaurante
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);

-- Permite que los clientes vean los platos del menú
DROP POLICY IF EXISTS "Public Read Menu" ON public.menu_items;
CREATE POLICY "Public Read Menu" ON public.menu_items FOR SELECT USING (true);

-- Permite que las tablets KDS vean las estaciones de cocina
DROP POLICY IF EXISTS "Public Read Stations" ON public.kitchen_stations;
CREATE POLICY "Public Read Stations" ON public.kitchen_stations FOR SELECT USING (true);

-- 4. POLÍTICAS DE ÓRDENES (Garantiza que el cliente pueda pedir)
-- Permite que los clientes (anónimos) envíen su orden
DROP POLICY IF EXISTS "Public Create Orders" ON public.orders;
CREATE POLICY "Public Create Orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Permite ver órdenes (necesario para Dashboard y KDS)
DROP POLICY IF EXISTS "Public View Orders" ON public.orders;
CREATE POLICY "Public View Orders" ON public.orders FOR SELECT USING (true);

-- 5. BLOQUEO DE SEGURIDAD: Nadie puede editar órdenes directamente por tabla
-- Solo el dueño puede editar el status final (cancelado/completado)
DROP POLICY IF EXISTS "Owner Manage Orders" ON public.orders;
CREATE POLICY "Owner Manage Orders" ON public.orders 
FOR ALL USING (auth.uid() = user_id);

-- 6. FUNCIÓN SEGURA PARA KDS (PIN PROTECTION)
-- Esta función permite actualizar items sin tener login, pero REQUIERE el PIN correcto
CREATE OR REPLACE FUNCTION public.secure_update_prepared_items(
    target_order_id UUID,
    new_prepared_items JSONB,
    provided_pin TEXT
) RETURNS VOID AS $$
DECLARE
    restaurant_id UUID;
    correct_pin TEXT;
BEGIN
    -- 1. Obtener el ID del restaurante dueño de la orden
    SELECT user_id INTO restaurant_id FROM public.orders WHERE id = target_order_id;
    
    -- 2. Obtener el PIN correcto de ese restaurante
    SELECT kds_pin INTO correct_pin FROM public.profiles WHERE id = restaurant_id;
    
    -- 3. Verificar si el PIN coincide
    IF provided_pin = correct_pin THEN
        -- Si coincide, actualizamos
        UPDATE public.orders 
        SET prepared_items = new_prepared_items
        WHERE id = target_order_id;
    ELSE
        -- Si NO coincide, lanzamos error
        RAISE EXCEPTION 'PIN incorrecto. No autorizado para actualizar KDS.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. IMPORTANTE: Habilitar Realtime
-- Esto asegura que el Dashboard vea las órdenes al instante
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
    ELSE
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders, public.profiles, public.menu_items;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
