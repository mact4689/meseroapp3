-- MIGRACION KDS Y TICKET DESIGNER
-- Fecha: 2026-01-29

-- 1. Crear tabla de Estaciones de Cocina
CREATE TABLE IF NOT EXISTS public.kitchen_stations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.kitchen_stations ENABLE ROW LEVEL SECURITY;

-- Politicas RLS para Estaciones
DROP POLICY IF EXISTS "Public Read Stations" ON public.kitchen_stations;
CREATE POLICY "Public Read Stations" ON public.kitchen_stations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner Manage Stations" ON public.kitchen_stations;
CREATE POLICY "Owner Manage Stations" ON public.kitchen_stations FOR ALL USING (auth.uid() = user_id);

-- 2. Agregar Station ID a Menu Items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'station_id') THEN
        ALTER TABLE public.menu_items ADD COLUMN station_id uuid REFERENCES public.kitchen_stations(id);
    END IF;
END $$;

-- 3. Agregar Prepared Items tracking a Orders
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'prepared_items') THEN
        ALTER TABLE public.orders ADD COLUMN prepared_items jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 4. Actualizar publicaciones de Realtime si es necesario
-- (Supabase realtime suele incluir nuevas columnas automatico, pero nos aseguramos de que kitchen_stations este en publication)
ALTER PUBLICATION supabase_realtime ADD TABLE public.kitchen_stations;
