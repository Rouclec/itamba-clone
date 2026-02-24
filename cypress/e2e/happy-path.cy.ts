/**
 * E2E: Happy path – full flow end-to-end in one run.
 *
 * Flow: signup → complete profile → sign out → sign in → browse library (visit
 * client, catalogues, notes, bookmarks) → subscription (plan → payment) →
 * complete payment (mocked) → return to dashboard → open a document → add
 * bookmark, add note, edit note, delete note, remove bookmark → browse
 * catalogues → notes page → bookmarks page.
 *
 * Prerequisites: Same as signup-phone (API, admin OTP, phone state file).
 * Backend must have at least one published document for notes/bookmarks steps.
 *
 * Run: make e2e-happy-path
 */

import { generateTestUserEmail } from '../support/test-user'
import { perfRequests } from '../support/commands'

const locale = 'en'
const defaultPassword = Cypress.env('testPassword') ?? 'TestPass1'

describe('Happy path (E2E)', () => {
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

  it('signup → complete profile → sign in → browse library → subscription', () => {
    const testStart = Date.now()
    const password = defaultPassword

    // --- Signup (same as signup-phone) ---
    cy.task<string>('getNextTestPhone').as('testPhone')
    cy.visit(`/${locale}/auth/signup`)
    cy.recordScreen('signup-phone')

    cy.get('[data-testid="signup-phone-input"]').should('be.visible')
    cy.get<string>('@testPhone').then((phone) => cy.get('[data-testid="signup-phone-input"]').type(phone))
    cy.get('[data-testid="signup-phone-submit"]').click()

    cy.wait('@sendSignupOtp').then((interception) => {
      const requestId = (interception.response?.body as { requestId?: string })?.requestId
      expect(requestId).to.be.a('string')
      cy.wrap(requestId).as('requestId')
    })
    cy.url().should('include', '/auth/signup/phone/otp')
    cy.recordScreen('signup-otp')
    cy.get('[data-testid="signup-otp-input"]').should('be.visible')
    cy.get('@requestId').then((requestId) => {
      cy.task<{ otp: string }>('getOtpByRequestId', { requestId }).then((result) => {
        cy.get('[data-testid="signup-otp-input"]').type(result!.otp)
      })
    })

    cy.url().should('include', '/auth/signup/password')
    cy.recordScreen('signup-password')
    cy.get('input[placeholder="********"]').first().type(password)
    cy.get('input[placeholder="********"]').last().type(password)
    cy.get('[data-testid="signup-password-submit"]').click()

    cy.url().should('include', '/auth/signup/career')
    cy.recordScreen('signup-career')
    cy.get('[data-testid="signup-career-student"]').click()
    cy.get('[data-testid="signup-career-submit"]').click()

    cy.url().should('include', '/auth/signup/success')
    cy.recordScreen('signup-success')

    // --- Complete profile ---
    const testEmail = generateTestUserEmail()
    cy.intercept('PUT', '**/v2/api/client/users/*/complete-profile').as('completeProfile')
    cy.get('[data-testid="signup-success-complete-profile"]').click()
    cy.url().should('include', '/profile/complete')
    cy.recordScreen('complete-profile')
    cy.get('[data-testid="complete-profile-full-name"]').should('be.visible').type('E2E Happy Path User')
    cy.get('[data-testid="complete-profile-submit"]').click().click()
    cy.get('[data-testid="complete-profile-email"]').type(testEmail)
    cy.get('[data-testid="complete-profile-submit"]').click()
    cy.get('[data-testid="complete-profile-location"]').type('Test City')
    cy.get('[data-testid="complete-profile-submit"]').click()
    cy.wait('@completeProfile')
    cy.url().should('include', '/client')
    cy.recordScreen('client')

    cy.closeRestrictionModalIfOpen()
    // --- Sign in with phone (same as signup method) ---
    cy.get('[data-testid="header-user-menu"]').should('be.visible').click()
    cy.get('[data-testid="header-logout"]').click()
    cy.visit(`/${locale}/auth/signin`)
    cy.get<string>('@testPhone').then((phone) => cy.get('[data-testid="signin-phone-input"]').type(phone))
    cy.get('[data-testid="signin-password"]').type(password)
    cy.get('[data-testid="signin-submit"]').click()
    cy.url().should('include', '/client')
    cy.closeRestrictionModalIfOpen()

    // --- Browse library (same as browse-library spec) ---
    cy.visit(`/${locale}/client`)
    cy.url().should('include', '/client')
    cy.recordScreen('browse-library')
    cy.closeRestrictionModalIfOpen()

    cy.visit(`/${locale}/client/catalogues`)
    cy.url().should('include', '/client/catalogues')
    cy.closeRestrictionModalIfOpen()

    cy.visit(`/${locale}/client/notes`)
    cy.url().should('include', '/client/notes')
    cy.closeRestrictionModalIfOpen()

    cy.visit(`/${locale}/client/bookmarks`)
    cy.url().should('include', '/client/bookmarks')
    cy.closeRestrictionModalIfOpen()

    // --- Subscription: plan → payment → complete (mocked) → return to dashboard ---
    cy.visit(`/${locale}/subscription`)
    cy.get('[data-testid="subscription-plan-professional"]').should('exist')
    cy.get('[data-testid="subscription-cta-professional"]').click()
    cy.url().should('include', '/subscription/payment')
    cy.get('[data-testid="payment-method-mobile_money"]').should('be.visible')
    // Mock payment status so processing page redirects to success
    cy.intercept('GET', '**/v2/api/client/user/*/payments/*', {
      statusCode: 200,
      body: { payment: { status: 'PAYMENT_STATUS_COMPLETED' } },
    }).as('getPaymentStatus')
    cy.get('[data-testid="payment-phone-input"]').type('670000010')
    cy.get('[data-testid="payment-confirm"]').click()
    cy.url().should('include', '/subscription/payment/processing')
    cy.url({ timeout: 20000 }).should('include', '/subscription/payment/success')
    cy.get('[data-testid="payment-success-return-dashboard"]').click()
    cy.url().should('include', '/client')
    cy.recordScreen('client-after-payment')

    // --- Browse library: open a document, article modal, notes + bookmarks ---
    cy.visit(`/${locale}/client`)
    cy.url().should('include', '/client')
    // First document card link (exclude sidebar nav: catalogues, notes, bookmarks)
    cy.get('body').then(($body) => {
      const docLink = $body.find('a[href*="/client/"]').filter((_i, el) => {
        const h = el.getAttribute('href') || ''
        return !h.includes('catalogues') && !h.includes('notes') && !h.includes('bookmarks') && /\/client\/[^/]+\/?$/.test(h.replace(/\?.*/, ''))
      }).first()
      if (docLink.length === 0) {
        cy.log('No document link found – skip document/notes/bookmarks steps')
        return
      }
      cy.wrap(docLink).click()
    })
    cy.url().then((url) => {
      const pathname = typeof url === 'string' ? url : (url as unknown as string)
      const match = pathname.match(/\/client\/([^/?#]+)/)
      if (!match || ['catalogues', 'notes', 'bookmarks'].includes(match[1])) return
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="article-expand"]').length === 0) return
        cy.get('[data-testid="article-expand"]').first().click()
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
      cy.get('[aria-label="Add bookmark"]').click()
      cy.contains('button', 'Add note').click()
      cy.get('.ProseMirror').first().type('Happy path note')
      cy.contains('button', 'Save').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Happy path note').should('be.visible')
      })
      cy.get('[aria-label="Edit note"]').first().click()
      cy.get('.ProseMirror').first().clear().type('Updated note')
      cy.contains('button', 'Save').click()
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Updated note').should('be.visible')
      })
      cy.get('[aria-label="Delete"]').first().click()
      cy.get('[role="alertdialog"]').within(() => {
        cy.contains('button', 'Delete').click()
      })
      cy.get('[aria-label="Remove bookmark"]').click()
      cy.get('[aria-label="Close"]').click()
      })
    })

    // --- Browse catalogues, then notes and bookmarks pages ---
    cy.visit(`/${locale}/client/catalogues`)
    cy.url().should('include', '/client/catalogues')
    cy.recordScreen('catalogues')
    cy.visit(`/${locale}/client/notes`)
    cy.url().should('include', '/client/notes')
    cy.recordScreen('notes')
    cy.visit(`/${locale}/client/bookmarks`)
    cy.url().should('include', '/client/bookmarks')
    cy.recordScreen('bookmarks')

    cy.then(() => {
      const totalMs = Date.now() - testStart
      cy.log(`⏱ Happy path duration: ${(totalMs / 1000).toFixed(2)}s`)
    })
    cy.getPerfData().then((data) => {
      cy.task<string>('writePerformanceReport', data).then((reportPath) => {
        cy.log(`Performance report: ${reportPath}`)
      })
    })
  })
})
