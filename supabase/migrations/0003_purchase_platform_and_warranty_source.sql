-- Add purchase_platform and warranty_source to the equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS purchase_platform text;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS warranty_source text;
