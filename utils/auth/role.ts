/**
 * Role helpers for auth. Use with JWT user_role string or API role types.
 * Safe for Edge (no React, no browser APIs).
 */

const ADMIN_ROLE_PREFIX = 'ADMIN_ROLE_'
const USER_ROLE_PREFIX = 'USER_ROLE_'

/** Admin role values from API (v2AdminRole) */
const ADMIN_ROLES = new Set([
  'ADMIN_ROLE_UNSPECIFIED',
  'ADMIN_ROLE_SUPER_ADMIN',
  'ADMIN_ROLE_LIBRARY_ADMINISTRATOR',
  'ADMIN_ROLE_DOCUMENTS_MANAGER',
  'ADMIN_ROLE_DOCUMENTS_EDITOR',
  'ADMIN_ROLE_DOCUMENTS_WRITER',
  'ADMIN_ROLE_CUSTOMERS_ADMINISTRATOR',
  'ADMIN_ROLE_ACCOUNTS_MANAGER',
])

/** User role values from API (v2UserRole) */
const USER_ROLES = new Set([
  'USER_ROLE_UNSPECIFIED',
  'USER_ROLE_GUEST',
  'USER_ROLE_STUDENT',
  'USER_ROLE_PROFESSIONAL',
  'USER_ROLE_ORGANIZATION',
])

/**
 * Returns true if the role string is an admin role (v2AdminRole).
 * Accepts JWT user_role string or API role type.
 */
export function isAdminRole(role: string | undefined | null): boolean {
  if (!role || typeof role !== 'string') return false
  return role.startsWith(ADMIN_ROLE_PREFIX) || ADMIN_ROLES.has(role)
}

/**
 * Returns true if the role string is a user/client role (v2UserRole).
 * Accepts JWT user_role string or API role type.
 */
export function isUserRole(role: string | undefined | null): boolean {
  if (!role || typeof role !== 'string') return false
  return role.startsWith(USER_ROLE_PREFIX) || USER_ROLES.has(role)
}

/** Default admin role for mapping simple "admin" app role */
export const DEFAULT_ADMIN_ROLE = 'ADMIN_ROLE_SUPER_ADMIN' as const

/** Default user role for mapping simple "client" app role */
export const DEFAULT_USER_ROLE = 'USER_ROLE_GUEST' as const

/**
 * Map simple app role ("admin" | "client") to API role type for storage.
 */
export function appRoleToApiRole(
  appRole: 'admin' | 'client'
): typeof DEFAULT_ADMIN_ROLE | typeof DEFAULT_USER_ROLE {
  return appRole === 'admin' ? DEFAULT_ADMIN_ROLE : DEFAULT_USER_ROLE
}
