-- ==============================================================================
-- SCRIPT PARA HABILITAR TIEMPO REAL (REALTIME)
-- ==============================================================================
-- Para que las órdenes aparezcan automáticamente sin recargar la página,
-- debes habilitar la "Publicación" de Realtime para la tabla de órdenes using this SQL.
-- ==============================================================================

-- 1. Añadir tablas a la publicación de Realtime de Supabase
-- Esto permite que Supabase envíe notificaciones a la app cuando hay cambios.

begin;
  -- Habilitar realtime para ordenes (IMPORTANTE)
  alter publication supabase_realtime add table public.orders;

  -- Habilitar realtime para items del menú (Opcional, para ver cambios de precio al instante)
  alter publication supabase_realtime add table public.menu_items;
commit;

-- ==============================================================================
-- FIN DEL SCRIPT
-- Ejecuta esto en el SQL Editor de Supabase y luego recarga tu Dashboard.
-- ==============================================================================
