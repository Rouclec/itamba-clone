import type { v2AdminRole, v2User } from "@/@hey_api/users.swagger";

/**
 * V1 user shape from the backend (GET user by id).
 * Stored/converted to v2 for use across the app.
 */
export interface V1User {
  id?: string;
  user_name?: string;
  email?: string;
  user_claims?: {
    user_account_status?: string;
    created_by?: string;
    password_request_status?: string;
    user_role?: string;
    token_expiry_date?: string;
  };
  photo_url?: string;
  telephone?: string;
  country?: string;
  city?: string;
  address?: string;
  profession?: string;
  created_at?: string;
  updated_at?: string;
}

/** Admin slugs from backend (snake_case). Map to v2 ADMIN_ROLE_* for app use. */
const ADMIN_SLUG_TO_V2: Record<string, v2AdminRole> = {
  unspecified: "ADMIN_ROLE_UNSPECIFIED",
  super_admin: "ADMIN_ROLE_SUPER_ADMIN",
  library_administrator: "ADMIN_ROLE_LIBRARY_ADMINISTRATOR",
  documents_manager: "ADMIN_ROLE_DOCUMENTS_MANAGER",
  documents_editor: "ADMIN_ROLE_DOCUMENTS_EDITOR",
  documents_writer: "ADMIN_ROLE_DOCUMENTS_WRITER",
  customers_administrator: "ADMIN_ROLE_CUSTOMERS_ADMINISTRATOR",
  accounts_manager: "ADMIN_ROLE_ACCOUNTS_MANAGER",
};

/** Valid v2 admin role values (for "already v2" check). */
const V2_ADMIN_ROLES = new Set<string>(Object.values(ADMIN_SLUG_TO_V2));

/** Map v1 user_role to v2 USER_ROLE_* */
function toV2UserRole(role?: string): v2User["userRole"] {
  if (!role) return undefined;
  const r = role.toLowerCase().trim();
  if (r === "guest") return "USER_ROLE_GUEST";
  if (r === "student") return "USER_ROLE_STUDENT";
  if (r === "professional") return "USER_ROLE_PROFESSIONAL";
  if (r === "organization") return "USER_ROLE_ORGANIZATION";
  return "USER_ROLE_UNSPECIFIED";
}

/** Map v1 user_role (admin slug) to v2 ADMIN_ROLE_* when backend returns snake_case. */
export function toV2AdminRole(role?: string): string | undefined {
  if (!role) return undefined;
  const slug = role.toLowerCase().trim();
  return ADMIN_SLUG_TO_V2[slug];
}

/** Map v1 or v2 role string to v2 ADMIN_ROLE_* for API requests. Use when sending role to v2 endpoints. */
export function mapToV2AdminRole(role?: string): v2AdminRole | undefined {
  if (!role?.trim()) return undefined;
  const r = role.trim();
  if (V2_ADMIN_ROLES.has(r)) return r as v2AdminRole;
  const mapped = toV2AdminRole(r);
  return mapped as v2AdminRole;
}

/** Map v1 user_account_status to v2 if possible */
function toV2UserAccountStatus(status?: string): v2User["userAccountStatus"] {
  if (!status) return undefined;
  const s = status.toUpperCase().replace(/-/g, "_");
  if (["ACTIVE", "SUSPENDED", "DEACTIVATED", "BANNED", "PENDING_VERIFICATION"].includes(s)) {
    return s as v2User["userAccountStatus"];
  }
  if (s === "ACCOUNT_ACTIVATED") return "ACTIVE";
  return "USER_ACCOUNT_STATUS_UNSPECIFIED";
}

/**
 * Convert v1 API user to v2 shape for use in context and app.
 */
export function v1UserToV2(v1: V1User | null): v2User | null {
  if (!v1?.id) return null;
  const claims = v1.user_claims;
  return {
    userId: v1.id,
    fullName: v1.user_name ?? undefined,
    email: v1.email ?? undefined,
    photoUrl: v1.photo_url ?? undefined,
    telephone: v1.telephone ?? undefined,
    country: v1.country ?? undefined,
    city: v1.city ?? undefined,
    address: v1.address ?? undefined,
    profession: v1.profession ?? undefined,
    userAccountStatus: toV2UserAccountStatus(claims?.user_account_status),
    createdBy: claims?.created_by ?? undefined,
    passwordRequestStatus: claims?.password_request_status
      ? (claims.password_request_status as v2User["passwordRequestStatus"])
      : undefined,
    userRole: (toV2AdminRole(claims?.user_role) ??
      toV2UserRole(claims?.user_role)) as v2User["userRole"],
    createdAt: v1.created_at ?? undefined,
    updatedAt: v1.updated_at ?? undefined,
  };
}
