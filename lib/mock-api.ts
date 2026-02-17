/**
 * Mock API utilities for simulating API calls with realistic delays
 * Used for development and testing without actual backend
 */

export interface MockDelay {
  min: number
  max: number
}

// Configurable delays for different operations
export const MOCK_DELAYS = {
  sendEmail: { min: 800, max: 1200 },
  verifyEmail: { min: 1000, max: 2000 },
  sendOTP: { min: 800, max: 1200 },
  verifyOTP: { min: 500, max: 1000 },
  createPassword: { min: 500, max: 1000 },
  selectRole: { min: 300, max: 500 },
} as const

/**
 * Simulate a random delay to mimic API response time
 */
export async function simulateDelay(
  delayConfig: MockDelay = { min: 500, max: 1500 }
): Promise<void> {
  const delay = Math.random() * (delayConfig.max - delayConfig.min) + delayConfig.min
  return new Promise((resolve) => setTimeout(resolve, delay))
}

/**
 * Mock sending email verification link
 */
export async function mockSendEmailVerification(email: string): Promise<{
  success: boolean
  message: string
  verificationUrl?: string
}> {
  await simulateDelay(MOCK_DELAYS.sendEmail)

  // Simulate occasional failures (10% chance)
  if (Math.random() < 0.1) {
    return {
      success: false,
      message: 'Failed to send verification email. Please try again.',
    }
  }

  // Generate a mock verification token
  const token = Math.random().toString(36).substring(2, 15)
  const verificationUrl = `/auth/signup/email/verify?token=${token}`

  return {
    success: true,
    message: `Verification email sent to ${email}`,
    verificationUrl,
  }
}

/**
 * Mock email verification
 */
export async function mockVerifyEmail(token: string): Promise<{
  success: boolean
  message: string
  userId?: string
}> {
  await simulateDelay(MOCK_DELAYS.verifyEmail)

  // Mock cheat: token "mock_skip" always succeeds (e.g. long-press "Go Back" on verify screen)
  const isMockSkip = token === 'mock_skip'

  // Simulate occasional verification failures (5% chance), unless mock_skip
  if (!isMockSkip && Math.random() < 0.05) {
    return {
      success: false,
      message: 'Email verification failed. The link may have expired.',
    }
  }

  // Generate mock user ID
  const userId = 'user_' + Math.random().toString(36).substring(2, 15)

  return {
    success: true,
    message: 'Email verified successfully',
    userId,
  }
}

/**
 * Mock sending OTP to phone number
 */
export async function mockSendOTP(phoneNumber: string): Promise<{
  success: boolean
  message: string
  expiresIn?: number
}> {
  await simulateDelay(MOCK_DELAYS.sendOTP)

  // Simulate occasional failures (8% chance)
  if (Math.random() < 0.08) {
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
    }
  }

  return {
    success: true,
    message: `OTP sent to ${phoneNumber}`,
    expiresIn: 600, // 10 minutes
  }
}

/**
 * Mock verifying OTP
 */
export async function mockVerifyOTP(otp: string, phoneNumber: string): Promise<{
  success: boolean
  message: string
  userId?: string
}> {
  await simulateDelay(MOCK_DELAYS.verifyOTP)

  // For demo purposes, accept "123456" as valid OTP
  const isValid = otp === '123456' || Math.random() < 0.85

  if (!isValid) {
    return {
      success: false,
      message: 'Invalid OTP. Please try again.',
    }
  }

  // Simulate occasional failures (3% chance on valid OTP)
  if (Math.random() < 0.03) {
    return {
      success: false,
      message: 'Verification failed. Please try again.',
    }
  }

  const userId = 'user_' + Math.random().toString(36).substring(2, 15)

  return {
    success: true,
    message: 'Phone number verified successfully',
    userId,
  }
}

/**
 * Mock creating password
 */
export async function mockCreatePassword(userId: string, password: string): Promise<{
  success: boolean
  message: string
}> {
  await simulateDelay(MOCK_DELAYS.createPassword)

  // Simulate occasional failures (2% chance)
  if (Math.random() < 0.02) {
    return {
      success: false,
      message: 'Failed to create password. Please try again.',
    }
  }

  return {
    success: true,
    message: 'Password created successfully',
  }
}

/**
 * Mock selecting user role
 */
export async function mockSelectRole(userId: string, role: string): Promise<{
  success: boolean
  message: string
}> {
  await simulateDelay(MOCK_DELAYS.selectRole)

  return {
    success: true,
    message: 'Role selected successfully',
  }
}

/**
 * Mock completing signup
 */
export async function mockCompleteSignup(userId: string): Promise<{
  success: boolean
  message: string
  redirectUrl?: string
}> {
  await simulateDelay(MOCK_DELAYS.selectRole)

  return {
    success: true,
    message: 'Account created successfully',
    redirectUrl: '/browse',
  }
}
