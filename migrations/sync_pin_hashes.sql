-- ==============================================================================
-- MIGRACIÓN: Sincronización de PINs de Roles y Seguridad de Acceso
-- ==============================================================================

-- 1. Asegurar extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Trigger y función para sincronizar PIN de KDS en public.profiles
CREATE OR REPLACE FUNCTION public.handle_kds_pin_hashing()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.kds_pin IS DISTINCT FROM OLD.kds_pin THEN
        IF NEW.kds_pin IS NULL OR NEW.kds_pin = '' THEN
            NEW.kds_pin_hash := NULL;
        ELSE
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


-- 3. Trigger y función para sincronizar PIN de roles en public.custom_roles
CREATE OR REPLACE FUNCTION public.handle_custom_role_pin_hashing()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.pin_code IS DISTINCT FROM OLD.pin_code THEN
        IF NEW.pin_code IS NULL OR NEW.pin_code = '' THEN
            NEW.pin_code_hash := NULL;
            NEW.requires_pin := FALSE;
        ELSE
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


-- 4. Actualizar de forma retroactiva todos los registros existentes
UPDATE public.profiles
SET kds_pin_hash = crypt(kds_pin, gen_salt('bf', 8))
WHERE kds_pin IS NOT NULL AND kds_pin_hash IS NULL;

UPDATE public.custom_roles
SET pin_code_hash = crypt(pin_code, gen_salt('bf', 8)),
    requires_pin = TRUE
WHERE pin_code IS NOT NULL AND pin_code <> '' AND pin_code_hash IS NULL;

UPDATE public.custom_roles
SET pin_code_hash = NULL,
    requires_pin = FALSE
WHERE (pin_code IS NULL OR pin_code = '') AND (requires_pin IS TRUE OR pin_code_hash IS NOT NULL);


-- 5. Corregir permisos de lectura SELECT para dueños autenticados
-- Esto permite que los propietarios recuperen los PINs configurados al cargar/editar
GRANT SELECT ON public.custom_roles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;


-- 6. Crear función RPC segura para leer información pública de un rol por QR sin fugar PINs
-- Permite que los meseros/personal de QR (usuarios anónimos) consulten si se requiere PIN,
-- pero RLS y permisos bloquearán cualquier SELECT directo a la tabla.
DROP POLICY IF EXISTS "Public Read Custom Roles" ON public.custom_roles;

CREATE OR REPLACE FUNCTION public.get_custom_role_public_info(provided_role_id UUID)
RETURNS TABLE (
    name TEXT,
    permissions JSONB,
    requires_pin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT cr.name, cr.permissions, cr.requires_pin
    FROM public.custom_roles cr
    WHERE cr.id = provided_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_custom_role_public_info(UUID) TO anon, authenticated;
