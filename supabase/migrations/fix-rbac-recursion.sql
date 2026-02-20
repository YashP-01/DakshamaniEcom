-- ==========================================
-- FIX: INFINITE RECURSION IN RBAC POLICIES
-- ==========================================
-- Problem: user_store_assignments SELECT policy queries user_store_assignments itself.
--          role_permissions policy also queries user_store_assignments, which triggers
--          the user_store_assignments policy → infinite loop.
--
-- Fix: Use a SECURITY DEFINER helper function that bypasses RLS to check
--      store admin status without triggering policies.

-- ==========================================
-- STEP 1: Create a recursion-safe helper function
-- ==========================================
-- This function runs as the DB owner (bypasses RLS), allowing us to check
-- user_store_assignments without triggering its own RLS policy.

CREATE OR REPLACE FUNCTION public.is_store_admin_no_rls(p_user_id uuid, p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_store_assignments
    WHERE user_id = p_user_id
      AND store_id = p_store_id
      AND system_role = 'store_admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_store_admin_no_rls TO authenticated;

-- ==========================================
-- STEP 2: Fix user_store_assignments policies (remove self-reference)
-- ==========================================

DROP POLICY IF EXISTS "Admins can view user assignments" ON user_store_assignments;
DROP POLICY IF EXISTS "Admins can create user assignments" ON user_store_assignments;
DROP POLICY IF EXISTS "Admins can update user assignments" ON user_store_assignments;
DROP POLICY IF EXISTS "Admins can delete user assignments" ON user_store_assignments;

-- SELECT: Non-recursive. Users see own assignment; legacy admins see all.
CREATE POLICY "Admins can view user assignments" ON user_store_assignments
  FOR SELECT TO authenticated
  USING (
    -- Users always see their own assignment (direct column check — no recursion)
    user_id = auth.uid()
    OR
    -- Legacy admins see all assignments
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
  );

-- INSERT: Use the safe helper function
CREATE POLICY "Admins can create user assignments" ON user_store_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    public.is_store_admin_no_rls(auth.uid(), store_id)
  );

-- UPDATE: Use the safe helper function
CREATE POLICY "Admins can update user assignments" ON user_store_assignments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    public.is_store_admin_no_rls(auth.uid(), store_id)
  );

-- DELETE: Use the safe helper function
CREATE POLICY "Admins can delete user assignments" ON user_store_assignments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE id = auth.uid() AND is_admin = true AND is_active = true
    )
    OR
    public.is_store_admin_no_rls(auth.uid(), store_id)
  );

-- ==========================================
-- STEP 3: Fix role_permissions policies (remove user_store_assignments reference)
-- ==========================================

DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Store admins can manage role permissions" ON role_permissions;

-- SELECT: Legacy admin or safe store admin check
CREATE POLICY "Users can view role permissions" ON role_permissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_roles cr
      WHERE cr.id = role_permissions.role_id
        AND (
          EXISTS (
            SELECT 1 FROM customers
            WHERE id = auth.uid() AND is_admin = true AND is_active = true
          )
          OR
          public.is_store_admin_no_rls(auth.uid(), cr.store_id)
        )
    )
  );

-- ALL (INSERT/UPDATE/DELETE): Legacy admin or safe store admin check
CREATE POLICY "Store admins can manage role permissions" ON role_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_roles cr
      WHERE cr.id = role_permissions.role_id
        AND (
          EXISTS (
            SELECT 1 FROM customers
            WHERE id = auth.uid() AND is_admin = true AND is_active = true
          )
          OR
          public.is_store_admin_no_rls(auth.uid(), cr.store_id)
        )
    )
  );

-- ==========================================
-- STEP 4: Fix custom_roles policies (also reference user_store_assignments)
-- ==========================================

DROP POLICY IF EXISTS "Admins can view custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Store admins can create custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Store admins can update custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Store admins can delete custom roles" ON custom_roles;

CREATE POLICY "Admins can view custom roles" ON custom_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true)
    OR
    public.is_store_admin_no_rls(auth.uid(), store_id)
  );

CREATE POLICY "Store admins can create custom roles" ON custom_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true)
    OR
    public.is_store_admin_no_rls(auth.uid(), store_id)
  );

CREATE POLICY "Store admins can update custom roles" ON custom_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true)
    OR
    public.is_store_admin_no_rls(auth.uid(), store_id)
  );

CREATE POLICY "Store admins can delete custom roles" ON custom_roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true)
    OR
    public.is_store_admin_no_rls(auth.uid(), store_id)
  );

-- SUCCESS
SELECT 'RLS Infinite Recursion Fixed Successfully' AS message;
