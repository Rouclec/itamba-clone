/**
 * E2E: All three payment methods – Mobile Money, Orange Money, Card.
 *
 * Each test: go to payment page with a plan → select method → fill form →
 * confirm (stub) → assert redirect.
 *
 * Prerequisites: Plan ID in URL (from subscription page); stub payments API.
 */

const locale = 'en'

describe('Subscription: Payment methods', () => {
  beforeEach(() => {
    cy.clearPerfData()
    cy.intercept('POST', '**/v2/api/**/subscriptions/create**').as('createSubscription')
    cy.intercept('POST', '**/v2/api/**/payments/initiate**').as('initiatePayment')
  })

  it('Mobile Money: select method, enter phone, confirm', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.url().should('include', '/subscription/payment')

    cy.get('[data-testid="payment-method-mobile_money"]').click()
    cy.get('[data-testid="payment-phone-input"]').should('be.visible')
    cy.get('input[inputmode="numeric"]').first().type('670000200')
    cy.get('[data-testid="payment-confirm"]').click()
    cy.wait('@initiatePayment')
    cy.url().should('satisfy', (url: string) =>
      url.includes('/subscription/payment/processing') || url.includes('/subscription/payment/success')
    )
  })

  it('Orange Money: select method, enter phone, confirm', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.url().should('include', '/subscription/payment')

    cy.get('[data-testid="payment-method-orange_money"]').click()
    cy.get('[data-testid="payment-phone-input"]').should('be.visible')
    cy.get('input[inputmode="numeric"]').first().type('670000201')
    cy.get('[data-testid="payment-confirm"]').click()
    cy.wait('@initiatePayment')
    cy.url().should('satisfy', (url: string) =>
      url.includes('/subscription/payment/processing') || url.includes('/subscription/payment/success')
    )
  })

  it('Card: select method, enter email, confirm', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.url().should('include', '/subscription/payment')

    cy.get('[data-testid="payment-method-card"]').click()
    cy.get('[data-testid="payment-email-input"]').should('be.visible').type('e2e-card@test.itamba.local')
    cy.get('[data-testid="payment-confirm"]').click()
    cy.wait('@initiatePayment')
    // Card may redirect to Stripe checkoutUrl; with stub we might get processing/success or redirect.
    cy.url().should('satisfy', (url: string) =>
      url.includes('/subscription/payment/processing') ||
      url.includes('/subscription/payment/success') ||
      url.includes('stripe.com') ||
      url.includes('checkout')
    )
  })
})
