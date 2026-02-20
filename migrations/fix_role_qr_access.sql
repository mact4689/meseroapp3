-- ==============================================================================
-- MIGRACIÓN DE CORRECCIÓN: Acceso Público a Roles Personalizados
-- ==============================================================================
-- Esta migración permite que cualquier usuario (incluidos los no autenticados,
-- como quienes escanean un QR) pueda leer la tabla 'custom_roles'.
-- Esto es necesario para verificar si un rol requiere PIN antes de acceder.
-- ==============================================================================

-- 1. Eliminar política anterior si existe (para evitar conflictos)
DROP POLICY IF EXISTS "Public Read Custom Roles" ON public.custom_roles;

-- 2. Crear nueva política de lectura pública
CREATE POLICY "Public Read Custom Roles" 
ON public.custom_roles 
FOR SELECT 
USING (true);

-- ==============================================================================
-- INSTRUCCIONES:
-- Ejecuta este script en el Editor SQL de tu panel de Supabase.
-- ==============================================================================
