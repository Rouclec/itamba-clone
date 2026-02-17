'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignupLayout } from '@/components/auth/signup-layout'
import { FormInput } from '@/components/auth/form-input'
import { PhoneInput } from '@/components/auth/phone-input'
import { Button } from '@/components/ui/button'
import { useSignupContext } from '@/lib/signup-context'
import { Loader2 } from 'lucide-react'

function parseStoredPhone(phone: string | undefined): { dialCode: string; national: string } {
  if (!phone) return { dialCode: '+237', national: '' }
  const match = phone.match(/^(\+\d+)(.*)$/)
  if (match) return { dialCode: match[1], national: match[2].replace(/\D/g, '') }
  return { dialCode: '+237', national: phone.replace(/\D/g, '') }
}

export default function CompleteProfilePage() {
  const router = useRouter()
  const { formData, updateFormData, resetFormData } = useSignupContext()
  const isPhoneSignup = formData.verificationMethod === 'phone'

  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState(() => {
    const { national } = parseStoredPhone(formData.phone)
    return national
  })
  const [dialCode, setDialCode] = useState(() => parseStoredPhone(formData.phone).dialCode)
  const [email, setEmail] = useState(formData.email || '')
  const [location, setLocation] = useState('')
  const [fullNameError, setFullNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isLastStep = isPhoneSignup ? step === 3 : step === 2
  const showLocation = (!isPhoneSignup && step >= 2) || (isPhoneSignup && step >= 3)

  const handleContinue = () => {
    if (step === 0) {
      const trimmed = fullName.trim()
      if (!trimmed) {
        setFullNameError('Please enter your full name')
        return
      }
      setFullNameError(null)
      setStep(1)
      return
    }
    if (step === 1) {
      if (isPhoneSignup) {
        setStep(2)
        return
      }
      const digits = phone.replace(/\D/g, '')
      if (digits.length < 6) return
      setStep(2)
      return
    }
    if (step === 2 && isPhoneSignup) {
      if (!email.trim()) {
        setEmailError('Please enter your email')
        return
      }
      setEmailError(null)
      setStep(3)
      return
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1200))
    updateFormData({
      email: email || formData.email,
      phone: formData.phone || (dialCode + phone.replace(/\D/g, '')),
    })
    resetFormData()
    router.push('/browse')
  }

  const handleDoItLater = () => {
    resetFormData()
    router.push('/browse')
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
    else router.back()
  }

  return (
    <SignupLayout showProgress={false} onBack={handleBack}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-primary text-center">
            Complete your profile
          </h1>
          <p className="text-sm text-center text-muted-foreground">
            Sign up to enjoy well organized and up to date Cameroon law
          </p>
        </div>

        <div className="space-y-4">
          {/* Full name – always visible */}
          <FormInput
            label="Full name"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              if (fullNameError) setFullNameError(null)
            }}
            onBlur={() => {
              if (fullName.trim()) setFullNameError(null)
            }}
            error={fullNameError || undefined}
            placeholder="Marie Bliss"
          />

          {/* Phone – appears after first Continue */}
          {step >= 1 && (
            <PhoneInput
              value={phone}
              onChange={setPhone}
              onCountryChange={(c) => setDialCode(c.dial_code)}
              defaultCountryCode={formData.phone ? parseStoredPhone(formData.phone).dialCode : undefined}
              disabled={isPhoneSignup}
              required={!isPhoneSignup}
            />
          )}

          {/* Email – appears after second Continue */}
          {step >= 2 && (
            <FormInput
              label="Email address"
              type="email"
              required={isPhoneSignup}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError(null)
              }}
              error={emailError || undefined}
              placeholder="mariebliss24@gmail.com"
              disabled={!isPhoneSignup}
            />
          )}

          {/* Location – same step as email for email signup, next step for phone signup */}
          {showLocation && (
            <FormInput
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Buea-Cameroon"
            />
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!isLastStep ? (
              <Button
                type="button"
                onClick={handleContinue}
                className="w-full h-11 bg-primary text-primary-foreground"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full h-11 bg-primary text-primary-foreground"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            )}
            <button
              type="button"
              onClick={handleDoItLater}
              className="w-full h-10 text-secondary font-medium underline"
            >
              Do it later
            </button>
          </div>
        </div>
      </div>
    </SignupLayout>
  )
}
