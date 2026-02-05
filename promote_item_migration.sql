-- Migration to add promotion support to menu items
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE;
