'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSignupContext } from '@/lib/signup-context'
import { mockVerifyEmail } from '@/lib/mock-api'
import { VerificationLoader } from '@/components/auth/verification-loader'

export default function EmailVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { formData, updateFormData } = useSignupContext()
  const token = searchParams.get('token')

  const [isVerifying, setIsVerifying] = useState(true)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      router.replace(formData.email ? '/auth/signup/email/sent' : '/auth/signup/email')
      return
    }

    const verifyEmail = async () => {
      try {
        setIsVerifying(true)
        const result = await mockVerifyEmail(token)

        if (result.success && result.userId) {
          updateFormData({ userId: result.userId })
          setTimeout(() => {
            router.push('/auth/signup/password')
          }, 1500)
        } else {
          setIsError(true)
          setErrorMessage(result.message ?? 'Verification failed.')
          setIsVerifying(false)
        }
      } catch (error) {
        setIsError(true)
        setErrorMessage('An error occurred during verification. Please try again.')
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [token, router, updateFormData, formData.email])

  const handleRetry = () => {
    if (!token) return
    setIsError(false)
    setIsVerifying(true)
    mockVerifyEmail(token).then((result) => {
      if (result.success && result.userId) {
        updateFormData({ userId: result.userId })
        setTimeout(() => router.push('/auth/signup/password'), 1500)
      } else {
        setIsError(true)
        setErrorMessage(result.message ?? 'Verification failed.')
        setIsVerifying(false)
      }
    })
  }

  const handleBack = () => {
    router.push('/auth/signup/email')
  }

  if (!token) {
    return null
  }

  return (
    <VerificationLoader
      isLoading={isVerifying && !isError}
      isError={isError}
      errorMessage={errorMessage}
      successMessage="Email verified successfully!"
      message="We are verifying your email..."
      onRetry={handleRetry}
      onBack={handleBack}
    />
  )
}
