'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSignupContext } from '@/lib/signup-context'
import { useLocalePath } from '@/lib/use-locale'
import { useT } from '@/app/i18n/client'
import { mockVerifyEmail } from '@/lib/mock-api'
import { VerificationLoader } from '@/components/auth/verification-loader'

function EmailVerifyContent() {
  const router = useRouter()
  const path = useLocalePath()
  const { t } = useT('translation')
  const searchParams = useSearchParams()
  const { formData, updateFormData } = useSignupContext()
  const token = searchParams.get('token')

  const [isVerifying, setIsVerifying] = useState(true)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      router.replace(path(formData.email ? '/auth/signup/email/sent' : '/auth/signup/email'))
      return
    }

    const verifyEmail = async () => {
      try {
        setIsVerifying(true)
        const result = await mockVerifyEmail(token)

        if (result.success && result.userId) {
          updateFormData({ userId: result.userId })
          setTimeout(() => {
            router.push(path('/auth/signup/password'))
          }, 1500)
        } else {
          setIsError(true)
          setErrorMessage(result.message ?? t('verification.verificationFailedDefault'))
          setIsVerifying(false)
        }
      } catch (error) {
        setIsError(true)
        setErrorMessage(t('verification.verificationErrorGeneric'))
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [token, router, updateFormData, formData.email, path, t])

  const handleRetry = () => {
    if (!token) return
    setIsError(false)
    setIsVerifying(true)
    mockVerifyEmail(token).then((result) => {
      if (result.success && result.userId) {
        updateFormData({ userId: result.userId })
        setTimeout(() => router.push(path('/auth/signup/password')), 1500)
      } else {
        setIsError(true)
        setErrorMessage(result.message ?? t('verification.verificationFailedDefault'))
        setIsVerifying(false)
      }
    })
  }

  const handleBack = () => {
    router.push(path('/auth/signup/email'))
  }

  if (!token) {
    return null
  }

  return (
    <VerificationLoader
      isLoading={isVerifying && !isError}
      isError={isError}
      errorMessage={errorMessage}
      successMessage={t('verification.emailVerifiedSuccess')}
      message={t('verification.verifyingEmail')}
      onRetry={handleRetry}
      onBack={handleBack}
    />
  )
}

function EmailVerifyFallback() {
  const { t } = useT('translation')
  return (
    <VerificationLoader
      isLoading
      isError={false}
      errorMessage=""
      successMessage=""
      message={t('common.loading')}
      onRetry={() => {}}
      onBack={() => {}}
    />
  )
}

export default function EmailVerifyPage() {
  return (
    <Suspense fallback={<EmailVerifyFallback />}>
      <EmailVerifyContent />
    </Suspense>
  )
}
