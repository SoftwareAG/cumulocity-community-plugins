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

import 'cumulocity-cypress/commands';
import 'cumulocity-cypress/commands/c8ypact';

import { pactId } from 'cumulocity-cypress';

before(() => {
  Cypress.session.clearAllSavedSessions();

  if (Cypress.env('C8Y_CTRL_MODE') != null) {
    const auth = {
      user: Cypress.env('admin_username') || 'ccw',
      password: Cypress.env('admin_password'),
    };
    cy.getTenantId(auth);
    if (Cypress.env('C8Y_CTRL_MODE') === 'recording') {
      cy.login(auth);
      cy.getSystemVersion();
    }
    // intercept all suite before() hooks to call c8yctrl and make sure rest
    // requests in the before() hook are recorded
    Cypress.c8ypact.on.suiteStart = (titlePath) => c8yctrl(titlePath);
  }
});

beforeEach(function () {
  if (
    Cypress.env('C8Y_CTRL_MODE') != null &&
    Cypress.config().requires != null
  ) {
    cy.wrap(c8yctrl(), { log: false }).then((response: Response) => {
      if (Cypress.env('C8Y_CTRL_MODE') !== 'recording' && !response.ok) {
        throw new Error(
          `Mock not found for current test. c8yctrl returned ${response.status} ${response.statusText}.`
        );
      }
    });
  }
});

afterEach(() => {
  if (Cypress.env('C8Y_CTRL_MODE') != null) {
    cy.wrap(resetC8yCtrl(), { log: false }).then(() => {});
  }
});

/**
 * Update c8yctrl pact file to be used for recording or mocking.
 * @param titleOrId An id or array of titles with names of suite or titles
 */
function c8yctrl(
  titleOrId: string | string[] = Cypress.c8ypact.getCurrentTestId()
): Promise<Response> {
  const recording = Cypress.env('C8Y_CTRL_MODE') === 'recording';
  const id = pactId(titleOrId);
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

function resetC8yCtrl() {
  return (cy.state('window') as Cypress.AUTWindow).fetch(
    `${Cypress.config().baseUrl}/c8yctrl/current`,
    {
      method: 'DELETE',
    }
  );
}
