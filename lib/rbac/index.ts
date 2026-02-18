/**
 * RBAC Module - Main Export
 * 
 * Centralized exports for Role-Based Access Control utilities
 */

// Types
export type {
  SystemRole,
  AppPermission,
  CustomRole,
  RolePermission,
  UserStoreAssignment,
  JWTRoleClaim,
  JWTClaims,
  CustomRoleWithPermissions,
  UserStoreAssignmentWithDetails,
  CreateRoleInput,
  AssignUserInput,
} from './types';

export {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
} from './types';

// Permission utilities (JWT-based, optimized)
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserStores,
  isOrganizationAdmin,
  isStoreAdmin,
  getUserPermissionsForStore,
  getUserRoles,
  refreshUserSession,
} from './permissions';

// Database utilities
export {
  getCustomRolesForStore,
  getCustomRole,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  getUserAssignmentsForStore,
  getUserStoreAssignments,
  assignUserToStore,
  updateUserAssignment,
  removeUserAssignment,
  isUserAssignedToStore,
  getRoleUsageCount,
} from './db';
