-- ==============================================================================
-- OPTIMIZACIÓN DE ÍNDICES (MESERO APP)
-- ==============================================================================
-- Este script añade índices para mejorar el rendimiento de las consultas frecuentes.
-- Basado en las mejores prácticas de Supabase y Postgres.
-- ==============================================================================

-- 1. ÍNDICES PARA BÚSQUEDA POR RESTAURANTE (USER_ID)
-- Mejora el rendimiento de carga del menú y lista de pedidos para el dueño/staff.
CREATE INDEX IF NOT EXISTS idx_menu_items_user_id ON public.menu_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- 2. ÍNDICES PARA BÚSQUEDA DE STAFF
-- Mejora la vinculación de empleados con el restaurante principal.
CREATE INDEX IF NOT EXISTS idx_profiles_restaurant_id ON public.profiles(restaurant_id);

-- 3. ÍNDICES PARA FILTRADO DE PEDIDOS (STATUS Y CREATED_AT)
-- Mejora el rendimiento del Dashboard y KDS que filtran por estado y ordenan por fecha.
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 4. ÍNDICES PARA BÚSQUEDA DE PLATILLOS POR CATEGORÍA
-- Mejora la navegación del menú digital para el cliente.
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);

-- 5. ÍNDICE GIN PARA BÚSQUEDA EN JSONB (SI SE HACEN BÚSQUEDAS COMPLEJAS)
-- Si en el futuro se buscan ingredientes o items específicos dentro del JSONB.
-- CREATE INDEX IF NOT EXISTS idx_orders_items_gin ON public.orders USING GIN (items);

-- 6. ANALYZE PARA ACTUALIZAR ESTADÍSTICAS
ANALYZE public.profiles;
ANALYZE public.menu_items;
ANALYZE public.orders;
