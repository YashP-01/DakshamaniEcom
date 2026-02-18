-- ==========================================
-- FIX: INFINITE RECURSION IN CUSTOMERS RLS
-- ==========================================
-- This migration fixes the infinite recursion error caused by
-- customers table policies checking the customers table itself.
--
-- PROBLEM: Policies on customers were doing:
--   SELECT 1 FROM customers WHERE id = auth.uid()
-- This creates infinite recursion!
--
-- SOLUTION: Use only JWT-based checks (authorize function)
-- and auth.uid() comparisons, no recursive table queries.

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Admins can edit customer data" ON customers;

-- Recreated without recursive checks
-- Users can view their own profile OR have customers.view permission (from JWT)
CREATE POLICY "Users can view own profile or with permission" ON customers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR
    authorize('customers.view'::app_permission)
  );

-- Users can update their own profile OR have customers.edit permission (from JWT)
CREATE POLICY "Users can update own profile or with permission" ON customers
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR
    authorize('customers.edit'::app_permission)
  );

-- Note: The authorize() function reads from JWT claims only,
-- it does NOT query the database, so no recursion!

COMMENT ON POLICY "Users can view own profile or with permission" ON customers
  IS 'No recursion - uses JWT claims only via authorize()';
