-- Add additional_images column to menu_items table
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS additional_images text[];
