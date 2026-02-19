-- Add pin_code column to custom_roles table
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS pin_code text;
COMMENT ON COLUMN custom_roles.pin_code IS '4-digit PIN for role access';
