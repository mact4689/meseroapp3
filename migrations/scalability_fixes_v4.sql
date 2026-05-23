-- =======================================================================
-- MIGRACIÓN DE ESCALABILIDAD V4: ÍNDICES DE BASE DE DATOS
-- =======================================================================

-- Agregar índice a la tabla kitchen_stations para mejorar el rendimiento de
-- consultas KDS que filtran frecuentemente por user_id, evitando Full Table Scans.

CREATE INDEX IF NOT EXISTS idx_kitchen_stations_user_id ON public.kitchen_stations(user_id);
