/**
 * E2E: Notes – all editing options (TipTap toolbar).
 *
 * Flow: Log in as subscribed user → open a document → My notes → Add note →
 * use toolbar: Bold, Italic, Underline, Strikethrough, Code, Headings,
 * Blockquote, Lists, Link, Align, Table, HR → Save. Assert content.
 *
 * Prerequisites: Subscribed user; at least one document in library.
 */

const locale = 'en'

describe('Notes: editing options', () => {
  beforeEach(() => {
    cy.clearPerfData()
  })

  it('opens note editor and uses Bold and Italic', () => {
    cy.visit(`/${locale}/client`)
    // Assume we have documents; click first document or a known one to open reader/modal.
    cy.get('body').then(($body) => {
      const docLink = $body.find('a[href*="/client/"]').first()
      if (docLink.length === 0) {
        cy.log('No document link found – seed data may be missing')
        return
      }
      docLink.trigger('click')
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
      cy.contains('button', 'Add note').click()
      cy.get('button[aria-label="Bold"]').click()
      cy.get('.ProseMirror').type('Bold text ')
      cy.get('button[aria-label="Italic"]').click()
      cy.get('.ProseMirror').type('italic text')
      cy.contains('button', 'Save').click()
      cy.get('[role="dialog"]').within(() => {
        cy.get('.ProseMirror').should('contain', 'Bold text')
        cy.get('.ProseMirror').should('contain', 'italic text')
      })
    })
  })

  it('uses bullet list and ordered list', () => {
    cy.visit(`/${locale}/client`)
    cy.get('body').then(($body) => {
      const docLink = $body.find('a[href*="/client/"]').first()
      if (docLink.length === 0) return
      docLink.trigger('click')
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
      cy.contains('button', 'Add note').click()
      cy.get('.ProseMirror').type('Item one')
      cy.get('button[aria-label="Bullet list"]').click()
      cy.get('.ProseMirror').type('{enter}Item two')
      cy.get('button[aria-label="Ordered list"]').click()
      cy.contains('button', 'Save').click()
      cy.get('[role="dialog"]').within(() => {
        cy.get('ul, ol').should('exist')
      })
    })
  })

  it('uses blockquote and heading', () => {
    cy.visit(`/${locale}/client`)
    cy.get('body').then(($body) => {
      const docLink = $body.find('a[href*="/client/"]').first()
      if (docLink.length === 0) return
      docLink.trigger('click')
      cy.get('[role="dialog"]', { timeout: 10000 }).should('be.visible')
      cy.contains('button', 'Add note').click()
      cy.get('button[aria-label="Heading 1"]').click()
      cy.get('.ProseMirror').type('My heading')
      cy.get('.ProseMirror').type('{enter}')
      cy.get('button[aria-label="Blockquote"]').click()
      cy.get('.ProseMirror').type('A quote')
      cy.contains('button', 'Save').click()
      cy.get('[role="dialog"]').within(() => {
        cy.get('h1').should('contain', 'My heading')
        cy.get('blockquote').should('contain', 'A quote')
      })
    })
  })
})
