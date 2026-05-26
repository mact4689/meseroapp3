-- ==============================================================================
-- REPARACIÓN ROBUSTA DE TRIGGERS Y FUNCIONES RPC (MESEROAPP)
-- ==============================================================================
-- Ejecuta este script en el editor SQL de Supabase para corregir
-- errores de ejecución en triggers y llamadas a funciones criptográficas.

-- 1. Asegurar extensión pgcrypto en el esquema extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- 2. Corregir y Recrear función de trigger para perfiles KDS
-- Evita el acceso a la variable OLD durante operaciones de INSERT
CREATE OR REPLACE FUNCTION public.handle_kds_pin_hashing()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.kds_pin IS NULL OR NEW.kds_pin = '' THEN
            NEW.kds_pin_hash := NULL;
        ELSE
            NEW.kds_pin_hash := extensions.crypt(NEW.kds_pin, extensions.gen_salt('bf', 8));
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.kds_pin IS DISTINCT FROM OLD.kds_pin THEN
            IF NEW.kds_pin IS NULL OR NEW.kds_pin = '' THEN
                NEW.kds_pin_hash := NULL;
            ELSE
                NEW.kds_pin_hash := extensions.crypt(NEW.kds_pin, extensions.gen_salt('bf', 8));
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

DROP TRIGGER IF EXISTS trg_handle_kds_pin_hashing ON public.profiles;
CREATE TRIGGER trg_handle_kds_pin_hashing
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_kds_pin_hashing();


-- 3. Corregir y Recrear función de trigger para roles de personal (QR)
-- Asegura el uso explícito de extensions.crypt y extensions.gen_salt
CREATE OR REPLACE FUNCTION public.handle_custom_role_pin_hashing()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.pin_code IS NULL OR NEW.pin_code = '' THEN
            NEW.pin_code_hash := NULL;
            NEW.requires_pin := FALSE;
        ELSE
            NEW.pin_code_hash := extensions.crypt(NEW.pin_code, extensions.gen_salt('bf', 8));
            NEW.requires_pin := TRUE;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.pin_code IS DISTINCT FROM OLD.pin_code THEN
            IF NEW.pin_code IS NULL OR NEW.pin_code = '' THEN
                NEW.pin_code_hash := NULL;
                NEW.requires_pin := FALSE;
            ELSE
                NEW.pin_code_hash := extensions.crypt(NEW.pin_code, extensions.gen_salt('bf', 8));
                NEW.requires_pin := TRUE;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

DROP TRIGGER IF EXISTS trg_handle_custom_role_pin_hashing ON public.custom_roles;
CREATE TRIGGER trg_handle_custom_role_pin_hashing
BEFORE INSERT OR UPDATE ON public.custom_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_custom_role_pin_hashing();


-- 4. Recrear RPC para verificar PIN de Roles por QR
-- Garantiza acceso a extensions.crypt
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
    IF correct_hash = extensions.crypt(provided_pin, correct_hash) THEN
        RETURN role_permissions;
    ELSE
        RAISE EXCEPTION 'PIN de seguridad de Rol incorrecto. Acceso denegado.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.verify_custom_role(UUID, TEXT) TO anon, authenticated;


-- 5. Recrear RPC para actualización segura del KDS
-- Garantiza acceso a extensions.crypt y extensions.gen_salt
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
        correct_hash := extensions.crypt('0000', extensions.gen_salt('bf', 8));
    END IF;
    
    IF correct_hash = extensions.crypt(provided_pin, correct_hash) THEN
        UPDATE public.orders 
        SET prepared_items = new_prepared_items
        WHERE id = target_order_id;
    ELSE
        RAISE EXCEPTION 'PIN incorrecto. No autorizado para actualizar KDS.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.secure_update_prepared_items(UUID, JSONB, TEXT) TO anon, authenticated;

-- ==============================================================================
-- COMPROBACIÓN FINAL
-- ==============================================================================
SELECT 'REPARACIÓN EXITOSA' as resultado;
