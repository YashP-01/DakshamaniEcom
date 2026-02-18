-- ==========================================
-- AUTH HOOK FOR JWT CUSTOM CLAIMS
-- ==========================================
-- This hook runs BEFORE a JWT token is issued and injects role data
-- 
-- PERFORMANCE OPTIMIZATIONS:
-- 1. STABLE function - allows Postgres to cache query plans
-- 2. Single optimized query using LEFT JOIN instead of subqueries
-- 3. Efficient JSONB aggregation
-- 4. Early return for legacy admins (no extra queries)
-- 5. Uses indexed columns for all lookups

-- ==========================================
-- HELPER FUNCTION: Get User Roles (Optimized)
-- ==========================================
CREATE OR REPLACE FUNCTION get_user_roles_optimized(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE -- CRITICAL: STABLE enables query plan caching
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Single optimized query with LEFT JOIN
  -- Uses indexes: idx_user_store_assignments_user, idx_role_permissions_role
  SELECT jsonb_agg(
    jsonb_build_object(
      's', usa.store_id::text, -- Shortened keys to reduce JWT size
      'r', usa.system_role::text,
      'c', cr.name,
      'p', COALESCE(perms.permissions, '[]'::jsonb)
    )
  ) INTO result
  FROM user_store_assignments usa
  LEFT JOIN custom_roles cr ON usa.custom_role_id = cr.id
  LEFT JOIN LATERAL (
    -- Efficient subquery for permissions (runs once per role)
    SELECT jsonb_agg(rp.permission::text) AS permissions
    FROM role_permissions rp
    WHERE rp.role_id = usa.custom_role_id
  ) perms ON true
  WHERE usa.user_id = target_user_id;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ==========================================
-- MAIN AUTH HOOK FUNCTION (Optimized)
-- ==========================================
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE -- CRITICAL: STABLE enables query plan caching
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  target_user_id uuid;
  is_legacy_admin boolean;
  user_roles jsonb;
BEGIN
  claims := event->'claims';
  target_user_id := (event->>'user_id')::uuid;
  
  -- OPTIMIZATION: Check legacy admin first (uses index on customers)
  -- If true, we can skip the expensive role query
  SELECT is_admin INTO is_legacy_admin
  FROM customers
  WHERE id = target_user_id
  AND is_active = true;
  
  IF is_legacy_admin THEN
    -- Legacy admin = organization admin with all permissions
    -- Set minimal claims to reduce JWT size
    claims := jsonb_set(claims, '{org_adm}', 'true'::jsonb);
    claims := jsonb_set(claims, '{roles}', '[]'::jsonb);
  ELSE
    -- Fetch role assignments using optimized helper function
    user_roles := get_user_roles_optimized(target_user_id);
    
    claims := jsonb_set(claims, '{org_adm}', 'false'::jsonb);
    claims := jsonb_set(claims, '{roles}', user_roles);
  END IF;
  
  -- Update claims in the event
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;

-- ==========================================
-- GRANT PERMISSIONS TO SUPABASE AUTH
-- ==========================================
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION get_user_roles_optimized TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION get_user_roles_optimized FROM authenticated, anon, public;

-- Grant table access to auth admin (needed for hook to query tables)
GRANT SELECT ON TABLE public.customers TO supabase_auth_admin;
GRANT SELECT ON TABLE public.user_store_assignments TO supabase_auth_admin;
GRANT SELECT ON TABLE public.custom_roles TO supabase_auth_admin;
GRANT SELECT ON TABLE public.role_permissions TO supabase_auth_admin;

-- Create RLS policies to allow auth admin to read
CREATE POLICY "Allow auth admin to read customers" ON public.customers
  AS PERMISSIVE FOR SELECT
  TO supabase_auth_admin
  USING (true);

CREATE POLICY "Allow auth admin to read user assignments" ON public.user_store_assignments
  AS PERMISSIVE FOR SELECT
  TO supabase_auth_admin
  USING (true);

CREATE POLICY "Allow auth admin to read custom roles" ON public.custom_roles
  AS PERMISSIVE FOR SELECT
  TO supabase_auth_admin
  USING (true);

CREATE POLICY "Allow auth admin to read role permissions" ON public.role_permissions
  AS PERMISSIVE FOR SELECT
  TO supabase_auth_admin
  USING (true);

-- ==========================================
-- AUTHORIZATION HELPER FUNCTION (Optimized)
-- ==========================================
-- Used in RLS policies to check permissions efficiently
-- CRITICAL: Uses JWT claims instead of querying database
CREATE OR REPLACE FUNCTION authorize(
  required_permission app_permission,
  target_store_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE -- STABLE enables query plan caching
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_claims jsonb;
  is_org_admin boolean;
  user_roles jsonb;
  has_permission boolean := false;
BEGIN
  -- Get JWT claims (cached, very fast)
  jwt_claims := auth.jwt();
  
  -- Check organization admin flag (fastest path)
  is_org_admin := COALESCE((jwt_claims->>'org_adm')::boolean, false);
  
  IF is_org_admin THEN
    RETURN true;
  END IF;
  
  -- Get roles from JWT (no database query!)
  user_roles := jwt_claims->'roles';
  
  IF user_roles IS NULL OR jsonb_array_length(user_roles) = 0 THEN
    RETURN false;
  END IF;
  
  -- Check if user has permission
  IF target_store_id IS NULL THEN
    -- Check permission in any store
    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(user_roles) AS role
      WHERE (
        role->>'r' = 'store_admin' OR
        role->'p' @> to_jsonb(required_permission::text)
      )
    ) INTO has_permission;
  ELSE
    -- Check permission for specific store
    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(user_roles) AS role
      WHERE (role->>'s')::uuid = target_store_id
      AND (
        role->>'r' = 'store_admin' OR
        role->'p' @> to_jsonb(required_permission::text)
      )
    ) INTO has_permission;
  END IF;
  
  RETURN has_permission;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION authorize TO authenticated;

-- ==========================================
-- PERFORMANCE METRICS
-- ==========================================
-- Expected performance characteristics:
-- 1. JWT generation: <10ms (uses indexes, single query)
-- 2. Permission check via authorize(): <1ms (reads from JWT, no DB query)
-- 3. RLS policy evaluation: <5ms (uses authorize function + indexes)
-- 4. JWT size: ~1-3KB for typical user with 2-3 roles

-- To monitor performance:
-- SELECT * FROM pg_stat_user_functions WHERE funcname LIKE '%auth%';

COMMENT ON FUNCTION custom_access_token_hook IS 'Auth hook to inject role data into JWT. Optimized with STABLE and efficient queries.';
COMMENT ON FUNCTION get_user_roles_optimized IS 'Helper to fetch user roles efficiently using optimized LATERAL join.';
COMMENT ON FUNCTION authorize IS 'Check if user has permission. Uses JWT claims for performance.';
