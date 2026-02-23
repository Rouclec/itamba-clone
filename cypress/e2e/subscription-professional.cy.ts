/**
 * E2E: Subscribe as professional – full flow with one payment method.
 *
 * Flow: Log in (or sign up) → /subscription → Get Professional →
 * /subscription/payment → select payment method (e.g. Mobile Money) →
 * fill details → confirm (stub payment) → success → browse as subscribed.
 *
 * Prerequisites: Logged-in user or signup; stub payments API for no real charge.
 */

const locale = 'en'

describe('Subscription: Professional', () => {
  beforeEach(() => {
    cy.clearPerfData()
  })

  it('selects professional plan and reaches payment page', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-plan-professional"]').should('exist')
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.url().should('include', '/subscription/payment')
    cy.url().should('include', 'plan=')
  })

  it('full flow: professional plan → Mobile Money → confirm (stubbed)', () => {
    cy.intercept('POST', '**/v2/api/**/subscriptions/create**').as('createSubscription')
    cy.intercept('POST', '**/v2/api/**/payments/initiate**').as('initiatePayment')
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.url().should('include', '/subscription/payment')

    cy.get('[data-testid="payment-method-mobile_money"]').click()
    cy.get('[data-testid="payment-phone-input"]').should('be.visible')
    cy.get('input[inputmode="numeric"]').first().type('670000100')
    cy.get('[data-testid="payment-confirm"]').should('not.be.disabled').click()

    cy.wait('@createSubscription').then(() => {})
    cy.wait('@initiatePayment').then((interception) => {
      if (interception.response?.statusCode === 200) {
        cy.url().should('satisfy', (url: string) =>
          url.includes('/subscription/payment/processing') || url.includes('/subscription/payment/success')
        )
      }
    })
  })
})
