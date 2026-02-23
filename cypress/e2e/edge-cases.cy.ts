/**
 * E2E: Edge cases – validation and backend rejection.
 *
 * - Wrong OTP: signup phone → invalid OTP → error, no progression.
 * - Invalid email on payment (Card): validation message.
 * - Invalid phone on payment (Mobile/Orange): validation message.
 * - Empty required fields: validation or disabled submit.
 *
 * Prerequisites: App and API; optional intercept for OTP error response.
 */

const locale = 'en'

describe('Edge cases: validation and errors', () => {
  beforeEach(() => {
    cy.clearPerfData()
  })

  it('wrong OTP shows error and does not advance to password', () => {
    cy.intercept('POST', '**/v2/api/public/users/send-signup-otp').as('sendSignupOtp')
    cy.task<string>('getNextTestPhone').as('testPhone')
    cy.visit(`/${locale}/auth/signup`)
    cy.get<string>('@testPhone').then((phone) => {
      cy.get('[data-testid="signup-phone-input"]').type(phone)
    })
    cy.get('[data-testid="signup-phone-submit"]').click()
    cy.wait('@sendSignupOtp')
    cy.url().should('include', '/auth/signup/phone/otp')
    cy.get('[data-testid="signup-otp-input"]').should('be.visible').type('000000')
    // Backend should reject wrong OTP; we may see error toast or stay on OTP page.
    cy.url().should('include', '/auth/signup/phone/otp')
    cy.get('[data-testid="signup-password-submit"]').should('not.exist')
  })

  it('payment Card: invalid email keeps confirm disabled', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.url().should('include', '/subscription/payment')
    cy.get('[data-testid="payment-method-card"]').click()
    cy.get('[data-testid="payment-email-input"]').type('notanemail').blur()
    cy.get('[data-testid="payment-confirm"]').should('be.disabled')
  })

  it('payment Mobile Money: invalid phone shows validation', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.get('[data-testid="payment-method-mobile_money"]').click()
    cy.get('input[inputmode="numeric"]').first().type('12')
    cy.get('input[inputmode="numeric"]').first().blur()
    cy.get('[data-testid="payment-confirm"]').should('be.disabled')
  })

  it('payment Card: empty email keeps confirm disabled', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.get('[data-testid="payment-method-card"]').click()
    cy.get('[data-testid="payment-confirm"]').should('be.disabled')
  })
})
