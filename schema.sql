-- ==============================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS (MESERO APP)
-- ==============================================================================
-- ⚠️ ADVERTENCIA: Este script reinicia la base de datos (BORRA DATOS EXISTENTES)
-- Úsalo solo para inicializar un proyecto nuevo o resetear todo.
-- ==============================================================================

-- 1. LIMPIEZA INICIAL
DROP PUBLICATION IF EXISTS supabase_realtime;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. EXTENSIONES
create extension if not exists "pgcrypto";

-- 3. TABLAS

-- TABLA: profiles (Restaurantes y Staff)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  cuisine text,
  logo_url text,
  tables_count int default 0,
  role text default 'owner', -- 'owner' | 'waiter' | 'cook'
  restaurant_id uuid references public.profiles(id) on delete cascade, -- For staff linking to restaurant owner
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- TABLA: menu_items (Platillos)
create table public.menu_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  price numeric not null,
  category text not null,
  description text,
  ingredients text,
  image_url text,
  available boolean default true,
  printer_id text,
  created_at timestamptz default now()
);
alter table public.menu_items enable row level security;

-- TABLA: orders (Pedidos)
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  table_number text not null,
  status text check (status in ('pending', 'completed', 'cancelled')) default 'pending',
  total numeric not null,
  items jsonb not null,
  created_at timestamptz default now()
);
alter table public.orders enable row level security;

-- 4. POLÍTICAS DE SEGURIDAD (RLS)

-- PROFILES
create policy "Public Read Profiles" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- MENU_ITEMS
create policy "Public Read Menu" on public.menu_items for select using (true);
create policy "Users can insert their own menu items" on public.menu_items for insert with check (auth.uid() = user_id);
create policy "Users can update their own menu items" on public.menu_items for update using (auth.uid() = user_id);
create policy "Users can delete their own menu items" on public.menu_items for delete using (auth.uid() = user_id);

-- ORDERS
-- Permitir inserción pública (Clientes sin cuenta)
create policy "Anyone can create orders" on public.orders for insert with check (true);
-- Dueños solo ven/editan sus órdenes
create policy "Restaurant owners can view their orders" on public.orders for select using (auth.uid() = user_id);
create policy "Restaurant owners can update their orders" on public.orders for update using (auth.uid() = user_id);

-- 5. STORAGE (Bucket de imágenes)
insert into storage.buckets (id, name, public) values ('images', 'images', true) on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using ( bucket_id = 'images' );

drop policy if exists "Authenticated users can upload images" on storage.objects;
create policy "Authenticated users can upload images" on storage.objects for insert with check ( bucket_id = 'images' and auth.role() = 'authenticated' );

drop policy if exists "Users can update their own images" on storage.objects;
create policy "Users can update their own images" on storage.objects for update using ( bucket_id = 'images' and auth.uid() = owner );

drop policy if exists "Users can delete their own images" on storage.objects;
create policy "Users can delete their own images" on storage.objects for delete using ( bucket_id = 'images' and auth.uid() = owner );

-- 6. REALTIME (Notificaciones en vivo)
create publication supabase_realtime for table public.orders, public.menu_items;

-- 7. TRIGGERS
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, cuisine, tables_count)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Nuevo Restaurante'), 'General', 0);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
