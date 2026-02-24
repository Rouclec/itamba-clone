/// <reference types="cypress" />

/**
 * Custom Cypress commands for Itamba E2E tests.
 */

/** Collected request timings (used by performance report). */
export const perfRequests: Array<{
  url: string
  method: string
  duration: number
  status: number
}> = []

/** Screen timestamps for time-per-screen (call recordScreen after each step). */
export const screenTimes: Array<{ screen: string; timestamp: number }> = []

/**
 * Clear performance data (call in beforeEach when using the report).
 */
Cypress.Commands.add('clearPerfData', () => {
  perfRequests.length = 0
  screenTimes.length = 0
})

/**
 * Record that the test reached this screen now (for time-per-screen chart).
 */
Cypress.Commands.add('recordScreen', (name: string) => {
  screenTimes.push({ screen: name, timestamp: Date.now() })
})

/**
 * Get collected performance data to pass to writePerformanceReport task.
 */
Cypress.Commands.add('getPerfData', () => {
  return cy.wrap({
    requests: [...perfRequests],
    screenTimes: [...screenTimes],
  })
})

/**
 * Log in with email and password. Visits signin, switches to email method, fills and submits.
 * Use for browse-only and subscription-only specs when you have a test user (e.g. CYPRESS_TEST_USER_EMAIL / CYPRESS_TEST_PASSWORD).
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  const locale = Cypress.env('locale') ?? 'en'
  cy.visit(`/${locale}/auth/signin`)
  cy.get('[data-testid="signin-switch-to-email"]').click()
  cy.get('[data-testid="signin-email"]').type(email)
  cy.get('[data-testid="signin-password"]').type(password)
  cy.get('[data-testid="signin-submit"]').click()
  cy.url().should('include', '/client')
})

/**
 * Get page load time from the last navigation (if exposed by support/e2e).
 */
Cypress.Commands.add('getPageLoadTime', () => {
  return cy.window().then((win) => {
    const perf = (win as unknown as { __cypressPerf?: { loadTime?: number } }).__cypressPerf
    const loadTime = perf?.loadTime ?? null
    return cy.wrap(loadTime)
  })
})

/**
 * If the restriction modal (first-login or limit) is open, click the close (X) button
 * so the page is interactive again. Then wait for the header user menu to be visible.
 * Call this before interacting with header or other UI when a modal might be open.
 */
Cypress.Commands.add('closeRestrictionModalIfOpen', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="restriction-modal-close"]').length > 0) {
      cy.get('[data-testid="restriction-modal-close"]').click()
    }
  })
  cy.get('[data-testid="header-user-menu"]').should('be.visible')
})

declare global {
  namespace Cypress {
    interface Chainable {
      clearPerfData(): Chainable<void>
      recordScreen(name: string): Chainable<void>
      getPerfData(): Chainable<{ requests: typeof perfRequests; screenTimes: typeof screenTimes }>
      login(email: string, password: string): Chainable<void>
      getPageLoadTime(): Chainable<number | null>
      closeRestrictionModalIfOpen(): Chainable<void>
    }
  }
}

export {}
