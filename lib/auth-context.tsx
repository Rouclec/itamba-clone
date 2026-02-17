'use client'

import type { v2AdminRole, v2UserRole, v2SignupRequest } from '@/@hey_api/users.swagger'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { clearSession, AUTH_STORAGE_KEY, SIGNUP_REQUEST_STORAGE_KEY } from '@/utils/auth/session'
import { appRoleToApiRole } from '@/utils/auth/role'

export interface AuthUser {
  role: v2UserRole | v2AdminRole
  identifier: string
}

interface AuthContextValue {
  user: AuthUser | null
  hydrated: boolean
  setUser: (user: AuthUser | null) => void
  signOut: () => void
  /** In-progress signup OTP request (requestId is at signupRequest.authFactor?.id). Cleared on login/signOut. */
  signupRequest: v2SignupRequest | null
  setSignupRequest: (request: v2SignupRequest | null) => void
  /** Convenience: requestId from signupRequest.authFactor?.id for use during signup. */
  signupRequestId: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { role?: string; identifier?: string }
    if (!parsed?.identifier) return null
    const role = parsed.role
    // Support legacy "admin" | "client" from localStorage
    if (role === 'admin' || role === 'client') {
      return { role: appRoleToApiRole(role), identifier: parsed.identifier }
    }
    if (role && typeof role === 'string') {
      return { role: role as v2UserRole | v2AdminRole, identifier: parsed.identifier }
    }
    return null
  } catch {
    return null
  }
}

function parseStoredSignupRequest(raw: string | null): v2SignupRequest | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as v2SignupRequest
    if (parsed && (parsed.authFactor != null || parsed.phoneNumber != null || parsed.email != null)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null)
  const [signupRequest, setSignupRequestState] = useState<v2SignupRequest | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setHydrated(true)
      return
    }
    setUserState(parseStoredUser(localStorage.getItem(AUTH_STORAGE_KEY)))
    setSignupRequestState(parseStoredSignupRequest(localStorage.getItem(SIGNUP_REQUEST_STORAGE_KEY)))
    setHydrated(true)
  }, [])

  const setUser = useCallback((next: AuthUser | null) => {
    setUserState(next)
    try {
      if (typeof window !== 'undefined') {
        if (next) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next))
          localStorage.removeItem(SIGNUP_REQUEST_STORAGE_KEY)
          setSignupRequestState(null)
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  const setSignupRequest = useCallback((next: v2SignupRequest | null) => {
    setSignupRequestState(next)
    try {
      if (typeof window !== 'undefined') {
        if (next) {
          localStorage.setItem(SIGNUP_REQUEST_STORAGE_KEY, JSON.stringify(next))
        } else {
          localStorage.removeItem(SIGNUP_REQUEST_STORAGE_KEY)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  const signOut = useCallback(() => {
    setUserState(null)
    setSignupRequestState(null)
    clearSession()
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem(SIGNUP_REQUEST_STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  const signupRequestId = signupRequest?.authFactor?.id ?? null

  return (
    <AuthContext.Provider
      value={{
        user,
        hydrated,
        setUser,
        signOut,
        signupRequest,
        setSignupRequest,
        signupRequestId,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
