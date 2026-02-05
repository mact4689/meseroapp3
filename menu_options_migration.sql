-- ==============================================================================
-- MIGRACIÓN: Agregar soporte para Variaciones/Opciones de Platillos
-- ==============================================================================
-- Este script añade una columna JSONB para almacenar opciones configurables
-- por platillo (ej: sabores, tamaños, extras).
-- 
-- ESTRUCTURA DE OPTIONS (JSONB):
-- {
--   "hasOptions": true,
--   "groups": [
--     {
--       "id": "uuid",
--       "name": "Escoge tu sabor",
--       "required": true,
--       "minSelect": 1,
--       "maxSelect": 2,
--       "options": [
--         { "id": "uuid", "name": "Vainilla", "priceModifier": 0 },
--         { "id": "uuid", "name": "Pistacho", "priceModifier": 15 }
--       ]
--     }
--   ]
-- }
-- ==============================================================================

-- 1. Añadir columna 'options' a menu_items
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS options jsonb DEFAULT NULL;

-- 2. Añadir columna 'station_id' (si no existe, para compatibilidad con KDS)
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS station_id text DEFAULT NULL;

-- 3. Comentario para documentación
COMMENT ON COLUMN public.menu_items.options IS 'JSONB con grupos de opciones configurables (sabores, tamaños, extras)';

-- ==============================================================================
-- FIN DE LA MIGRACIÓN
-- ==============================================================================
