-- Allow public read access to custom_roles so unauthenticated users (scanning QR codes) can fetch permissions
create policy "Public Read Custom Roles" on public.custom_roles for select using (true);
