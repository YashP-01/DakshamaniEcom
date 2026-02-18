-- ==========================================
-- DIAGNOSTIC QUERIES FOR LOGIN ISSUE
-- ==========================================
-- Run these queries in Supabase SQL Editor to diagnose login issues

-- 1. Check if your admin user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'vashishthpatel478@gmail.com';
-- Copy the ID from above for the next queries

-- 2. Check if customer profile exists
SELECT id, email, is_admin, is_active, created_at
FROM customers
WHERE email = 'vashishthpatel478@gmail.com';

-- 3. Check for any RBAC role assignments (replace <USER_ID> with ID from query 1)
SELECT * 
FROM user_store_assignments
WHERE user_id = '<USER_ID>';

-- 4. Check all RLS policies on customers table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'customers'
ORDER BY policyname;

-- 5. Test if you can insert a customer profile manually 
-- (replace <USER_ID> with actual ID from query 1)
/*
INSERT INTO customers (id, email, is_admin, is_active)
VALUES ('<USER_ID>', 'vashishthpatel478@gmail.com', true, true)
ON CONFLICT (id) DO UPDATE SET is_admin = true, is_active = true;
*/

-- 6. If customer already exists but isn't admin, update them:
/*
UPDATE customers 
SET is_admin = true, is_active = true
WHERE email = 'vashishthpatel478@gmail.com';
*/
