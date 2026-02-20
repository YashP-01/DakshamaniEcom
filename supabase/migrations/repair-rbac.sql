-- ==========================================
-- REPAIR SCRIPT: IDEMPOTENT RBAC SETUP
-- ==========================================
-- This script ensures all RBAC components exist regardless of previous failures.
-- Run this ENTIRE file in the SQL Editor.

-- 1. Create Types (Idempotent)
DO $$ BEGIN
  CREATE TYPE system_role AS ENUM ('organization_admin', 'store_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE app_permission AS ENUM (
    'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
    'products.view', 'products.edit', 'products.delete',
    'customers.view', 'customers.edit',
    'inventory.view', 'inventory.edit',
    'reports.view', 'reports.export',
    'settings.edit',
    'roles.manage', 'users.manage'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables (Idempotent)
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_role_per_store UNIQUE(store_id, name),
  CONSTRAINT valid_role_name CHECK (LENGTH(TRIM(name)) > 0)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  permission app_permission NOT NULL,
  CONSTRAINT unique_permission_per_role UNIQUE(role_id, permission)
);

CREATE TABLE IF NOT EXISTS public.user_store_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  system_role system_role,
  custom_role_id UUID REFERENCES custom_roles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_store UNIQUE(user_id, store_id),
  CONSTRAINT role_type_constraint CHECK (
    (system_role IS NOT NULL AND custom_role_id IS NULL) OR
    (system_role IS NULL AND custom_role_id IS NOT NULL)
  )
);

-- 3. Create Indexes (Idempotent)
CREATE INDEX IF NOT EXISTS idx_custom_roles_store_id ON custom_roles(store_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id, permission);
CREATE INDEX IF NOT EXISTS idx_user_store_assignments_user_store ON user_store_assignments(user_id, store_id);

-- 4. Enable RLS
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_store_assignments ENABLE ROW LEVEL SECURITY;

-- 5. Create Functions (Idempotent via OR REPLACE)
CREATE OR REPLACE FUNCTION get_user_roles_optimized(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      's', usa.store_id::text,
      'r', usa.system_role::text,
      'c', cr.name,
      'p', COALESCE(perms.permissions, '[]'::jsonb)
    )
  ) INTO result
  FROM user_store_assignments usa
  LEFT JOIN custom_roles cr ON usa.custom_role_id = cr.id
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(rp.permission::text) AS permissions
    FROM role_permissions rp
    WHERE rp.role_id = usa.custom_role_id
  ) perms ON true
  WHERE usa.user_id = target_user_id;
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  claims jsonb;
  target_user_id uuid;
  is_legacy_admin boolean;
  user_roles jsonb;
BEGIN
  claims := event->'claims';
  target_user_id := (event->>'user_id')::uuid;
  
  SELECT is_admin INTO is_legacy_admin
  FROM customers
  WHERE id = target_user_id AND is_active = true;
  
  IF is_legacy_admin THEN
    claims := jsonb_set(claims, '{org_adm}', 'true'::jsonb);
    claims := jsonb_set(claims, '{roles}', '[]'::jsonb);
  ELSE
    user_roles := get_user_roles_optimized(target_user_id);
    claims := jsonb_set(claims, '{org_adm}', 'false'::jsonb);
    claims := jsonb_set(claims, '{roles}', user_roles);
  END IF;
  
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

CREATE OR REPLACE FUNCTION authorize(
  required_permission app_permission,
  target_store_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  jwt_claims jsonb;
  is_org_admin boolean;
  user_roles jsonb;
  has_permission boolean := false;
BEGIN
  jwt_claims := auth.jwt();
  is_org_admin := COALESCE((jwt_claims->>'org_adm')::boolean, false);
  
  IF is_org_admin THEN RETURN true; END IF;
  
  user_roles := jwt_claims->'roles';
  IF user_roles IS NULL OR jsonb_array_length(user_roles) = 0 THEN RETURN false; END IF;
  
  IF target_store_id IS NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM jsonb_array_elements(user_roles) AS role
      WHERE (role->>'r' = 'store_admin' OR role->'p' @> to_jsonb(required_permission::text))
    ) INTO has_permission;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM jsonb_array_elements(user_roles) AS role
      WHERE (role->>'s')::uuid = target_store_id
      AND (role->>'r' = 'store_admin' OR role->'p' @> to_jsonb(required_permission::text))
    ) INTO has_permission;
  END IF;
  
  RETURN has_permission;
