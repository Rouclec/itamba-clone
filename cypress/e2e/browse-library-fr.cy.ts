/**
 * E2E: Complete browse + subscription flow in French locale.
 *
 * Flow: Visit /fr/... → subscription (French labels) → plan → payment →
 * confirm (stub) → assert French copy throughout.
 *
 * Prerequisites: Same as subscription flow; French translations present.
 */

const locale = 'fr'

describe('Browse library & subscription (French)', () => {
  beforeEach(() => {
    cy.clearPerfData()
  })

  it('subscription page shows French labels', () => {
    cy.visit(`/${locale}/subscription`)
    cy.contains('button', 'Payer mensuellement').should('be.visible')
    cy.contains('button', 'Payer annuellement').should('be.visible')
  })

  it('payment page shows French confirm button', () => {
    cy.intercept('POST', '**/v2/api/**/subscriptions/create**').as('createSubscription')
    cy.intercept('POST', '**/v2/api/**/payments/initiate**').as('initiatePayment')
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.url().should('include', '/fr/subscription/payment')
    cy.get('[data-testid="payment-confirm"]').should('contain.text', 'Confirmer')
  })

  it('full flow in French: professional → Mobile Money → confirm', () => {
    cy.intercept('POST', '**/v2/api/**/subscriptions/create**').as('createSubscription')
    cy.intercept('POST', '**/v2/api/**/payments/initiate**').as('initiatePayment')
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.get('[data-testid="payment-method-mobile_money"]').click()
    cy.get('input[inputmode="numeric"]').first().type('670000300')
    cy.get('[data-testid="payment-confirm"]').click()
    cy.wait('@initiatePayment')
    cy.url().should('include', '/fr/')
  })
})
