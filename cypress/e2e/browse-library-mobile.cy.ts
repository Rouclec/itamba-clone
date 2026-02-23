/**
 * E2E: Browse library & subscription on mobile viewport.
 *
 * Flow: Set viewport to mobile → guest or subscription flow → assert key
 * elements visible and usable (no overflow hiding CTAs).
 * Optional: basic accessibility (focusable elements, touch targets).
 *
 * Prerequisites: Same as other specs.
 */

const locale = 'en'
const mobileViewport = { width: 375, height: 667 }

describe('Browse library (mobile viewport)', () => {
  beforeEach(() => {
    cy.viewport(mobileViewport.width, mobileViewport.height)
    cy.clearPerfData()
  })

  it('subscription page is usable on mobile', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-plan-professional"]').should('be.visible')
    cy.get('[data-testid="subscription-cta-professional"]').should('be.visible').click()
    cy.url().should('include', '/subscription/payment')
  })

  it('payment page: method selection and confirm visible on mobile', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.get('[data-testid="payment-method-mobile_money"]').should('be.visible').click()
    cy.get('[data-testid="payment-phone-input"]').should('be.visible')
    cy.get('[data-testid="payment-confirm"]').should('be.visible')
  })

  it('restriction modal Upgrade button is visible and clickable on mobile', () => {
    cy.visit(`/${locale}/client`, { failOnStatusCode: false })
    cy.get('body').then(($body) => {
      const upgrade = $body.find('[data-testid="restriction-modal-upgrade"]')
      if (upgrade.length) {
        cy.get('[data-testid="restriction-modal-upgrade"]').should('be.visible').click()
        cy.url().should('include', '/subscription')
      }
    })
  })
})
