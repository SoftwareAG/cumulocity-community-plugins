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
const { _ } = Cypress;

let systemVersion: string;

declare global {
  interface C8yCtrlConfigOptions {
    id?: string;
    versions?: string[];
  }

  namespace Cypress {
    interface SuiteConfigOverrides {
      c8yctrl: C8yCtrlConfigOptions;
    }

    interface TestConfigOverrides {
      c8yctrl: C8yCtrlConfigOptions;
    }

    interface RuntimeConfigOptions {
      c8yctrl: C8yCtrlConfigOptions;
    }
  }
}

before(() => {
  Cypress.session.clearAllSavedSessions();

  if (Cypress.env('C8Y_CTRL_MODE') != null) {
    cy.wrap(resetC8yCtrl(), { log: false }).then(() => {
      cy.wrap(c8yctrl('skip recording'), { log: false }).then(() => {
        const auth = {
          user: Cypress.env('admin_username') || 'ccw',
          password: Cypress.env('admin_password'),
        };

        cy.getTenantId(auth);
        if (Cypress.c8ypact.isRecordingEnabled()) {
          cy.login(auth);
          cy.getSystemVersion().then((version) => {
            systemVersion = _.first(version.split('.'));
          });
        }
      });
    });

    // intercept all suite before() hooks to call c8yctrl and make sure rest
    // requests in the before() hook are recorded
    Cypress.c8ypact.on.suiteStart = (titlePath) => c8yctrl(titlePath);
  }
});

// Required configurations for github workflows
// env: C8Y_CTRL_MODE=mocking,C8Y_CTRL_PROVIDER_VERSION=${{ env.VERSION }}
// env: grepUntagged=true

// Required configurations for local testing
// env:
beforeEach(function () {
  const testCaseVersions = Cypress.config().c8yctrl?.versions;
  const ctrlMode: string = Cypress.env('C8Y_CTRL_MODE');
  const isC8yctrlEnabled = ctrlMode != null;

  const testedVersion = ctrlMode != null ? getTestVersion() : undefined;
  let skipTest = false;

  if (isC8yctrlEnabled) {
    skipTest = testCaseVersions == null;
    if (testedVersion != null) {
      skipTest = testCaseVersions?.includes(`${testedVersion}`) !== true;
    } else {
      skipTest = !testCaseVersions?.includes(null);
    }
  } else {
    skipTest = testCaseVersions != null && !testCaseVersions?.includes(null);
  }

  cy.wrap(resetC8yCtrl(), { log: false }).then(() => {
    if (skipTest) {
      this.skip();
    } else if (isC8yctrlEnabled) {
      cy.wrap(c8yctrl(), { log: false }).then(() => {});
    }
  });
});

function getTestVersion() {
  let version: string | undefined;
  const recording = Cypress.env('C8Y_CTRL_MODE') === 'recording';

  if (recording === true && systemVersion != null) {
    version = systemVersion;
  } else {
    version =
      Cypress.env('C8Y_CTRL_PROVIDER_VERSION') || Cypress.env('C8Y_VERSION');
  }
  return version?.toString()?.split('.').shift();
}

/**
 * Update c8yctrl pact file to be used for recording or mocking. This is a very simple
 * implementation that will be replaced by cumulocity-cypress integration.
 * @param titleOrId An id or array of titles with names of suite or titles
 */
function c8yctrl(titleOrId: string | string[] = Cypress.currentTest.titlePath) {
  const recording = Cypress.env('C8Y_CTRL_MODE') === 'recording';

  const version = getTestVersion();
  if (version != null && _.isArray(titleOrId)) {
    titleOrId.unshift(version);
  }
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
