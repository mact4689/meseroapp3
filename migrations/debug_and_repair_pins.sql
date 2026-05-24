-- ==============================================================================
-- DIAGNÓSTICO Y REPARACIÓN UNIVERSAL DE PIN DE SEGURIDAD (MESEROAPP)
-- ==============================================================================
-- Ejecuta este script en el editor SQL de Supabase para reparar y verificar 
-- completamente el funcionamiento de los PINs de seguridad y accesos por QR.


-- 1. Asegurar extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Asegurar columnas de hashes en las tablas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kds_pin_hash TEXT;
ALTER TABLE public.custom_roles ADD COLUMN IF NOT EXISTS pin_code_hash TEXT;
ALTER TABLE public.custom_roles ADD COLUMN IF NOT EXISTS requires_pin BOOLEAN DEFAULT FALSE;

-- 3. Crear/Recrear función de trigger para perfiles KDS
CREATE OR REPLACE FUNCTION public.handle_kds_pin_hashing()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.kds_pin IS DISTINCT FROM OLD.kds_pin THEN
        IF NEW.kds_pin IS NULL OR NEW.kds_pin = '' THEN
            NEW.kds_pin_hash := NULL;
        ELSE
            -- Hashear el PIN de cocina
            NEW.kds_pin_hash := crypt(NEW.kds_pin, gen_salt('bf', 8));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_handle_kds_pin_hashing ON public.profiles;
CREATE TRIGGER trg_handle_kds_pin_hashing
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_kds_pin_hashing();


-- 4. Crear/Recrear función de trigger para roles personalizados (QR)
CREATE OR REPLACE FUNCTION public.handle_custom_role_pin_hashing()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.pin_code IS DISTINCT FROM OLD.pin_code THEN
        IF NEW.pin_code IS NULL OR NEW.pin_code = '' THEN
            NEW.pin_code_hash := NULL;
            NEW.requires_pin := FALSE;
        ELSE
            -- Hashear el PIN del rol
            NEW.pin_code_hash := crypt(NEW.pin_code, gen_salt('bf', 8));
            NEW.requires_pin := TRUE;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_handle_custom_role_pin_hashing ON public.custom_roles;
CREATE TRIGGER trg_handle_custom_role_pin_hashing
BEFORE INSERT OR UPDATE ON public.custom_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_custom_role_pin_hashing();


-- 5. SINCRONIZACIÓN Y REPARACIÓN RETROACTIVA DE PINs EXISTENTES
-- Forzamos la regeneración del hash para todos los que tengan PIN en texto plano
-- de modo que si existiera un hash corrupto o desincronizado, se corrija de inmediato.
UPDATE public.custom_roles
SET pin_code_hash = crypt(pin_code, gen_salt('bf', 8)),
    requires_pin = TRUE
WHERE pin_code IS NOT NULL AND pin_code <> '';

-- Si un rol no tiene pin_code pero tiene hash o requires_pin activo, limpiamos.
UPDATE public.custom_roles
SET pin_code_hash = NULL,
    requires_pin = FALSE
WHERE (pin_code IS NULL OR pin_code = '') 
  AND (pin_code_hash IS NOT NULL OR requires_pin = TRUE);

-- Lo mismo para perfiles KDS (forzamos sincronía)
UPDATE public.profiles
SET kds_pin_hash = crypt(kds_pin, gen_salt('bf', 8))
WHERE kds_pin IS NOT NULL AND kds_pin <> '';

UPDATE public.profiles
SET kds_pin_hash = NULL
WHERE (kds_pin IS NULL OR kds_pin = '') AND kds_pin_hash IS NOT NULL;


-- 6. Recrear permisos generales sobre las tablas para que los dueños recuperen datos en StaffManagement
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_roles TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;


-- 7. Recrear RPC para verificar PINs de Roles por QR
CREATE OR REPLACE FUNCTION public.verify_custom_role(
    provided_role_id UUID,
    provided_pin TEXT
) RETURNS JSONB AS $$
DECLARE
    correct_hash TEXT;
    role_permissions JSONB;
BEGIN
    -- Obtener el hash de PIN y permisos correspondientes al rol
    SELECT pin_code_hash, permissions INTO correct_hash, role_permissions
    FROM public.custom_roles
    WHERE id = provided_role_id;

    -- Si el rol no tiene PIN (correct_hash es null), devolvemos los permisos directamente
    IF correct_hash IS NULL THEN
        RETURN role_permissions;
    END IF;

    -- Validar el PIN ingresado contra el hash criptográfico
    IF correct_hash = crypt(provided_pin, correct_hash) THEN
        RETURN role_permissions;
    ELSE
        RAISE EXCEPTION 'PIN de seguridad de Rol incorrecto. Acceso denegado.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.verify_custom_role(UUID, TEXT) TO anon, authenticated;


-- 8. Recrear RPC para consultar si un rol requiere PIN al escanear QR (sin fugar PIN/hash)
CREATE OR REPLACE FUNCTION public.get_custom_role_public_info(provided_role_id UUID)
RETURNS TABLE (
    name TEXT,
    permissions JSONB,
    requires_pin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT cr.name, cr.permissions, COALESCE(cr.requires_pin, FALSE)
    FROM public.custom_roles cr
    WHERE cr.id = provided_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_custom_role_public_info(UUID) TO anon, authenticated;


-- 9. Recrear RPC para actualización segura del KDS
CREATE OR REPLACE FUNCTION public.secure_update_prepared_items(
    target_order_id UUID,
    new_prepared_items JSONB,
    provided_pin TEXT
) RETURNS VOID AS $$
DECLARE
    restaurant_id UUID;
    correct_hash TEXT;
BEGIN
    SELECT user_id INTO restaurant_id FROM public.orders WHERE id = target_order_id;
    SELECT kds_pin_hash INTO correct_hash FROM public.profiles WHERE id = restaurant_id;
    
    IF correct_hash IS NULL THEN
        correct_hash := crypt('0000', gen_salt('bf', 8));
    END IF;
    
    IF correct_hash = crypt(provided_pin, correct_hash) THEN
        UPDATE public.orders 
        SET prepared_items = new_prepared_items
        WHERE id = target_order_id;
    ELSE
        RAISE EXCEPTION 'PIN incorrecto. No autorizado para actualizar KDS.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.secure_update_prepared_items(UUID, JSONB, TEXT) TO anon, authenticated;


-- 10. REPORTE DE DIAGNÓSTICO
-- Este SELECT final mostrará si los roles y hashes quedaron en perfecta sincronía.
SELECT 
    id, 
    name as nombre_rol, 
    (pin_code IS NOT NULL AND pin_code <> '') as tiene_pin_texto_plano, 
    requires_pin as requiere_pin_booleano, 
    (pin_code_hash IS NOT NULL AND pin_code_hash <> '') as tiene_hash_encriptado,
    CASE 
        -- Simular verificación para comprobar consistencia
        WHEN pin_code IS NULL OR pin_code = '' THEN 'VÁLIDO (Sin PIN)'
        WHEN pin_code_hash = crypt(pin_code, pin_code_hash) THEN 'VÁLIDO (Hash en Sincronía)'
        ELSE 'ERROR (Hash Desincronizado/Plaintext)'
    END as estado_verificacion
FROM public.custom_roles;
