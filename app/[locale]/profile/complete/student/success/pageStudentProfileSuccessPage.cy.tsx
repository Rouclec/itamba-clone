import React from 'react'
import StudentProfileSuccessPage from './page'

describe('<StudentProfileSuccessPage />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<StudentProfileSuccessPage />)
  })
})