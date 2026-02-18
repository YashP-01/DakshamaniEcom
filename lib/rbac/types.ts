/**
 * RBAC Type Definitions
 * 
 * Type-safe definitions for the Role-Based Access Control system
 */

export type SystemRole = 'organization_admin' | 'store_admin';

export type AppPermission =
  // Order permissions
  | 'orders.view'
  | 'orders.create'
  | 'orders.edit'
  | 'orders.delete'
  // Product permissions
  | 'products.view'
  | 'products.edit'
  | 'products.delete'
  // Customer permissions
  | 'customers.view'
  | 'customers.edit'
  // Inventory permissions
  | 'inventory.view'
  | 'inventory.edit'
  // Reporting permissions
  | 'reports.view'
  | 'reports.export'
  // Settings permissions
  | 'settings.edit'
  // Role management permissions
  | 'roles.manage'
  | 'users.manage';

// Database table types
export interface CustomRole {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission: AppPermission;
}

export interface UserStoreAssignment {
  id: string;
  user_id: string;
  store_id: string;
  system_role: SystemRole | null;
  custom_role_id: string | null;
  created_at: string;
  updated_at: string;
}

// JWT claim structure (shortened keys for smaller token size)
export interface JWTRoleClaim {
  s: string;  // store_id
  r: SystemRole | null; // system_role
  c: string | null; // custom_role name
  p: AppPermission[]; // permissions
}

export interface JWTClaims {
  org_adm: boolean; // is_org_admin
  roles: JWTRoleClaim[];
}

// Extended types with relations
export interface CustomRoleWithPermissions extends CustomRole {
  permissions: RolePermission[];
}

export interface UserStoreAssignmentWithDetails extends UserStoreAssignment {
  store?: {
    id: string;
    name: string;
  };
  custom_role?: CustomRole;
}

// Form types for UI
export interface CreateRoleInput {
  store_id: string;
  name: string;
  description?: string;
  permissions: AppPermission[];
}

export interface AssignUserInput {
  user_id: string;
  store_id: string;
  role_type: 'system' | 'custom';
  system_role?: SystemRole;
  custom_role_id?: string;
}

// Permission groups for UI organization
export const PERMISSION_GROUPS: Record<string, { label: string; permissions: AppPermission[] }> = {
  orders: {
    label: 'Orders',
    permissions: ['orders.view', 'orders.create', 'orders.edit', 'orders.delete'],
  },
  products: {
    label: 'Products',
    permissions: ['products.view', 'products.edit', 'products.delete'],
  },
  customers: {
    label: 'Customers',
    permissions: ['customers.view', 'customers.edit'],
  },
  inventory: {
    label: 'Inventory',
    permissions: ['inventory.view', 'inventory.edit'],
  },
  reports: {
    label: 'Reports',
    permissions: ['reports.view', 'reports.export'],
  },
  settings: {
    label: 'Settings',
    permissions: ['settings.edit'],
  },
  administration: {
    label: 'Administration',
    permissions: ['roles.manage', 'users.manage'],
  },
};

// Human-readable permission labels
export const PERMISSION_LABELS: Record<AppPermission, string> = {
  'orders.view': 'View Orders',
  'orders.create': 'Create Orders',
  'orders.edit': 'Edit Orders',
  'orders.delete': 'Delete Orders',
  'products.view': 'View Products',
  'products.edit': 'Edit Products',
  'products.delete': 'Delete Products',
  'customers.view': 'View Customers',
  'customers.edit': 'Edit Customers',
  'inventory.view': 'View Inventory',
  'inventory.edit': 'Edit Inventory',
  'reports.view': 'View Reports',
  'reports.export': 'Export Reports',
  'settings.edit': 'Edit Settings',
  'roles.manage': 'Manage Roles',
  'users.manage': 'Manage Users',
};
