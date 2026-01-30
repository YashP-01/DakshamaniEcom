-- Add delivery zone columns to stores table
-- This enables identifying which store serves a specific pincode

ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS serviceable_pincodes TEXT[];

-- Add index for better performance if we ever check containment (though exact match is likely handled in app logic)
-- GIN index is good for array operations
CREATE INDEX IF NOT EXISTS idx_stores_serviceable_pincodes ON stores USING GIN (serviceable_pincodes);
