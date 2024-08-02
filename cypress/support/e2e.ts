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

import '@cypress/grep';
import registerCypressGrep from '@cypress/grep/src/support';
import {
  c8yctrl,
  fetchInfo,
  isRecording,
  isShellRequired,
  resetC8yCtrl,
} from './utils';

registerCypressGrep();

before(() => {
  Cypress.session.clearAllSavedSessions();
  if (isShellRequired()) {
    const auth = {
      user: Cypress.env('admin_username') || 'ccw',
      password: Cypress.env('admin_password'),
    };
    cy.getTenantId(auth);
    if (isRecording()) {
      cy.login(auth);
      cy.getSystemVersion();
    } else {
      if (Cypress.env('C8Y_SYSTEM_VERSION') == null) {
        cy.wrap(fetchInfo('cockpit'), { log: false }).then((info: any) => {
          const version: any = info?.version;
          if (version) {
            Cypress.env('C8Y_SYSTEM_VERSION', version);
            cy.log(`C8Y_SYSTEM_VERSION: ${version}`);
          }
        });
      }
    }
    // make sure rest requests in the before() hook are recorded
    Cypress.c8ypact.on.suiteStart = (titlePath) => c8yctrl(titlePath);
  }

  cy.then(() => {
    if (Cypress.env('C8Y_SYSTEM_VERSION') == null) {
      Cypress.env('C8Y_SYSTEM_VERSION', '1020');
      cy.log(`C8Y_SYSTEM_VERSION: 1020 (default)`);
    }
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
