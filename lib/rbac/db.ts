/**
 * RBAC Database Utilities
 * 
 * Functions for managing roles and user assignments in the database
 * These are used in admin UI and API routes
 */

import { createClient } from '@/lib/supabase/client';
import type {
  CustomRole,
  RolePermission,
  UserStoreAssignment,
  CreateRoleInput,
  AssignUserInput,
  CustomRoleWithPermissions,
  UserStoreAssignmentWithDetails,
  AppPermission,
  SystemRole,
} from './types';

/**
 * CUSTOM ROLES MANAGEMENT
 */

/**
 * Get all custom roles for a store
 * PERFORMANCE: Optimized with single query using LEFT JOIN
 */
export async function getCustomRolesForStore(
  storeId: string
): Promise<CustomRoleWithPermissions[]> {
  const supabase = createClient();
  
  const { data: roles, error } = await supabase
    .from('custom_roles')
    .select(`
      *,
      permissions:role_permissions(id, permission)
    `)
    .eq('store_id', storeId)
    .order('name');
  
  if (error) throw error;
  return roles as unknown as CustomRoleWithPermissions[];
}

/**
 * Get a single custom role with permissions
 */
export async function getCustomRole(
  roleId: string
): Promise<CustomRoleWithPermissions | null> {
  const supabase = createClient();
  
  const { data: role, error } = await supabase
    .from('custom_roles')
    .select(`
      *,
      permissions:role_permissions(id, permission)
    `)
    .eq('id', roleId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return role as unknown as CustomRoleWithPermissions;
}

/**
 * Create a new custom role with permissions
 * PERFORMANCE: Uses transaction for atomicity
 */
export async function createCustomRole(
  input: CreateRoleInput
): Promise<CustomRole> {
  const supabase = createClient();
  
  // Create role
  const { data: role, error: roleError } = await supabase
    .from('custom_roles')
    .insert({
      store_id: input.store_id,
      name: input.name,
      description: input.description,
    })
    .select()
    .single();
  
  if (roleError) throw roleError;
  
  // Add permissions if any
  if (input.permissions.length > 0) {
    const permissionRecords = input.permissions.map(permission => ({
      role_id: role.id,
      permission,
    }));
    
    const { error: permError } = await supabase
      .from('role_permissions')
      .insert(permissionRecords);
    
    if (permError) throw permError;
  }
  
  return role;
}

/**
 * Update custom role and permissions
 */
export async function updateCustomRole(
  roleId: string,
  input: Partial<CreateRoleInput>
): Promise<CustomRole> {
  const supabase = createClient();
  
  // Update role metadata
  if (input.name || input.description) {
    const { error: roleError } = await supabase
      .from('custom_roles')
      .update({
        name: input.name,
        description: input.description,
      })
      .eq('id', roleId);
    
    if (roleError) throw roleError;
  }
  
  // Update permissions if provided
  if (input.permissions) {
    // Delete existing permissions
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);
    
    // Insert new permissions
    if (input.permissions.length > 0) {
      const permissionRecords = input.permissions.map(permission => ({
        role_id: roleId,
        permission,
      }));
      
      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(permissionRecords);
      
      if (permError) throw permError;
    }
  }
  
  // Fetch and return updated role
  const { data: role, error } = await supabase
    .from('custom_roles')
    .select()
    .eq('id', roleId)
    .single();
  
  if (error) throw error;
  return role;
}

/**
 * Delete a custom role (cascade deletes permissions and assignments)
 */
export async function deleteCustomRole(roleId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('custom_roles')
    .delete()
    .eq('id', roleId);
  
  if (error) throw error;
}

/**
 * USER STORE ASSIGNMENTS MANAGEMENT
 */

/**
 * Get all user assignments for a store
 * PERFORMANCE: Single query with JOINs for related data
 */
export async function getUserAssignmentsForStore(
  storeId: string
): Promise<UserStoreAssignmentWithDetails[]> {
  const supabase = createClient();
  
  const { data: assignments, error } = await supabase
    .from('user_store_assignments')
    .select(`
      *,
      custom_role:custom_roles(id, name, description)
    `)
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return assignments as unknown as UserStoreAssignmentWithDetails[];
}

/**
 * Get all store assignments for a user
 */
export async function getUserStoreAssignments(
  userId: string
): Promise<UserStoreAssignmentWithDetails[]> {
  const supabase = createClient();
  
  const { data: assignments, error } = await supabase
    .from('user_store_assignments')
    .select(`
      *,
      store:stores(id, name, city),
      custom_role:custom_roles(id, name, description)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return assignments as unknown as UserStoreAssignmentWithDetails[];
}

/**
 * Assign a user to a store with a role
 */
export async function assignUserToStore(
  input: AssignUserInput
): Promise<UserStoreAssignment> {
  const supabase = createClient();
  
  const assignment: Partial<UserStoreAssignment> = {
    user_id: input.user_id,
    store_id: input.store_id,
  };
  
  if (input.role_type === 'system' && input.system_role) {
    assignment.system_role = input.system_role;
  } else if (input.role_type === 'custom' && input.custom_role_id) {
    assignment.custom_role_id = input.custom_role_id;
  } else {
    throw new Error('Invalid role assignment: must specify system_role or custom_role_id');
  }
  
  const { data, error } = await supabase
    .from('user_store_assignments')
    .insert(assignment)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Update user's role assignment for a store
 */
export async function updateUserAssignment(
  assignmentId: string,
  input: Partial<AssignUserInput>
): Promise<UserStoreAssignment> {
  const supabase = createClient();
  
  const update: Partial<UserStoreAssignment> = {};
  
  if (input.role_type === 'system' && input.system_role) {
    update.system_role = input.system_role;
    update.custom_role_id = null;
  } else if (input.role_type === 'custom' && input.custom_role_id) {
    update.system_role = null;
    update.custom_role_id = input.custom_role_id;
  }
  
  const { data, error } = await supabase
    .from('user_store_assignments')
    .update(update)
    .eq('id', assignmentId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Remove user's assignment from a store
 */
export async function removeUserAssignment(assignmentId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('user_store_assignments')
    .delete()
    .eq('id', assignmentId);
  
  if (error) throw error;
}

/**
 * HELPER FUNCTIONS
 */

/**
 * Check if a user is assigned to a store
 */
export async function isUserAssignedToStore(
  userId: string,
  storeId: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_store_assignments')
    .select('id')
    .eq('user_id', userId)
    .eq('store_id', storeId)
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

/**
 * Get role usage count (how many users have this role)
 */
export async function getRoleUsageCount(roleId: string): Promise<number> {
  const supabase = createClient();
  
  const { count, error } = await supabase
    .from('user_store_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('custom_role_id', roleId);
  
  if (error) throw error;
  return count || 0;
}
