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
import 'cumulocity-cypress/commands/request';

import '@cypress/grep';
import registerCypressGrep from '@cypress/grep/src/support';
import { c8yctrl, isRecording, isShellRequired, resetC8yCtrl } from './utils';

registerCypressGrep();

before(() => {
  Cypress.session.clearAllSavedSessions();
  if (isShellRequired()) {
    cy.useAuth('admin');
    cy.getTenantId().then(() => {
      if (isRecording()) {
        cy.login();
        // t1234567 is the default tenant id returned by c8yctrl. if needed change value in c8yctrl.config.ts.
        expect(
          Cypress.env('C8Y_TENANT'),
          'Tenant id is mocked in recording mode. Restart c8yctrl in recording mode and rerun tests'
        ).not.to.equal('t1234567');
        cy.getSystemVersion();
      }
      cy.getShellVersion();
    });

    expect(Cypress.env('C8Y_SHELL_VERSION')).to.not.be.null;

    // make sure rest requests in the before() hook are recorded
    Cypress.c8ypact.on.suiteStart = (titlePath) => c8yctrl(titlePath);
  }

  cy.then(() => {
    // log in workflow to see version being used
    cy.task(
      'log',
      `C8Y_SHELL_VERSION: ${Cypress.env('C8Y_SHELL_VERSION')}, C8Y_SYSTEM_VERSION: ${Cypress.env('C8Y_SYSTEM_VERSION')}`
    );
  });
});

beforeEach(function () {
  if (isShellRequired()) {
    cy.wrap(c8yctrl(), { log: false }).then((c8yctrlResponse: Response) => {
      if (!isRecording() && !c8yctrlResponse.ok) {
        throw new Error(
          `Mock not found for current test. c8yctrl returned ${c8yctrlResponse.status} ${c8yctrlResponse.statusText}.`
        );
      }
    });
  }
});

afterEach(() => {
  if (isShellRequired()) {
    cy.wrap(resetC8yCtrl(), { log: false }).then(() => {});
  }
});
