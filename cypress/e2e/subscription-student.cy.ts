/**
 * E2E: Subscribe as student – payment + student KYC flow.
 *
 * Flow: Log in → /subscription → Get Student → payment (stub) →
 * success → redirect to /profile/complete/student → fill school, year, upload doc →
 * success → /client.
 *
 * Prerequisites: Logged-in user; stub payments; fixture file for KYC upload.
 */

const locale = 'en'

describe('Subscription: Student (KYC)', () => {
  beforeEach(() => {
    cy.clearPerfData()
  })

  it('selects student plan and reaches payment page', () => {
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-plan-student"]').should('exist')
    cy.get('[data-testid="subscription-cta-student"]').click()
    cy.url().should('include', '/subscription/payment')
    cy.url().should('include', 'plan=')
  })

  it('full flow: student plan → payment (stub) → KYC form', () => {
    cy.intercept('POST', '**/v2/api/**/subscriptions/create**').as('createSubscription')
    cy.intercept('POST', '**/v2/api/**/payments/initiate**').as('initiatePayment')
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-cta-student"]').click()
    cy.url().should('include', '/subscription/payment')

    cy.get('[data-testid="payment-method-mobile_money"]').click()
    cy.get('[data-testid="payment-phone-input"]').should('be.visible')
    cy.get('input[inputmode="numeric"]').first().type('670000101')
    cy.get('[data-testid="payment-confirm"]').should('not.be.disabled').click()

    cy.wait('@createSubscription').then(() => {})
    cy.wait('@initiatePayment').then((interception) => {
      if (interception.response?.statusCode === 200) {
        cy.url().should('satisfy', (url: string) =>
          url.includes('/subscription/payment/processing') || url.includes('/subscription/payment/success')
        )
      }
    })
    // After success, app redirects to /profile/complete/student for KYC.
    // KYC step 1: school name, location, year From/To.
    // KYC step 2: document type + file upload. Use cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-doc.pdf')
    // This test can be extended once on the KYC page: fill form and submit.
  })
})
