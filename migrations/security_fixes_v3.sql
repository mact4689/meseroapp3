-- =======================================================================
-- MIGRACIÓN DE SEGURIDAD V3: HASHING DE PINS, FUNCIONES SECURE RPC Y STORAGE
-- =======================================================================

-- 1. Activar extensión criptográfica para usar hashing seguro (Bcrypt/Blowfish)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Añadir columnas para hashes criptográficos de PINs si no existen
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kds_pin_hash TEXT;
ALTER TABLE public.custom_roles ADD COLUMN IF NOT EXISTS pin_code_hash TEXT;

-- Añadir columna pública para saber si un rol requiere PIN (completamente segura, solo booleano)
ALTER TABLE public.custom_roles ADD COLUMN IF NOT EXISTS requires_pin BOOLEAN DEFAULT TRUE;

-- 3. Inicializar hashes basados en los PINs de texto plano actuales (desarrollo/producción)
-- Usamos Blowfish (bf) con un factor de costo de 8 para máxima compatibilidad y velocidad ideal
UPDATE public.profiles 
SET kds_pin_hash = crypt(coalesce(kds_pin, '0000'), gen_salt('bf', 8)) 
WHERE kds_pin_hash IS NULL;

UPDATE public.custom_roles 
SET pin_code_hash = crypt(coalesce(pin_code, '1234'), gen_salt('bf', 8)) 
WHERE pin_code_hash IS NULL AND pin_code IS NOT NULL;

-- Establecer el valor correcto de requires_pin
UPDATE public.custom_roles
SET requires_pin = (pin_code IS NOT NULL AND pin_code <> '');

-- 4. Revocar acceso de lectura directa sobre las columnas sensibles de PIN y Hash
-- Esto garantiza que un 'SELECT *' desde el cliente anónimo (anon) o autenticado no retorne los secretos
REVOKE SELECT (kds_pin, kds_pin_hash) ON public.profiles FROM anon, authenticated;
REVOKE SELECT (pin_code, pin_code_hash) ON public.custom_roles FROM anon, authenticated;

-- 5. Rediseñar la función de actualización de KDS de manera segura
-- Habilitamos SECURITY DEFINER para elevar privilegios, forzamos SET search_path = public para evitar secuestros (Search Path Hijacking),
-- y validamos criptográficamente el PIN en el servidor sin exponer secretos al cliente.
CREATE OR REPLACE FUNCTION public.secure_update_prepared_items(
    target_order_id UUID,
    new_prepared_items JSONB,
    provided_pin TEXT
) RETURNS VOID AS $$
DECLARE
    restaurant_id UUID;
    correct_hash TEXT;
BEGIN
    -- Obtener el ID del restaurante/perfil asociado al pedido
    SELECT user_id INTO restaurant_id FROM public.orders WHERE id = target_order_id;
    
    -- Obtener el Hash del PIN de KDS del perfil
    SELECT kds_pin_hash INTO correct_hash FROM public.profiles WHERE id = restaurant_id;
    
    -- Si no hay hash configurado, asumimos "0000" para no bloquear la migración
    IF correct_hash IS NULL THEN
        correct_hash := crypt('0000', gen_salt('bf', 8));
    END IF;
    
    -- Comparar usando crypt (retorna el hash si coincide)
    IF correct_hash = crypt(provided_pin, correct_hash) THEN
        UPDATE public.orders 
        SET prepared_items = new_prepared_items
        WHERE id = target_order_id;
    ELSE
        RAISE EXCEPTION 'PIN incorrecto. No autorizado para actualizar KDS.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Crear función segura verify_custom_role para validar PINs del personal (QR)
-- Evita exponer los PINs al cliente web. Retorna los permisos del rol si la validación es exitosa.
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

    -- Validar el PIN ingresado con el hash de base de datos
    IF correct_hash = crypt(provided_pin, correct_hash) THEN
        RETURN role_permissions;
    ELSE
        RAISE EXCEPTION 'PIN de seguridad de Rol incorrecto. Acceso denegado.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Asegurar políticas del Storage (Bucket 'images')
-- Eliminamos políticas generales de subida demasiado abiertas
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Creamos políticas granulares para restringir operaciones de escritura al folder de cada usuario:
-- "menu/{restaurant_id}/" y "menu/gallery/{restaurant_id}/"
CREATE POLICY "Users can upload images to their own restaurant folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images' AND
    auth.role() = 'authenticated' AND
    (
      name LIKE 'menu/' || auth.uid()::text || '/%' OR
      name LIKE 'menu/gallery/' || auth.uid()::text || '/%'
    )
  );

CREATE POLICY "Users can update images in their own restaurant folder"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images' AND
    auth.role() = 'authenticated' AND
    (
      name LIKE 'menu/' || auth.uid()::text || '/%' OR
      name LIKE 'menu/gallery/' || auth.uid()::text || '/%'
    )
  );

CREATE POLICY "Users can delete images in their own restaurant folder"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images' AND
    auth.role() = 'authenticated' AND
    (
      name LIKE 'menu/' || auth.uid()::text || '/%' OR
      name LIKE 'menu/gallery/' || auth.uid()::text || '/%'
    )
  );
