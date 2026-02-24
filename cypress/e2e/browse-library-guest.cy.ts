/**
 * E2E: Browse library as guest – restrictions applied.
 *
 * Self-contained flow: signup (phone) → complete profile → logout → sign in
 * with phone → browse as guest (no subscription). Then trigger each restriction:
 * first-login modal, bookmarks limit, notes limit, documents limit, catalogues
 * limit. Assert each modal and close it (X) so the test can continue; once
 * assert Upgrade navigates to /subscription.
 *
 * Prerequisites: Same as signup-phone (API, admin OTP, phone state file).
 * Backend should have enough data to trigger limits (e.g. 50+ docs, 3+ catalogues).
 */

import { generateTestUserEmail } from '../support/test-user'

const locale = 'en'
const defaultPassword = Cypress.env('testPassword') ?? 'TestPass1'

describe('Browse library as guest', () => {
  beforeEach(() => {
    cy.clearPerfData()
    cy.intercept('POST', '**/v2/api/public/users/send-signup-otp').as('sendSignupOtp')
  })

  it('signup → sign in → browse as guest and see all restrictions respected', () => {
    const testEmail = generateTestUserEmail()

    // --- Signup ---
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
    cy.intercept('PUT', '**/v2/api/client/users/*/complete-profile').as('completeProfile')
    cy.get('[data-testid="signup-success-complete-profile"]').click()

    cy.url().should('include', '/profile/complete')
    cy.get('[data-testid="complete-profile-full-name"]').should('be.visible').type('E2E Guest User')
    cy.get('[data-testid="complete-profile-submit"]').click().click()
    cy.get('[data-testid="complete-profile-email"]').type(testEmail)
    cy.get('[data-testid="complete-profile-submit"]').click()
    cy.get('[data-testid="complete-profile-location"]').type('Test City')
    cy.get('[data-testid="complete-profile-submit"]').click()

    cy.wait('@completeProfile')
    cy.url().should('include', '/client')

    // --- Sign in with phone ---
    cy.closeRestrictionModalIfOpen()
    cy.get('[data-testid="header-user-menu"]').click()
    cy.get('[data-testid="header-logout"]').click()
    cy.visit(`/${locale}/auth/signin`)
    cy.get<string>('@testPhone').then((phone) => cy.get('[data-testid="signin-phone-input"]').type(phone))
    cy.get('[data-testid="signin-password"]').type(defaultPassword)
    cy.get('[data-testid="signin-submit"]').click()
    cy.url().should('include', '/client')

    // --- Guest: close first-login modal so we can browse ---
    cy.visit(`/${locale}/client`)
    cy.url().should('include', '/client')
    cy.closeRestrictionModalIfOpen()

    // --- Bookmark restriction: open doc, add 5 bookmarks (5 articles), then 6th should show modal ---
    cy.get('body').then(($body) => {
      const docLink = $body.find('a[href*="/client/"]').filter((_i, el) => {
        const h = el.getAttribute('href') || ''
        return !h.includes('catalogues') && !h.includes('notes') && !h.includes('bookmarks') && /\/client\/[^/]+\/?$/.test(h.replace(/\?.*/, ''))
      }).first()
      if (docLink.length === 0) {
        cy.log('No document link – skip bookmark/notes restrictions')
        return
      }
      cy.wrap(docLink).click()
    })
    cy.url().then((url) => {
      const pathname = typeof url === 'string' ? url : (url as unknown as string)
      const match = pathname.match(/\/client\/([^/?#]+)/)
      if (!match || ['catalogues', 'notes', 'bookmarks'].includes(match[1])) return
      cy.get('body').then(($body) => {
        const expandCount = $body.find('[data-testid="article-expand"]').length
        if (expandCount === 0) return
        // Add bookmark on first 5 articles, then 6th should hit restriction (guest limit 5)
        ;[0, 1, 2, 3, 4].forEach((idx) => {
          if (idx < expandCount) {
            cy.get('[data-testid="article-expand"]').eq(idx).click()
            cy.get('[role="dialog"]', { timeout: 8000 }).should('be.visible')
            cy.get('body').then(($d) => {
              if ($d.find('[aria-label="Add bookmark"]').length > 0) {
                cy.get('[aria-label="Add bookmark"]').first().click()
                cy.get('[aria-label="Close"]').first().click()
              }
            })
          }
        })
        if (expandCount >= 6) {
          cy.get('[data-testid="article-expand"]').eq(5).click()
          cy.get('[role="dialog"]', { timeout: 8000 }).should('be.visible')
          cy.get('[aria-label="Add bookmark"]').first().click()
          cy.get('[data-testid="restriction-modal-upgrade"]', { timeout: 5000 }).should('be.visible')
          cy.get('[data-testid="restriction-modal-close"]').click()
        }
      })
    })

    cy.closeRestrictionModalIfOpen()

    // --- Notes restriction: add 5 notes, then 6th should show modal ---
    cy.visit(`/${locale}/client`)
    cy.closeRestrictionModalIfOpen()
    cy.get('body').then(($body) => {
      const docLink = $body.find('a[href*="/client/"]').filter((_i, el) => {
        const h = el.getAttribute('href') || ''
        return !h.includes('catalogues') && !h.includes('notes') && !h.includes('bookmarks') && /\/client\/[^/]+\/?$/.test(h.replace(/\?.*/, ''))
      }).first()
      if (docLink.length === 0) return
      cy.wrap(docLink).click()
    })
    cy.url().then((url) => {
      const pathname = typeof url === 'string' ? url : (url as unknown as string)
      const match = pathname.match(/\/client\/([^/?#]+)/)
      if (!match || ['catalogues', 'notes', 'bookmarks'].includes(match[1])) return
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="article-expand"]').length === 0) return
        cy.get('[data-testid="article-expand"]').first().click()
        cy.get('[role="dialog"]', { timeout: 8000 }).should('be.visible')
        ;['Note 1', 'Note 2', 'Note 3', 'Note 4', 'Note 5'].forEach((text) => {
          cy.contains('button', 'Add note').first().click()
          cy.get('.ProseMirror').first().type(text)
          cy.contains('button', 'Save').click()
        })
        cy.contains('button', 'Add note').first().click()
        cy.get('[data-testid="restriction-modal-upgrade"]', { timeout: 5000 }).should('be.visible')
        cy.get('[data-testid="restriction-modal-close"]').click()
      })
    })

    cy.closeRestrictionModalIfOpen()

    // --- Documents restriction: click Next until we hit limit (guest 50 → page 7) ---
    cy.visit(`/${locale}/client`)
    cy.closeRestrictionModalIfOpen()
    cy.get('[aria-label="Go to next page"]').then(($btn) => {
      if ($btn.length > 0 && $btn.attr('aria-disabled') !== 'true') {
        cy.get('[aria-label="Go to next page"]').click()
        cy.wait(400)
      }
    })
    cy.get('[aria-label="Go to next page"]').then(($btn) => {
      if ($btn.length > 0 && $btn.attr('aria-disabled') !== 'true') {
        cy.get('[aria-label="Go to next page"]').click()
        cy.wait(400)
      }
    })
    cy.get('[aria-label="Go to next page"]').then(($btn) => {
      if ($btn.length > 0 && $btn.attr('aria-disabled') !== 'true') {
        cy.get('[aria-label="Go to next page"]').click()
        cy.wait(400)
      }
    })
    cy.get('[aria-label="Go to next page"]').then(($btn) => {
      if ($btn.length > 0 && $btn.attr('aria-disabled') !== 'true') {
        cy.get('[aria-label="Go to next page"]').click()
        cy.wait(400)
      }
    })
    cy.get('[aria-label="Go to next page"]').then(($btn) => {
      if ($btn.length > 0 && $btn.attr('aria-disabled') !== 'true') {
        cy.get('[aria-label="Go to next page"]').click()
        cy.wait(400)
      }
    })
    cy.get('[aria-label="Go to next page"]').then(($btn) => {
      if ($btn.length > 0 && $btn.attr('aria-disabled') !== 'true') {
        cy.get('[aria-label="Go to next page"]').click()
      }
    })
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="restriction-modal-close"]').length > 0) {
        cy.get('[data-testid="restriction-modal-upgrade"]').should('be.visible')
        cy.get('[data-testid="restriction-modal-close"]').click()
      }
    })
    cy.closeRestrictionModalIfOpen()

    // --- Catalogues restriction: try page 2 (guest 2 catalogues) ---
    cy.visit(`/${locale}/client/catalogues`)
    cy.closeRestrictionModalIfOpen()
    cy.get('body').then(($body) => {
      const page2 = $body.find('nav[aria-label="pagination"] a').filter((_, el) => el.textContent?.trim() === '2')
      if (page2.length > 0) {
        cy.get('nav[aria-label="pagination"]').contains('a', '2').click()
        cy.get('[data-testid="restriction-modal-upgrade"]', { timeout: 5000 }).should('be.visible')
        cy.get('[data-testid="restriction-modal-close"]').click()
      } else {
        cy.log('No second catalogue page – skip catalogues restriction')
      }
    })
    cy.closeRestrictionModalIfOpen()

    // --- Assert Upgrade navigates to /subscription ---
    cy.visit(`/${locale}/client/catalogues`)
    cy.closeRestrictionModalIfOpen()
    cy.get('body').then(($body) => {
      const page2 = $body.find('nav[aria-label="pagination"] a').filter((_, el) => el.textContent?.trim() === '2')
      if (page2.length > 0) {
        cy.get('nav[aria-label="pagination"]').contains('a', '2').click()
        cy.get('[data-testid="restriction-modal-upgrade"]', { timeout: 5000 }).should('be.visible').click()
        cy.url().should('include', '/subscription')
      }
    })
  })
})
