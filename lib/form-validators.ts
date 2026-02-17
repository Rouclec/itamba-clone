import { z } from 'zod'

export type TranslateFn = (key: string, options?: Record<string, unknown>) => string

export const emailSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
})

export const phoneSchema = z.object({
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .min(1, 'Phone number is required'),
})

export const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.confirmPassword === '' || data.password === data.confirmPassword,
  { message: "Passwords don't match", path: ["confirmPassword"] }
)

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
})

export const roleSchema = z.object({
  role: z.string().min(1, 'Please select a role'),
})

/** Schema with translated messages for use in locale-aware pages */
export function createEmailSchema(t: TranslateFn) {
  return z.object({
    email: z
      .string()
      .email(t('validation.invalidEmail'))
      .min(1, t('validation.emailRequired')),
  })
}

export function createPasswordSchema(t: TranslateFn) {
  return z.object({
    password: z.string().min(8, t('validation.passwordMinLength')),
    confirmPassword: z.string(),
  }).refine(
    (data) => data.confirmPassword === '' || data.password === data.confirmPassword,
    { message: t('validation.passwordsDontMatch'), path: ['confirmPassword'] }
  )
}

export function createOtpSchema(t: TranslateFn) {
  return z.object({
    otp: z
      .string()
      .length(6, t('validation.otpMustBe6Digits'))
      .regex(/^\d+$/, t('validation.otpDigitsOnly')),
  })
}

export function createRoleSchema(t: TranslateFn) {
  return z.object({
    role: z.string().min(1, t('validation.selectRole')),
  })
}

export type EmailFormData = z.infer<typeof emailSchema>
export type PhoneFormData = z.infer<typeof phoneSchema>
export type PasswordFormData = z.infer<typeof passwordSchema>
export type OTPFormData = z.infer<typeof otpSchema>
export type RoleFormData = z.infer<typeof roleSchema>

// Helper function to validate a single field (uses non-translated schema; for non-locale code)
export function validateField(fieldName: string, value: string, schema: z.ZodSchema): string | null {
  try {
    schema.parse({ [fieldName]: value })
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid value'
    }
    return 'Invalid value'
  }
}

// Helper function to get field errors
export function getFieldErrors(fieldName: string, error: z.ZodError | null): string | null {
  if (!error) return null
  const fieldError = error.errors.find((e) => e.path[0] === fieldName)
  return fieldError?.message || null
}
