import { createContext, useContext } from 'react'

export interface SignupFormData {
  email?: string
  phone?: string
  password?: string
  role?: string
  userId?: string
  verificationMethod?: 'email' | 'phone'
}

export interface SignupContextType {
  formData: SignupFormData
  updateFormData: (data: Partial<SignupFormData>) => void
  resetFormData: () => void
}

const STORAGE_KEY = 'itamba_signup_form'

export const SignupContext = createContext<SignupContextType | undefined>(undefined)

export function useSignupContext() {
  const context = useContext(SignupContext)
  if (context === undefined) {
    throw new Error('useSignupContext must be used within SignupProvider')
  }
  return context
}

// Helper functions for localStorage management
export function getSignupDataFromStorage(): SignupFormData | null {
  if (typeof window === 'undefined') return null
  
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function saveSignupDataToStorage(data: SignupFormData): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    console.error('Failed to save signup data to localStorage')
  }
}

export function clearSignupDataFromStorage(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    console.error('Failed to clear signup data from localStorage')
  }
}
