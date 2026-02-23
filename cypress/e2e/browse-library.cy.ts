/**
 * E2E: Browse library only – documents, catalogues, articles, notes, bookmarks.
 *
 * Run independently: npx cypress run --spec "cypress/e2e/browse-library.cy.ts"
 *
 * Prerequisites: Set CYPRESS_TEST_USER_EMAIL and CYPRESS_TEST_PASSWORD (or testPassword in cypress.env.json)
 * for an existing user with access to the library. The spec logs in first, then tests only browse features.
 */

const locale = Cypress.env('locale') ?? 'en'

describe('Browse library only', () => {
  beforeEach(() => {
    cy.clearPerfData()
    const email = Cypress.env('testUserEmail')
    const password = Cypress.env('testPassword') ?? 'TestPass1'
    if (!email || !password) {
      throw new Error('Set CYPRESS_TEST_USER_EMAIL and CYPRESS_TEST_PASSWORD to run browse-library spec')
    }
    cy.login(email, password)
  })

  it('shows library home (documents)', () => {
    cy.visit(`/${locale}/client`)
    cy.url().should('include', '/client')
  })

  it('can open catalogues', () => {
    cy.visit(`/${locale}/client/catalogues`)
    cy.url().should('include', '/client/catalogues')
  })

  it('can open notes list', () => {
    cy.visit(`/${locale}/client/notes`)
    cy.url().should('include', '/client/notes')
  })

  it('can open bookmarks list', () => {
    cy.visit(`/${locale}/client/bookmarks`)
    cy.url().should('include', '/client/bookmarks')
  })
})
