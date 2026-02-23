/**
 * E2E: Subscription only – plan selection and payment page.
 *
 * Run independently: npx cypress run --spec "cypress/e2e/subscription-only.cy.ts"
 *
 * Prerequisites: Set CYPRESS_TEST_USER_EMAIL and CYPRESS_TEST_PASSWORD for an existing user.
 * The spec logs in first, then tests only subscription flow (no browse, no auth).
 */

const locale = Cypress.env('locale') ?? 'en'

describe('Subscription only', () => {
  beforeEach(() => {
    cy.clearPerfData()
    const email = Cypress.env('testUserEmail')
    const password = Cypress.env('testPassword') ?? 'TestPass1'
    if (!email || !password) {
      throw new Error('Set CYPRESS_TEST_USER_EMAIL and CYPRESS_TEST_PASSWORD to run subscription-only spec')
    }
    cy.login(email, password)
  })

  it('shows subscription plans and can go to payment', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-plan-professional"]').should('exist')
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.url().should('include', '/subscription/payment')
  })

  it('payment page shows all three payment methods', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.get('[data-testid="payment-method-mobile_money"]').should('be.visible')
    cy.get('[data-testid="payment-method-orange_money"]').should('be.visible')
    cy.get('[data-testid="payment-method-card"]').should('be.visible')
  })
})
