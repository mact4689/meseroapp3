-- --------------------------------------------------------
-- FIX: PERMITIR ESTADO 'delivered' ('Enterado') EN ÓRDENES
-- --------------------------------------------------------
-- El botón "Enterado" intenta actualizar el estado a 'delivered',
-- pero la base de datos tenía una restricción (CHECK constraint)
-- que solo permitía 'pending', 'completed', 'cancelled'.
-- Esto hacía que la actualización fallara silenciosamente en el backend
-- aunque la interfaz la mostraba como exitosa (optimistic update).

-- 1. Eliminar la restricción anterior
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Agregar la nueva restricción incluyendo 'delivered'
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'delivered'));

-- 3. Confirmación (Opcional, solo para verificar)
COMMENT ON COLUMN public.orders.status IS 'pending, completed, cancelled, delivered';
