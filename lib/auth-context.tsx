'use client';

import type {
  v2AdminRole,
  v2UserRole,
  v2SignupRequest,
  v2User,
} from '@/@hey_api/users.swagger';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  clearSession,
  SESSION_CLEARED_EVENT,
  AUTH_STORAGE_KEY,
  SIGNUP_REQUEST_STORAGE_KEY,
  USER_ID_STORAGE_KEY,
  CURRENT_USER_STORAGE_KEY,
} from '@/utils/auth/session';
import { useRouter, usePathname } from 'next/navigation';

export interface AuthUser {
  role: v2UserRole | v2AdminRole;
  identifier: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  hydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  signOut: () => void;
  /** In-progress signup (requestId at signupRequest.authFactor?.id). Cleared on login/signOut. */
  signupRequest: v2SignupRequest | null;
  setSignupRequest: (request: v2SignupRequest | null) => void;
  /** Fetched user profile (from get user by id). Cleared on signOut. */
  currentUser: v2User | null;
  setCurrentUser: (u: v2User | null) => void;
  /** Authenticated user id (set after signup, persisted). Cleared on signOut. */
  userId: string | null;
  setUserId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { role?: string; identifier?: string };
    if (!parsed?.identifier || !parsed?.role) return null;
    return {
      role: parsed.role as v2UserRole | v2AdminRole,
      identifier: parsed.identifier,
    };
  } catch {
    return null;
  }
}

function parseStoredSignupRequest(raw: string | null): v2SignupRequest | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as v2SignupRequest;
    if (
      !parsed ||
      (parsed.authFactor == null &&
        parsed.phoneNumber == null &&
        parsed.email == null)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseStoredCurrentUser(raw: string | null): v2User | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as v2User;
    return parsed?.userId ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [signupRequest, setSignupRequestState] =
    useState<v2SignupRequest | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [currentUser, setCurrentUserState] = useState<v2User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') {
      setHydrated(true);
      return;
    }
    setUserState(parseStoredUser(localStorage.getItem(AUTH_STORAGE_KEY)));
    setSignupRequestState(
      parseStoredSignupRequest(localStorage.getItem(SIGNUP_REQUEST_STORAGE_KEY))
    );
    const storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
    setUserIdState(storedUserId?.trim() || null);
    setCurrentUserState(
      parseStoredCurrentUser(localStorage.getItem(CURRENT_USER_STORAGE_KEY))
    );
    setHydrated(true);
  }, []);

  // When token refresh fails, interceptor calls clearSession() which dispatches this event.
  // Clear auth state and redirect to signin so the user is logged out immediately.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSessionCleared = () => {
      setUserState(null);
      setSignupRequestState(null);
      setUserIdState(null);
      setCurrentUserState(null);
      const locale = pathname?.split('/')[1] || 'en';
      router.replace(`/${locale}/auth/signin`);
    };
    window.addEventListener(SESSION_CLEARED_EVENT, handleSessionCleared);
    return () => window.removeEventListener(SESSION_CLEARED_EVENT, handleSessionCleared);
  }, [router, pathname]);

  const setUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
    try {
      if (typeof window !== 'undefined') {
        if (next) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
          localStorage.removeItem(SIGNUP_REQUEST_STORAGE_KEY);
          setSignupRequestState(null);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const setSignupRequest = useCallback(
    (next: v2SignupRequest | null) => {
      setSignupRequestState(next);
      try {
        if (typeof window !== 'undefined') {
          if (next) {
            localStorage.setItem(
              SIGNUP_REQUEST_STORAGE_KEY,
              JSON.stringify(next)
            );
          } else {
            localStorage.removeItem(SIGNUP_REQUEST_STORAGE_KEY);
          }
        }
      } catch {
        // ignore
      }
    },
    []
  );

  const setUserId = useCallback((id: string | null) => {
    setUserIdState(id);
    try {
      if (typeof window !== 'undefined') {
        if (id) {
          localStorage.setItem(USER_ID_STORAGE_KEY, id);
        } else {
          localStorage.removeItem(USER_ID_STORAGE_KEY);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const setCurrentUser = useCallback((u: v2User | null) => {
    setCurrentUserState(u);
    try {
      if (typeof window !== 'undefined') {
        if (u) {
          localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(u));
        } else {
          localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const signOut = useCallback(() => {
    setUserState(null);
    setSignupRequestState(null);
    setUserIdState(null);
    setCurrentUserState(null);
    clearSession();
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(SIGNUP_REQUEST_STORAGE_KEY);
        localStorage.removeItem(USER_ID_STORAGE_KEY);
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        hydrated,
        setUser,
        signOut,
        signupRequest,
        setSignupRequest,
        userId,
        setUserId,
        currentUser,
        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
