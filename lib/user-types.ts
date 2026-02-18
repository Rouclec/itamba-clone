import type { v2User } from "@/@hey_api/users.swagger";

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

/** Map v1 user_role to v2 USER_ROLE_* */
function toV2UserRole(role?: string): v2User["userRole"] {
  if (!role) return undefined;
  const r = role.toLowerCase();
  if (r === "guest") return "USER_ROLE_GUEST";
  if (r === "student") return "USER_ROLE_STUDENT";
  if (r === "professional") return "USER_ROLE_PROFESSIONAL";
  if (r === "organization") return "USER_ROLE_ORGANIZATION";
  return "USER_ROLE_UNSPECIFIED";
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
    userRole: toV2UserRole(claims?.user_role),
    createdAt: v1.created_at ?? undefined,
    updatedAt: v1.updated_at ?? undefined,
  };
}
