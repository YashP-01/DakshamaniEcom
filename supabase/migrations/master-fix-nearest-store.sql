-- MASTER FIX SCRIPT
-- Run this ENTIRE script in Supabase SQL Editor to fix everything at once.

-- 1. Ensure column exists and is correct type
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS serviceable_pincodes TEXT[];

-- 2. Force Enable RLS to ensure we can set policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- 3. RESET Policies (Drop all to be safe)
DROP POLICY IF EXISTS "Public stores are viewable by everyone" ON stores;
DROP POLICY IF EXISTS "Public can view stores" ON stores;
DROP POLICY IF EXISTS "Enable read access for all users" ON stores;

-- 4. Create correct Policy for PUBLIC READ
CREATE POLICY "Enable read access for all users" 
ON stores FOR SELECT 
USING (true);

-- 5. Explicitly Grant Access to Roles (Fixes "null" column issue)
GRANT SELECT ON TABLE "public"."stores" TO "anon";
GRANT SELECT ON TABLE "public"."stores" TO "authenticated";
GRANT SELECT ON TABLE "public"."stores" TO "service_role";

-- 6. Force Update the Delhi Store Data
UPDATE stores
SET serviceable_pincodes = ARRAY['110070']
WHERE name LIKE '%Delhi%';

-- 7. Verify Result (This will show in the results pane)
SELECT id, name, serviceable_pincodes FROM stores WHERE name LIKE '%Delhi%';
