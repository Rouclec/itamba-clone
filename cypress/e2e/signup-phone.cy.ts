/**
 * E2E: Phone number signup flow
 *
 * Prerequisites:
 * - CYPRESS_BASE_URL: app URL (default http://localhost:3000)
 * - CYPRESS_API_BASE_URL: backend API base URL (for admin OTP retrieval)
 * - CYPRESS_ADMIN_EMAIL, CYPRESS_ADMIN_PASSWORD: admin credentials
 * - Phone numbers are auto-incremented from cypress/e2e-phone-state.json (670000000, 670000001, …)
 * - CYPRESS_TEST_PASSWORD (optional): password for new user (default TestPass1)
 *
 * Test users are tagged with a patterned email (e2e-test+*@test.itamba.local) so you can
 * query and delete them afterwards. See docs/e2e-testing.md.
 *
 * Run with visualization: npx cypress open
 * Run headless: npx cypress run
 */

import { generateTestUserEmail } from '../support/test-user'
import { perfRequests } from '../support/commands'

const defaultPassword = 'TestPass1'

function getTestPassword(): string {
  return Cypress.env('testPassword') ?? defaultPassword
}

describe('Signup with phone number', () => {
  beforeEach(() => {
    cy.clearPerfData()
    // Request logging for performance report (this spec only).
    // We use req.continue() without a response callback to avoid "Socket closed before finished writing response"
    // on flaky connections; the report will list request URL/method but duration/status may be 0.
    cy.intercept('**', (req) => {
      if (req.url.includes('__cypress') || req.url.includes('/__/')) {
        req.continue()
        return
      }
      if (req.url.includes('/assets/') || /\.(png|jpg|jpeg|gif|ico|svg|woff2?|css|js)(\?|$)/i.test(req.url)) {
        req.continue()
        return
      }
      req.continue()
      // Log after continue (no response callback) so we don't fail on socket errors
      perfRequests.push({
        url: req.url,
        method: req.method,
        duration: 0,
        status: 0,
      })
    })
    // Register after catch-all so this route wins and cy.wait('@sendSignupOtp') receives the request
    cy.intercept('POST', '**/v2/api/public/users/send-signup-otp').as('sendSignupOtp')
  })

  it('completes full phone signup flow (phone → OTP → password → career → success)', () => {
    const testStart = Date.now()
    const locale = 'en'
    const signupPath = `/${locale}/auth/signup`

    cy.task<string>('getNextTestPhone').as('testPhone')
    cy.visit(signupPath)
    cy.recordScreen('signup-phone')

    // --- Step 1: Phone number (unique per run via e2e-phone-state.json) ---
    cy.get('[data-testid="signup-phone-input"]').should('be.visible')
    cy.get<string>('@testPhone').then((phone) => {
      cy.get('[data-testid="signup-phone-input"]').type(phone)
    })
    cy.get('[data-testid="signup-phone-submit"]').click()

    cy.wait('@sendSignupOtp').then((interception) => {
      const body = interception.response?.body as { requestId?: string } | undefined
      const requestId = body?.requestId
      expect(requestId, 'send-signup-otp should return requestId').to.be.a('string')
      cy.wrap(requestId).as('requestId')
    })

    cy.url().should('include', '/auth/signup/phone/otp')
    cy.recordScreen('signup-otp')
    cy.get('[data-testid="signup-otp-input"]').should('be.visible')

    // --- Step 2: OTP (admin fetches OTP via task) ---
    cy.get('@requestId').then((requestId) => {
      cy.task<{ otp: string }>('getOtpByRequestId', { requestId }).then((result) => {
        expect(result?.otp, 'OTP from admin API').to.be.a('string')
        expect(result!.otp.length).to.eq(6)
        cy.get('[data-testid="signup-otp-input"]').type(result!.otp)
      })
    })

    cy.url().should('include', '/auth/signup/password')
    cy.recordScreen('signup-password')

    // --- Step 3: Password ---
    const password = getTestPassword()
    cy.get('input[placeholder="********"]').first().type(password)
    cy.get('input[placeholder="********"]').last().type(password)
    cy.get('[data-testid="signup-password-submit"]').click()

    cy.url().should('include', '/auth/signup/career')
    cy.recordScreen('signup-career')

    // --- Step 4: Career ---
    cy.contains('button', 'Student').click()
    cy.get('[data-testid="signup-career-submit"]').click()

    // --- Success ---
    cy.url().should('include', '/auth/signup/success')
    cy.recordScreen('signup-success')

    // Complete profile via UI (click button, fill form, submit) so the request is sent from the app.
    // Use a patterned email (e2e-test+*@test.itamba.local) so test users can be found and deleted later.
    const testEmail = generateTestUserEmail()
    cy.intercept('PUT', '**/v2/api/client/users/*/complete-profile').as('completeProfile')
    cy.get('[data-testid="signup-success-complete-profile"]').click()

    cy.url().should('include', '/profile/complete')
    cy.recordScreen('complete-profile')
    cy.get('[data-testid="complete-profile-full-name"]').should('be.visible').type('E2E Test User')
    cy.get('[data-testid="complete-profile-submit"]').click()
    cy.get('[data-testid="complete-profile-submit"]').click()
    cy.get('[data-testid="complete-profile-email"]').type(testEmail)
    cy.get('[data-testid="complete-profile-submit"]').click()
    cy.get('[data-testid="complete-profile-location"]').type('Test City')
    cy.get('[data-testid="complete-profile-submit"]').click()

    cy.wait('@completeProfile')
    cy.url().should('include', '/client')
    cy.recordScreen('client')

    // Close first-time user modal if open (pointer-events: none on body otherwise blocks header click)
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="restriction-modal-close"]').length) {
        cy.get('[data-testid="restriction-modal-close"]').click()
      }
    })
    // Sign in immediately after signup to ensure sign-in flow works
    cy.get('[data-testid="header-user-menu"]').should('be.visible').click()
    cy.get('[data-testid="header-logout"]').click()
    cy.url().should('satisfy', (url: string) => url.includes('/auth/signin') || url.includes('/auth/signup'))
    cy.visit(`/${locale}/auth/signin`)
    cy.get('[data-testid="signin-switch-to-email"]').click()
    cy.get('[data-testid="signin-email"]').type(testEmail)
    cy.get('[data-testid="signin-password"]').type(password)
    cy.get('[data-testid="signin-submit"]').click()
    cy.url().should('include', '/client')

    cy.then(() => {
      const totalMs = Date.now() - testStart
      cy.log(`⏱ Total test duration: ${(totalMs / 1000).toFixed(2)}s`)
    })
    cy.getPerfData().then((data) => {
      cy.task<string>('writePerformanceReport', data).then((reportPath) => {
        cy.log(`Performance report: ${reportPath}`)
      })
    })
  })
})
