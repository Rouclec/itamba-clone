// Cypress E2E support: commands and global config
import './commands'

// Note: Request logging for the performance report is registered per-spec in the tests
// that need it (signup-phone, happy-path), not globally here. A global cy.intercept('**')
// was breaking all tests (e.g. signup form never mounting).

// Log performance when visiting pages (optional)
const perfLog: Record<string, number> = {}
Cypress.on('window:before:load', (win) => {
  const start = Date.now()
  win.addEventListener(
    'load',
    () => {
      const loadTime = Date.now() - start
      perfLog[win.location.pathname || 'unknown'] = loadTime
      if ((win as unknown as { __cypressPerf?: Record<string, number> }).__cypressPerf == null) {
        (win as unknown as { __cypressPerf: Record<string, number> }).__cypressPerf = {}
      }
      ;(win as unknown as { __cypressPerf: Record<string, number> }).__cypressPerf.loadTime = loadTime
    },
    { once: true }
  )
})
