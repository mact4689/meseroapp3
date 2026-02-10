-- ==============================================================================
-- 🔧 FIX: KDS Prepared Items - Ejecutar en Supabase SQL Editor
-- ==============================================================================
-- Fecha: 2026-02-09
-- Problema: Al tocar un item en el KDS, se marca "listo" y luego se revierte
-- Causa: La función RPC secure_update_prepared_items no existe o hay problemas de RLS
-- ==============================================================================

-- 1. Asegurar que la columna kds_pin existe en profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kds_pin TEXT DEFAULT '0000';

-- 2. Crear/Actualizar la función segura para KDS
CREATE OR REPLACE FUNCTION public.secure_update_prepared_items(
    target_order_id UUID,
    new_prepared_items JSONB,
    provided_pin TEXT
) RETURNS VOID AS $$
DECLARE
    v_restaurant_id UUID;
    v_correct_pin TEXT;
BEGIN
    -- 1. Obtener el ID del restaurante dueño de la orden
    SELECT user_id INTO v_restaurant_id FROM public.orders WHERE id = target_order_id;
    
    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'Orden no encontrada: %', target_order_id;
    END IF;
    
    -- 2. Obtener el PIN correcto de ese restaurante (default: 0000)
    SELECT COALESCE(kds_pin, '0000') INTO v_correct_pin FROM public.profiles WHERE id = v_restaurant_id;
    
    -- Si no hay perfil, usar PIN por defecto
    IF v_correct_pin IS NULL THEN
        v_correct_pin := '0000';
    END IF;
    
    -- 3. Verificar si el PIN coincide
    IF provided_pin = v_correct_pin THEN
        -- Si coincide, actualizamos
        UPDATE public.orders 
        SET prepared_items = new_prepared_items
        WHERE id = target_order_id;
    ELSE
        -- Si NO coincide, lanzamos error descriptivo
        RAISE EXCEPTION 'PIN incorrecto. Proporcionado: %, Esperado: % (primeros 2 chars)', 
            LEFT(provided_pin, 2), LEFT(v_correct_pin, 2);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Dar permisos de ejecución a anónimos y autenticados
GRANT EXECUTE ON FUNCTION public.secure_update_prepared_items(UUID, JSONB, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.secure_update_prepared_items(UUID, JSONB, TEXT) TO authenticated;

-- 4. Verificar que RLS esté habilitado
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Política de lectura pública para órdenes (necesario para KDS)
DROP POLICY IF EXISTS "Public View Orders" ON public.orders;
CREATE POLICY "Public View Orders" ON public.orders 
FOR SELECT USING (true);

-- 6. Política para que se puedan crear órdenes
DROP POLICY IF EXISTS "Public Create Orders" ON public.orders;
CREATE POLICY "Public Create Orders" ON public.orders 
FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- ✅ VERIFICACIÓN: Ejecuta esto después para confirmar que la función existe
-- ==============================================================================
-- SELECT proname FROM pg_proc WHERE proname = 'secure_update_prepared_items';
-- Debería retornar 1 fila

-- ==============================================================================
-- 🧪 TEST MANUAL: Si quieres probar la función directamente
-- ==============================================================================
-- SELECT secure_update_prepared_items(
--     'tu-order-id-aqui'::uuid,
--     '[{"itemId": "test", "stationId": "test", "completedAt": 123}]'::jsonb,
--     '0000'
-- );

