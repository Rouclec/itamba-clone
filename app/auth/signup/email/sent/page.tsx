'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SignupLayout } from '@/components/auth/signup-layout'
import { Button } from '@/components/ui/button'
import { useSignupContext } from '@/lib/signup-context'
import { mockSendEmailVerification } from '@/lib/mock-api'
import { toast } from 'sonner'

const LONG_PRESS_MS = 700
const MOCK_VERIFY_TOKEN = 'mock_skip'

export default function EmailSentPage() {
  const router = useRouter()
  const { formData } = useSignupContext()
  const email = formData.email || ''

  const [resendTimer, setResendTimer] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!email) {
      router.replace('/auth/signup/email')
    }
  }, [email, router])

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleLongPressStart = () => {
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      router.push(`/auth/signup/email/verify?token=${MOCK_VERIFY_TOKEN}`)
    }, LONG_PRESS_MS)
  }

  const handleLongPressEnd = () => {
    clearLongPressTimer()
  }

  const handleGoBackToSignUp = () => {
    router.push('/auth/signup/email')
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    setIsResending(true)
    try {
      const result = await mockSendEmailVerification(email)
      if (result.success) {
        setResendTimer(60)
        const interval = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        toast.success('Verification email sent again.')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Failed to resend email.')
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <SignupLayout showProgress={false} showBackButton={false}>
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-primary">
            Verify Your Email
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We&apos;ve sent a verification link to{' '}
            <span className="font-medium text-foreground">{email}</span>. Please
            check your inbox and click the link to continue.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleGoBackToSignUp}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onTouchCancel={handleLongPressEnd}
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Go Back To Sign Up
        </Button>

        <div className="text-sm">
          <span className="text-muted-foreground">Didn&apos;t receive the email? </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0 || isResending}
            className={`font-medium hover:underline ${
              resendTimer > 0 || isResending
                ? 'text-muted-foreground cursor-not-allowed'
                : 'text-secondary'
            }`}
          >
            {isResending
              ? 'Sending...'
              : resendTimer > 0
                ? `Resend in ${resendTimer} seconds`
                : 'Resend'}
          </button>
        </div>
      </div>
    </SignupLayout>
  )
}
