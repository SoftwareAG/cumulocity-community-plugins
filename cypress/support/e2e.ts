// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

import 'cumulocity-cypress/commands';
import 'cumulocity-cypress/commands/c8ypact';

import registerCypressGrep from '@cypress/grep/src/support';

import { pactId } from 'cumulocity-cypress';
const { _ } = Cypress;

registerCypressGrep();

before(() => {
  Cypress.session.clearAllSavedSessions();

  if (Cypress.env('C8Y_CTRL_MODE') != null) {
    cy.wrap(c8yctrl('skip recording'), { log: false }).then(() => {
      cy.getAuth({
        user: Cypress.env('admin_username') || 'ccw',
        password: Cypress.env('admin_password'),
      }).getTenantId();
    });

    // intercept all suite before() hooks to call c8yctrl and make sure rest
    // requests in the before() hook are recorded
    Cypress.c8ypact.on.suiteStart = (titlePath) => c8yctrl(titlePath);
  }
});

beforeEach(() => {
  if (Cypress.env('C8Y_CTRL_MODE') != null) {
    cy.wrap(c8yctrl(), { log: false });
  }
});

/**
 * Update c8yctrl pact file to be used for recording or mocking. This is a very simple
 * implementation that will be replaced by cumulocity-cypress integration.
 * @param titleOrId An id or array of titles with names of suite or titles
 */
function c8yctrl(titleOrId: string | string[] = Cypress.currentTest.titlePath) {
  const id = pactId(titleOrId);
  const recording = Cypress.env('C8Y_CTRL_MODE') === 'recording';
  const parameter: string = recording
    ? '?recording=true&clear'
    : '?recording=false';

  return (cy.state('window') as Cypress.AUTWindow).fetch(
    `${Cypress.config().baseUrl}/c8yctrl/current${parameter}&id=${id}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{}',
    }
  );
}
