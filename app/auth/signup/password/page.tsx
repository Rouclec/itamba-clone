'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignupLayout } from '@/components/auth/signup-layout'
import { FormInput } from '@/components/auth/form-input'
import { Button } from '@/components/ui/button'
import { useSignupContext } from '@/lib/signup-context'
import { passwordSchema, type PasswordFormData } from '@/lib/form-validators'
import { mockCreatePassword } from '@/lib/mock-api'
import { toast } from 'sonner'
import { z } from 'zod'
import { Eye, EyeOff, Lock, LockOpen } from 'lucide-react'

export default function PasswordPage() {
  const router = useRouter()
  const { formData, updateFormData } = useSignupContext()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const validatePasswords = (pwd: string, confirm: string) => {
    try {
      passwordSchema.parse({ password: pwd, confirmPassword: confirm })
      setPasswordError(null)
      setConfirmError(null)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Separate errors for each field
        error.errors.forEach((err) => {
          if (err.path[0] === 'password') {
            setPasswordError(err.message)
          } else if (err.path[0] === 'confirmPassword') {
            setConfirmError(err.message)
          }
        })
      }
      return false
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    if (passwordError) {
      validatePasswords(value, confirmPassword)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    if (confirmError) {
      validatePasswords(password, value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswords(password, confirmPassword)) {
      return
    }

    setIsLoading(true)
    try {
      const userId = formData.userId || 'temp_user'
      const result = await mockCreatePassword(userId, password)

      if (result.success) {
        updateFormData({ password })
        toast.success(result.message)

        setTimeout(() => {
          router.push('/auth/signup/career')
        }, 500)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  const isFormValid = password && confirmPassword && !passwordError && !confirmError

  return (
    <SignupLayout
      currentStep={3}
      totalSteps={4}
      onBack={handleBack}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-primary text-center">
            Create your password
          </h2>
          <p className="text-sm text-center text-muted-foreground leading-relaxed">
            Secure your account with a strong password.
          </p>
        </div>

        {/* Password Input */}
        <div className="relative">
          <FormInput
            label="Create password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Eyong@456"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => validatePasswords(password, confirmPassword)}
            error={passwordError || undefined}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px]  cursor-pointer text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <LockOpen className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Confirm Password Input */}
        <div className="relative">
          <FormInput
            label="Confirm password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Eyong@456"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            onBlur={() => validatePasswords(password, confirmPassword)}
            error={confirmError || undefined}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[38px]  cursor-pointer text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? (
              <LockOpen className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Password Requirements */}
        {/* <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <p className="text-xs font-semibold text-foreground">Password requirements:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• At least 8 characters</li>
            <li>• At least one uppercase letter</li>
            <li>• At least one lowercase letter</li>
            <li>• At least one number</li>
          </ul>
        </div> */}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`w-full h-11 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            !isFormValid || isLoading
              ? 'bg-slate-500 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 active:bg-primary/80'
          }`}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            'Create password'
          )}
        </button>
      </form>
    </SignupLayout>
  )
}
