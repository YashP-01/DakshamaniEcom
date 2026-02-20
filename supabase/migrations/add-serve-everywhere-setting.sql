-- Add serve_everywhere toggle to store_map_settings
-- When true: accept orders from all pincodes (Warehouse Delivery for unknown)
-- When false: block checkout for unrecognized pincodes

ALTER TABLE store_map_settings
ADD COLUMN IF NOT EXISTS serve_everywhere BOOLEAN NOT NULL DEFAULT true;
