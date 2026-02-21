import axios from "axios";
import Cookies from "js-cookie";
import {jwtDecode} from "jwt-decode";

// import { clearOncePerLoginModalFlags } from "@/utils/functions/modal_once_per_login";
import { setCookie } from "@/utils/functions/set_cookie";

export interface UserJwtTokenType {
  created_by: string;
  password_request_status: string;
  token_expiry_date: string;
  user_account_status: string;
  user_role: string;
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  email: string;
  email_verified: boolean;
  firebase: {
    identities: {
      email: string[];
    };
    sign_in_provider: string;
  };
}

export const REFRESH_TOKEN_STORAGE_KEY = "@refreshToken";

/** Persist refresh token (e.g. after signup or login). */
export function setRefreshTokenInStorage(refreshToken: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken.trim());
  } catch {
    // ignore
  }
}

/** Same key as auth-context uses; cleared on sign out so proxy and client stay in sync */
export const AUTH_STORAGE_KEY = "itamba-auth";

/** Signup OTP request stored during signup flow; cleared on sign out / session clear */
export const SIGNUP_REQUEST_STORAGE_KEY = "itamba-signup-request";

/** Authenticated user id (e.g. after signup); cleared on sign out */
export const USER_ID_STORAGE_KEY = "itamba-user-id";

/** Cached current user profile; hydrated on load, refetched when user lands. Cleared on sign out. */
export const CURRENT_USER_STORAGE_KEY = "itamba-current-user";

/** Guest "first login" modal dismissed this session; cleared on sign out so modal shows again after next login. */
export const GUEST_FIRST_LOGIN_MODAL_SEEN_KEY = "itamba_guest_first_login_modal_seen";

/** After signup/signin, redirect here if set (e.g. subscription payment URL from website). Cleared after redirect. */
export const PENDING_SUBSCRIPTION_RETURN_KEY = "itamba_pending_subscription_return";

export function getPendingSubscriptionReturn(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(PENDING_SUBSCRIPTION_RETURN_KEY);
    return v?.trim() || null;
  } catch {
    return null;
  }
}

export function clearPendingSubscriptionReturn(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PENDING_SUBSCRIPTION_RETURN_KEY);
  } catch {
    // ignore
  }
}

const COOKIE_EXPIRY_DATE_MS = 10 * 24 * 60 * 60 * 1000;

/**
 * Configure this if your backend refresh endpoint differs.
 *
 * Example expected contract:
 * POST {API_BASE_URL}{AUTH_REFRESH_PATH}
 * body: { refreshToken: string }
 * response: { accessToken: string, refreshToken?: string } OR { tokens: { accessToken, refreshToken } }
 */
const AUTH_REFRESH_PATH =
  process.env.NEXT_PUBLIC_AUTH_REFRESH_PATH ??
  "/v2/api/public/users/refresh-access-token";

let refreshInFlight: Promise<string | null> | null = null;

export function getAccessTokenFromCookie(): string | null {
  return Cookies.get("token") ?? null;
}

export function getRefreshTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  return token?.trim() ? token : null;
}

export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  try {
    const payload = jwtDecode<UserJwtTokenType>(token);
    const expSeconds = payload?.exp;
    if (!expSeconds) return true;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return expSeconds <= nowSeconds + skewSeconds;
  } catch {
    return true;
  }
}

export function isAuthenticated(): boolean {
  const token = getAccessTokenFromCookie();
  if (!token) return false;
  return !isJwtExpired(token);
}

export function clearSession() {
  Cookies.remove("token");
  Cookies.remove("subscription");
  Cookies.remove("sign_in_creds");
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(SIGNUP_REQUEST_STORAGE_KEY);
    localStorage.removeItem(USER_ID_STORAGE_KEY);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    localStorage.removeItem(GUEST_FIRST_LOGIN_MODAL_SEEN_KEY);
    localStorage.removeItem(PENDING_SUBSCRIPTION_RETURN_KEY);
  }
}

export async function refreshAccessToken(): Promise<{
  accessToken: string;
} | null> {
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL

  if (!baseURL) return null;

  const refreshToken = getRefreshTokenFromStorage();
  if (!refreshToken) return null;

  try {
    const res = await axios.post(
      `${baseURL}${AUTH_REFRESH_PATH}`,
      {
        refreshToken,
      },
      {
        // avoid accidental recursion into app interceptors if someone changes this to axiosInstance later
        headers: { "Content-Type": "application/json" },
      },
    );

    const data = res?.data;
    // Backend may return either:
    // - { accessToken, refreshToken? }
    // - { tokens: { accessToken, refreshToken? } }
    const accessToken = data?.accessToken ?? data?.tokens?.accessToken ?? null;

    if (!accessToken) return null;

    // Persist refreshed session info so every refresh has the same side effects as sign-in.
    if (typeof window !== "undefined") {
      try {
        setCookie("token", accessToken, COOKIE_EXPIRY_DATE_MS);
      } catch {
        // ignore
      }
    }

    return {
      accessToken,
    };
  } catch {
    return null;
  }
}

/**
 * Ensures we have a non-expired access token.
 * - If token is valid: returns it
 * - If missing/expired and refresh token exists: refreshes (single-flight) and returns new token
 * - If refresh fails: clears session and returns null
 */
export async function ensureValidAccessToken(): Promise<string | null> {
  const token = getAccessTokenFromCookie();
  // default: if token is valid, use it.
  if (token && !isJwtExpired(token)) return token;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshed = await refreshAccessToken();
      if (!refreshed?.accessToken) return null;
      return refreshed.accessToken;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  const newToken = await refreshInFlight;
  if (!newToken) {
    clearSession();
    return null;
  }

  return newToken;
}

export async function ensureValidAccessTokenForcedRefresh(): Promise<
  string | null
> {
  // force a refresh attempt even if a (potentially revoked) token exists.
  const refreshToken = getRefreshTokenFromStorage();
  if (!refreshToken) {
    clearSession();
    return null;
  }
  // reset any valid-token fast path by calling refreshAccessToken directly via single-flight.
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshed = await refreshAccessToken();
      if (!refreshed?.accessToken) return null;
      return refreshed.accessToken;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  const newToken = await refreshInFlight;
  if (!newToken) {
    clearSession();
    return null;
  }
  return newToken;
}
