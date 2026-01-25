-- ⚠️ PRECAUCIÓN: Esto borrará los datos existentes para empezar de cero
-- Eliminamos las tablas viejas/existentes para evitar errores de duplicados
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON public.menu_items;
DROP POLICY IF EXISTS "Users can insert their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can update their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can delete their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Restaurant owners can update their orders" ON public.orders;

DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Habilitar extensión para UUIDs
create extension if not exists "pgcrypto";

-- 2. TABLA: profiles (Información del Restaurante)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  cuisine text,
  logo_url text,
  tables_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS para profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

create policy "Users can insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- 3. TABLA: menu_items (Platillos)
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

-- RLS para menu_items
alter table public.menu_items enable row level security;

create policy "Menu items are viewable by everyone" 
  on public.menu_items for select 
  using (true);

create policy "Users can insert their own menu items" 
  on public.menu_items for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own menu items" 
  on public.menu_items for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own menu items" 
  on public.menu_items for delete 
  using (auth.uid() = user_id);


-- 4. TABLA: orders (Pedidos)
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null, -- ID del Restaurante
  table_number text not null,
  status text check (status in ('pending', 'completed', 'cancelled')) default 'pending',
  total numeric not null,
  items jsonb not null, -- Guarda el array de items del pedido
  created_at timestamptz default now()
);

-- RLS para orders
alter table public.orders enable row level security;

create policy "Anyone can create orders" 
  on public.orders for insert 
  with check (true);

create policy "Restaurant owners can view their orders" 
  on public.orders for select 
  using (auth.uid() = user_id);

create policy "Restaurant owners can update their orders" 
  on public.orders for update 
  using (auth.uid() = user_id);

-- 5. STORAGE (Imágenes)
-- Intentamos crear el bucket solo si no existe
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Eliminamos políticas viejas de storage para evitar duplicados al recrearlas
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Users can update their own images" on storage.objects;
drop policy if exists "Users can delete their own images" on storage.objects;

-- Políticas de Storage Nuevas
create policy "Public Access" 
  on storage.objects for select 
  using ( bucket_id = 'images' );

create policy "Authenticated users can upload images" 
  on storage.objects for insert 
  with check ( bucket_id = 'images' and auth.role() = 'authenticated' );

create policy "Users can update their own images" 
  on storage.objects for update
  using ( bucket_id = 'images' and auth.uid() = owner );

create policy "Users can delete their own images" 
  on storage.objects for delete
  using ( bucket_id = 'images' and auth.uid() = owner );

-- 6. TRIGGER: Creación automática de perfil
-- Esta función se ejecuta automáticamente cada vez que alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, cuisine, tables_count)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', 'Nuevo Restaurante'), 
    'General', 
    0
  );
  return new;
end;
$$;

-- Configurar el trigger en la tabla de autenticación
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
