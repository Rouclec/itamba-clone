'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  SignupContext,
  SignupContextType,
  SignupFormData,
  getSignupDataFromStorage,
  saveSignupDataToStorage,
  clearSignupDataFromStorage,
} from '@/lib/signup-context'

// Helper functions for localStorage management are imported but used directly in callbacks

interface SignupProviderProps {
  children: React.ReactNode
}

export function SignupProvider({ children }: SignupProviderProps) {
  const [formData, setFormData] = useState<SignupFormData>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      return getSignupDataFromStorage() || {}
    }
    return {}
  })

  const updateFormData = useCallback((data: Partial<SignupFormData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...data }
      saveSignupDataToStorage(updated)
      return updated
    })
  }, [])

  const resetFormData = useCallback(() => {
    setFormData({})
    clearSignupDataFromStorage()
  }, [])

  const value: SignupContextType = {
    formData,
    updateFormData,
    resetFormData,
  }

  return (
    <SignupContext.Provider value={value}>
      {children}
    </SignupContext.Provider>
  )
}
