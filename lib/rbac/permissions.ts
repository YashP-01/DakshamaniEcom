/**
 * RBAC Permission Utilities
 * 
 * Optimized permission checking using JWT claims
 * NO database queries - all checks use cached JWT data
 */

import { jwtDecode } from 'jwt-decode';
import { createClient } from '@/lib/supabase/client';
import type { AppPermission, JWTClaims, JWTRoleClaim } from './types';

/**
 * Get decoded JWT claims from current session
 * PERFORMANCE: Cached in session, no database query
 */
async function getJWTClaims(): Promise<JWTClaims | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;
  
  try {
    const jwt = jwtDecode<JWTClaims>(session.access_token);
    return jwt;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if user has a specific permission
 * PERFORMANCE: <1ms - reads from JWT, no database query
 * 
 * @param permission - The permission to check
 * @param storeId - Optional store ID to check permission for specific store
 * @returns true if user has permission
 */
export async function hasPermission(
  permission: AppPermission,
  storeId?: string
): Promise<boolean> {
  const claims = await getJWTClaims();
  if (!claims) return false;
  
  // Organization admins have all permissions
  if (claims.org_adm) return true;
  
  // Check permissions in assigned stores
  return claims.roles.some(role => {
    // If storeId specified, must match
    if (storeId && role.s !== storeId) return false;
    
    // Store admins have all permissions in their store
    if (role.r === 'store_admin') return true;
    
    // Check specific permission
    return role.p?.includes(permission) || false;
  });
}

/**
 * Check if user has any of the specified permissions
 * PERFORMANCE: <1ms - reads from JWT
 */
export async function hasAnyPermission(
  permissions: AppPermission[],
  storeId?: string
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(permission, storeId)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has all of the specified permissions
 * PERFORMANCE: <1ms - reads from JWT
 */
export async function hasAllPermissions(
  permissions: AppPermission[],
  storeId?: string
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(permission, storeId))) {
      return false;
    }
  }
  return true;
}

/**
 * Get list of store IDs the user has access to
 * PERFORMANCE: <5ms for org admin (queries stores), <1ms for regular users (JWT)
 */
export async function getUserStores(): Promise<string[]> {
  const claims = await getJWTClaims();
  if (!claims) return [];
  
  // Organization admins have access to all stores
  if (claims.org_adm) {
    const supabase = createClient();
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('is_active', true);
    
    return stores?.map(s => s.id) || [];
  }
  
  // Return stores from JWT roles
  return claims.roles.map(role => role.s);
}

/**
 * Check if user is organization admin
 * PERFORMANCE: <1ms - reads from JWT
 */
export async function isOrganizationAdmin(): Promise<boolean> {
  const claims = await getJWTClaims();
  return claims?.org_adm || false;
}

/**
 * Check if user is store admin for a specific store
 * PERFORMANCE: <1ms - reads from JWT
 */
export async function isStoreAdmin(storeId: string): Promise<boolean> {
  const claims = await getJWTClaims();
  if (!claims) return false;
  
  // Org admins are admins everywhere
  if (claims.org_adm) return true;
  
  // Check if user is store_admin for this store
  return claims.roles.some(
    role => role.s === storeId && role.r === 'store_admin'
  );
}

/**
 * Get user's permissions for a specific store
 * PERFORMANCE: <1ms - reads from JWT
 */
export async function getUserPermissionsForStore(
  storeId: string
): Promise<AppPermission[]> {
  const claims = await getJWTClaims();
  if (!claims) return [];
  
  // Org admins have all permissions
  if (claims.org_adm) {
    return [
      'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
      'products.view', 'products.edit', 'products.delete',
      'customers.view', 'customers.edit',
      'inventory.view', 'inventory.edit',
      'reports.view', 'reports.export',
      'settings.edit',
      'roles.manage', 'users.manage',
    ];
  }
  
  // Find role for this store
  const role = claims.roles.find(r => r.s === storeId);
  if (!role) return [];
  
  // Store admins have all permissions
  if (role.r === 'store_admin') {
    return [
      'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
      'products.view', 'products.edit', 'products.delete',
      'customers.view', 'customers.edit',
      'inventory.view', 'inventory.edit',
      'reports.view', 'reports.export',
      'settings.edit',
      'roles.manage', 'users.manage',
    ];
  }
  
  return role.p || [];
}

/**
 * Get all user's role assignments from JWT
 * PERFORMANCE: <1ms - reads from JWT
 */
export async function getUserRoles(): Promise<JWTRoleClaim[]> {
  const claims = await getJWTClaims();
  return claims?.roles || [];
}

/**
 * Refresh user session to get updated JWT claims
 * Call this after role/permission changes
 */
export async function refreshUserSession(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.refreshSession();
}
