-- Force update the specific store with the pincode
-- This bypasses any admin panel issues
UPDATE stores
SET serviceable_pincodes = ARRAY['110070']
WHERE name LIKE '%Delhi%';

-- Verify the update immediately
SELECT id, name, serviceable_pincodes FROM stores WHERE name LIKE '%Delhi%';
