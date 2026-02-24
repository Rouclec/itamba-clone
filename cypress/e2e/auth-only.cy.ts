/**
 * E2E: Authentication only – signup, complete profile, sign out, sign in.
 *
 * Run independently: npx cypress run --spec "cypress/e2e/auth-only.cy.ts"
 *
 * Prerequisites: Same as signup-phone (API, admin OTP, phone state file).
 */

import { generateTestUserEmail } from '../support/test-user'

const locale = 'en'
const defaultPassword = Cypress.env('testPassword') ?? 'TestPass1'

describe('Authentication only', () => {
  beforeEach(() => {
    cy.clearPerfData()
    cy.intercept('POST', '**/v2/api/public/users/send-signup-otp').as('sendSignupOtp')
  })

  it('signup (phone → OTP → password → career) → complete profile → sign out → sign in with email', () => {
    cy.task<string>('getNextTestPhone').as('testPhone')
    cy.visit(`/${locale}/auth/signup`)

    cy.get('[data-testid="signup-phone-input"]').should('be.visible')
    cy.get<string>('@testPhone').then((phone) => cy.get('[data-testid="signup-phone-input"]').type(phone))
    cy.get('[data-testid="signup-phone-submit"]').click()

    cy.wait('@sendSignupOtp').then((interception) => {
      const requestId = (interception.response?.body as { requestId?: string })?.requestId
      expect(requestId).to.be.a('string')
      cy.wrap(requestId).as('requestId')
    })
    cy.get('[data-testid="signup-otp-input"]').should('be.visible')
    cy.get('@requestId').then((requestId) => {
      cy.task<{ otp: string }>('getOtpByRequestId', { requestId }).then((result) => {
        cy.get('[data-testid="signup-otp-input"]').type(result!.otp)
      })
    })

    cy.url().should('include', '/auth/signup/password')
    cy.get('input[placeholder="********"]').first().type(defaultPassword)
    cy.get('input[placeholder="********"]').last().type(defaultPassword)
    cy.get('[data-testid="signup-password-submit"]').click()

    cy.url().should('include', '/auth/signup/career')
    cy.get('[data-testid="signup-career-student"]').click()
    cy.get('[data-testid="signup-career-submit"]').click()

    cy.url().should('include', '/auth/signup/success')
    const testEmail = generateTestUserEmail()
    cy.get('[data-testid="signup-success-complete-profile"]').click()

    cy.url().should('include', '/profile/complete')
    cy.get('[data-testid="complete-profile-full-name"]').should('be.visible').type('E2E Auth User')
    cy.get('[data-testid="complete-profile-submit"]').click().click()
    cy.get('[data-testid="complete-profile-email"]').type(testEmail)
    cy.get('[data-testid="complete-profile-submit"]').click()
    cy.get('[data-testid="complete-profile-location"]').type('Test City')
    cy.get('[data-testid="complete-profile-submit"]').click()

    cy.url().should('include', '/client')

    cy.closeRestrictionModalIfOpen()
    cy.get('[data-testid="header-user-menu"]').click()
    cy.get('[data-testid="header-logout"]').click()
    cy.url().should("include", '/auth/signin')

    // Sign in with phone (same as signup method)
    cy.get<string>('@testPhone').then((phone) => cy.get('[data-testid="signin-phone-input"]').type(phone))
    cy.get('[data-testid="signin-password"]').type(defaultPassword)
    cy.get('[data-testid="signin-submit"]').click()
    cy.url().should('include', '/client')
  })
})
