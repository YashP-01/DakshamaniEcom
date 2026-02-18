-- ==========================================
-- FIX: CUSTOMER PROFILE INSERT POLICY
-- ==========================================
-- This migration fixes the login issue where users cannot create
-- their customer profile during first login.
--
-- ISSUE: The RBAC migration added SELECT/UPDATE policies for admins
-- but we need to ensure INSERT is still allowed for users creating
-- their own profile during authentication.

-- Ensure the existing INSERT policy is still active
-- Drop and recreate to ensure it's not conflicting
DROP POLICY IF EXISTS "Users can insert own profile" ON customers;

-- Allow authenticated users to insert their own customer profile
CREATE POLICY "Users can insert own profile" ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
  );

-- Also ensure users can still update their own profile
-- (This should already exist but let's make sure)
DROP POLICY IF EXISTS "Users can update own profile" ON customers;

CREATE POLICY "Users can update own profile" ON customers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Note: The "Admins can view all customers" and "Admins can edit customer data"
-- policies from the RBAC migration work alongside these policies.
-- RLS policies are permissive by default (OR logic), so if ANY policy
-- allows the action, it will succeed.

COMMENT ON POLICY "Users can insert own profile" ON customers 
  IS 'Allows users to create their customer profile during first login';
