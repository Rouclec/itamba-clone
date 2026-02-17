'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AUTH_STORAGE_KEY = 'itamba-auth'

export type Role = 'admin' | 'client'

export interface AuthUser {
  role: Role
  identifier: string
}

interface AuthContextValue {
  user: AuthUser | null
  hydrated: boolean
  setUser: (user: AuthUser | null) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function getRoleFromIdentifier(identifier: string, method: 'phone' | 'email'): Role {
  if (method === 'email' && identifier.toLowerCase().trim() === 'admin@example.com') {
    return 'admin'
  }
  return 'client'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser
        if (parsed?.role && parsed?.identifier) {
          setUserState({ role: parsed.role, identifier: parsed.identifier })
        }
      }
    } finally {
      setHydrated(true)
    }
  }, [])

  const setUser = useCallback((next: AuthUser | null) => {
    setUserState(next)
    try {
      if (next) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next))
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
  }, [setUser])

  return (
    <AuthContext.Provider value={{ user, hydrated, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