END;
$$;

-- 6. Permissions (Idempotent)
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON role_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_store_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION authorize TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 7. Drop Policies to recreate cleanly
DROP POLICY IF EXISTS "Admins can view custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Store admins can create custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Store admins can update custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Store admins can delete custom roles" ON custom_roles;

DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Store admins can manage role permissions" ON role_permissions;

DROP POLICY IF EXISTS "Admins can view user assignments" ON user_store_assignments;
DROP POLICY IF EXISTS "Admins can create user assignments" ON user_store_assignments;
DROP POLICY IF EXISTS "Admins can update user assignments" ON user_store_assignments;
DROP POLICY IF EXISTS "Admins can delete user assignments" ON user_store_assignments;

-- 8. Recreate Policies
CREATE POLICY "Admins can view custom roles" ON custom_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true) OR
    EXISTS (SELECT 1 FROM user_store_assignments WHERE user_id = auth.uid() AND store_id = custom_roles.store_id AND system_role = 'store_admin')
  );

CREATE POLICY "Store admins can create custom roles" ON custom_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true) OR
    EXISTS (SELECT 1 FROM user_store_assignments WHERE user_id = auth.uid() AND store_id = custom_roles.store_id AND system_role = 'store_admin')
  );

CREATE POLICY "Store admins can update custom roles" ON custom_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true) OR
    EXISTS (SELECT 1 FROM user_store_assignments WHERE user_id = auth.uid() AND store_id = custom_roles.store_id AND system_role = 'store_admin')
  );

CREATE POLICY "Store admins can delete custom roles" ON custom_roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true) OR
    EXISTS (SELECT 1 FROM user_store_assignments WHERE user_id = auth.uid() AND store_id = custom_roles.store_id AND system_role = 'store_admin')
  );

CREATE POLICY "Users can view role permissions" ON role_permissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_roles cr WHERE cr.id = role_permissions.role_id AND (
        EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true) OR
        EXISTS (SELECT 1 FROM user_store_assignments WHERE user_id = auth.uid() AND store_id = cr.store_id)
      )
    )
  );

CREATE POLICY "Store admins can manage role permissions" ON role_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_roles cr WHERE cr.id = role_permissions.role_id AND (
        EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true) OR
        EXISTS (SELECT 1 FROM user_store_assignments WHERE user_id = auth.uid() AND store_id = cr.store_id AND system_role = 'store_admin')
      )
    )
  );

CREATE POLICY "Admins can view user assignments" ON user_store_assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true) OR
    EXISTS (SELECT 1 FROM user_store_assignments usa_check WHERE usa_check.user_id = auth.uid() AND usa_check.store_id = user_store_assignments.store_id AND usa_check.system_role = 'store_admin') OR
    user_id = auth.uid()
  );

CREATE POLICY "Admins can create user assignments" ON user_store_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true) OR
    EXISTS (SELECT 1 FROM user_store_assignments WHERE user_id = auth.uid() AND store_id = user_store_assignments.store_id AND system_role = 'store_admin')
  );

CREATE POLICY "Admins can update user assignments" ON user_store_assignments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true) OR
    EXISTS (SELECT 1 FROM user_store_assignments usa_check WHERE usa_check.user_id = auth.uid() AND usa_check.store_id = user_store_assignments.store_id AND usa_check.system_role = 'store_admin')
  );

CREATE POLICY "Admins can delete user assignments" ON user_store_assignments
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND is_admin = true AND is_active = true) OR
    EXISTS (SELECT 1 FROM user_store_assignments usa_check WHERE usa_check.user_id = auth.uid() AND usa_check.store_id = user_store_assignments.store_id AND usa_check.system_role = 'store_admin')
  );

-- SUCCESS MESSAGE
SELECT 'RBAC System Repaired Successfully' as message;
