/**
 * E2E: Browse library only – documents, catalogues, notes, bookmarks; create a note and a bookmark.
 *
 * Run independently: npx cypress run --spec "cypress/e2e/browse-library.cy.ts"
 *
 * Prerequisites: Same as signup-phone (API, CYPRESS_ADMIN_EMAIL, CYPRESS_ADMIN_PASSWORD for OTP task, phone state file).
 * Flow: sign up a new user (phone) → complete profile → browse library as that user (no existing bookmarks/notes).
 */

import { generateTestUserEmail } from '../support/test-user'

const localeEn = Cypress.env('locale') ?? 'en'
const defaultPassword = Cypress.env('testPassword') ?? 'TestPass1'

function runSignupAndCompleteProfile(locale: string) {
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
  const testEmail = generateTestUserEmail()
  cy.intercept('PUT', '**/v2/api/client/users/*/complete-profile').as('completeProfile')
  cy.get('[data-testid="signup-success-complete-profile"]').click()
  cy.url().should('include', '/profile/complete')
  cy.get('[data-testid="complete-profile-full-name"]').should('be.visible').type('E2E Browse User')
  cy.get('[data-testid="complete-profile-submit"]').click().click()
  cy.get('[data-testid="complete-profile-email"]').type(testEmail)
  cy.get('[data-testid="complete-profile-submit"]').click()
  cy.get('[data-testid="complete-profile-location"]').type('Test City')
  cy.get('[data-testid="complete-profile-submit"]').click()
  cy.wait('@completeProfile')
  cy.url().should('include', '/client')
  cy.closeRestrictionModalIfOpen()
}

describe('Browse library only', () => {
  beforeEach(() => {
    cy.clearPerfData()
    const adminEmail = Cypress.env('adminEmail')
    const adminPassword = Cypress.env('adminPassword')
    if (!adminEmail || !adminPassword) {
      throw new Error('Set CYPRESS_ADMIN_EMAIL and CYPRESS_ADMIN_PASSWORD to run browse-library spec (used for OTP task)')
    }
    cy.intercept('POST', '**/v2/api/public/users/send-signup-otp').as('sendSignupOtp')
    runSignupAndCompleteProfile(localeEn)
  })

  it('shows library home (documents)', () => {
    cy.url().should('include', '/client')
  })

  it('can open catalogues', () => {
    cy.visit(`/${localeEn}/client/catalogues`)
    cy.url().should('include', '/client/catalogues')
  })

  it('can open notes list', () => {
    cy.visit(`/${localeEn}/client/notes`)
    cy.url().should('include', '/client/notes')
  })

  it('can open bookmarks list', () => {
    cy.visit(`/${localeEn}/client/bookmarks`)
    cy.url().should('include', '/client/bookmarks')
  })

  /** Opens the first document card that has at least one article; uses pagination if needed. */
  function openFirstDocumentWithArticles() {
    cy.get('a[href*="/client/"]').then(($links) => {
      const filtered = $links.filter((_i, el) => {
        const h = el.getAttribute('href') || ''
        if (h.includes('catalogues') || h.includes('notes') || h.includes('bookmarks')) return false
        if (!/\/client\/[^/]+\/?$/.test(h.replace(/\?.*/, ''))) return false
        return !/\b0\s+article/i.test(el.textContent ?? '')
      })
      if (filtered.length > 0) {
        cy.wrap(filtered.first()).click()
        return
      }
      cy.get('a[href="#"]').contains('2').first().click({ force: true })
      cy.get('a[href*="/client/"]').filter((_i, el) => {
        const h = el.getAttribute('href') || ''
        if (h.includes('catalogues') || h.includes('notes') || h.includes('bookmarks')) return false
        if (!/\/client\/[^/]+\/?$/.test(h.replace(/\?.*/, ''))) return false
        return !/\b0\s+article/i.test(el.textContent ?? '')
      }).first().click()
    })
  }

  it('opens a document with articles, bookmark and note flow', () => {
    cy.url().should('include', '/client')
    openFirstDocumentWithArticles()
    cy.url().should('match', /\/client\/[^/]+$/)
    cy.intercept('DELETE', '**/v2/api/client/user/*/bookmark/*').as('removeBookmark')

    cy.get('[data-testid="article-expand"]').first().should('be.visible').scrollIntoView()
    // Only add bookmark when article is not already bookmarked (new user has no bookmarks)
    cy.get('[data-testid="article-bookmark"]').first().should('have.attr', 'aria-label', 'Add bookmark').click()
    cy.get('[data-testid="article-bookmark"]').first().should('have.attr', 'aria-label', 'Remove bookmark')
    cy.get('[data-testid="article-bookmark"]').first().click()
    cy.wait('@removeBookmark')
    cy.get('[data-testid="article-bookmark"]').first({ timeout: 10000 }).should('have.attr', 'aria-label', 'Add bookmark')

    cy.get('[data-testid="article-expand"]').first().click()
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
    cy.get('[aria-label="Add note"]').first().click()
    cy.get('input[aria-label="Note title"]').type('Browse library E2E note')
    cy.get('.ProseMirror').first().type(' Note body content.')
    cy.contains('button', 'Save').click()
    cy.get('[role="dialog"]').within(() => cy.contains('Browse library E2E note').should('be.visible'))
    cy.get('[aria-label="Edit note"]').first().click()
    cy.get('input[aria-label="Note title"]').clear().type('Browse library E2E note edited')
    cy.contains('button', 'Save').click()
    cy.get('[role="dialog"]').within(() => cy.contains('Browse library E2E note edited').should('be.visible'))
    cy.get('[aria-label="Delete"]').first().click()
    cy.contains('button', 'Delete').click()
    cy.get('[aria-label="Close"]').first().click()

    // Add bookmark again (article was unbookmarked above; ensure we only click when Add bookmark)
    cy.get('[data-testid="article-bookmark"]').first().should('have.attr', 'aria-label', 'Add bookmark').click()
    cy.get('[data-testid="article-bookmark"]').first().should('have.attr', 'aria-label', 'Remove bookmark')
    cy.get('[data-testid="article-expand"]').first().click()
    cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
    cy.get('[aria-label="Add note"]').first().click()
    cy.get('input[aria-label="Note title"]').type('Second note from library')
    cy.get('.ProseMirror').first().type(' Body.')
    cy.contains('button', 'Save').click()
    cy.get('[aria-label="Close"]').first().click()

    cy.visit(`/${localeEn}/client/bookmarks`)
    cy.url().should('include', '/client/bookmarks')
    cy.contains('§').should('be.visible')
    cy.get('a[href*="/client/bookmarks/"]').first().click()
    cy.url().should('match', /\/client\/bookmarks\/[^/]+/)
    cy.get('[data-testid="article-bookmark"]').first().should('have.attr', 'aria-label', 'Remove bookmark').click()
    cy.wait('@removeBookmark')
    cy.get('[data-testid="article-bookmark"]').first({ timeout: 10000 }).should('have.attr', 'aria-label', 'Add bookmark')
    cy.visit(`/${localeEn}/client/bookmarks`)
    cy.url().should('include', '/client/bookmarks')
  })
})
