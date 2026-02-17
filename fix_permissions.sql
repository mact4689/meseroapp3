-- Habilitar RLS en las tablas importantes (por seguridad)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 1. Permitir lectura pública de perfiles (necesario para ver el logo y nombre del restaurante al escanear QR)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- 2. Permitir lectura pública del menú (necesario para ver los platillos sin iniciar sesión)
DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON menu_items;
CREATE POLICY "Menu items are viewable by everyone" 
ON menu_items FOR SELECT 
USING (true);

-- 3. Permitir creación pública de órdenes (necesario para que clientes sin cuenta puedan ordenar)
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" 
ON orders FOR INSERT 
WITH CHECK (true);
