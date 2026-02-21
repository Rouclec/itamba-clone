/**
 * Role helpers for auth. Use with JWT user_role string or API role types.
 * Handles both protobuf-style (ADMIN_ROLE_SUPER_ADMIN) and snake_case (super_admin) from backend.
 * Safe for Edge (no React, no browser APIs).
 */

const ADMIN_ROLE_PREFIX = 'ADMIN_ROLE_'
const USER_ROLE_PREFIX = 'USER_ROLE_'

/** Admin slugs (normalized): from protobuf ADMIN_ROLE_* or backend snake_case. */
const ADMIN_SLUGS = new Set([
  'unspecified',
  'super_admin',
  'library_administrator',
  'documents_manager',
  'documents_editor',
  'documents_writer',
  'customers_administrator',
  'accounts_manager',
])

/** User slugs (normalized): from protobuf USER_ROLE_* or backend snake_case. */
const USER_SLUGS = new Set([
  'unspecified',
  'guest',
  'student',
  'professional',
  'organization',
])

/**
 * Normalize role from claim/API to a canonical slug (snake_case).
 * - "ADMIN_ROLE_SUPER_ADMIN" → "super_admin"
 * - "USER_ROLE_PROFESSIONAL" → "professional"
 * - "super_admin" → "super_admin"
 * - "professional" → "professional"
 */
export function getRoleSlug(role: string | undefined | null): string {
  if (!role || typeof role !== 'string') return ''
  const r = role.trim()
  if (r.startsWith(ADMIN_ROLE_PREFIX)) return r.slice(ADMIN_ROLE_PREFIX.length).toLowerCase()
  if (r.startsWith(USER_ROLE_PREFIX)) return r.slice(USER_ROLE_PREFIX.length).toLowerCase()
  return r.toLowerCase()
}

/**
 * Returns true if the role string is an admin role.
 * Accepts both protobuf (ADMIN_ROLE_SUPER_ADMIN) and snake_case (super_admin).
 * USER_ROLE_* is never admin (e.g. USER_ROLE_UNSPECIFIED → false).
 */
export function isAdminRole(role: string | undefined | null): boolean {
  if (!role || typeof role !== 'string') return false
  if (role.startsWith(USER_ROLE_PREFIX)) return false
  if (role.startsWith(ADMIN_ROLE_PREFIX)) return true
  const slug = getRoleSlug(role)
  return slug !== '' && ADMIN_SLUGS.has(slug)
}

/**
 * Returns true if the role string is a user/client role.
 * Accepts both protobuf (USER_ROLE_PROFESSIONAL) and snake_case (professional).
 * ADMIN_ROLE_* is never user.
 */
export function isUserRole(role: string | undefined | null): boolean {
  if (!role || typeof role !== 'string') return false
  if (role.startsWith(ADMIN_ROLE_PREFIX)) return false
  if (role.startsWith(USER_ROLE_PREFIX)) return true
  const slug = getRoleSlug(role)
  return slug !== '' && USER_SLUGS.has(slug)
}

/**
 * Human-readable label for admin role (e.g. "ADMIN_ROLE_SUPER_ADMIN" → "Super admin").
 * Use for UI display; for i18n, map slug to translation key elsewhere.
 */
export function getAdminRoleDisplayLabel(role: string | undefined | null): string {
  const slug = getRoleSlug(role)
  if (!slug) return 'Admin'
  return slug
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
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
