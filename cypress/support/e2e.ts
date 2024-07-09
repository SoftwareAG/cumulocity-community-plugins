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

import 'cumulocity-cypress/lib/commands';

import registerCypressGrep from '@cypress/grep/src/support';

import { C8yPactID } from 'cumulocity-cypress-ctrl';
const { _ } = Cypress;

registerCypressGrep();

before(() => {
  Cypress.session.clearAllSavedSessions();

  if (Cypress.env('C8Y_CTRL_MODE') != null) {
    cy.wrap(c8yctrl('global before hook'), { log: false }).then(() => {
      // do your requests to record in here
      // ...
    });
    const runner = Cypress.mocha.getRunner();
    runner.on('suite', (suite) => c8yctrl(getSuiteTitles(suite)));
  }
});

beforeEach(() => {
  if (Cypress.env('C8Y_CTRL_MODE') != null) {
    cy.wrap(c8yctrl(), { log: false });
  }
});

function getSuiteTitles(suite) {
  if (suite.parent && !_.isEmpty(suite.parent.title)) {
    return [...getSuiteTitles(suite.parent), suite.title];
  }
  return [suite.title];
}

function c8yctrl(title: string | string[] = Cypress.currentTest.titlePath) {
  const recording = Cypress.env('C8Y_CTRL_MODE') === 'recording';
  const parameter: string = recording
    ? '?recording=true&clear'
    : '?recording=false';

  return (cy.state('window') as Cypress.AUTWindow).fetch(
    `${Cypress.config().baseUrl}/c8yctrl/current${parameter}&id=${pactId(
      title
    )}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{}',
    }
  );
}

// todo: import pactId() from cumulocity-cypress when it's implemented in library
function pactId(value: string | string[]): C8yPactID {
  let result = '';
  const suiteSeparator = '__';

  const normalize = (toNormalize: string): string =>
    toNormalize
      .split(suiteSeparator)
      .map((v) => _.words(_.deburr(v), /[a-zA-Z0-9]+/g).join('_'))
      .join(suiteSeparator);

  if (value && _.isArray(value)) {
    result = value.map((v) => normalize(v)).join(suiteSeparator);
  } else if (value && _.isString(value)) {
    result = normalize(value as string);
  }
  if (!result || _.isEmpty(result)) {
    return !value ? (value as C8yPactID) : (undefined as any);
  }
  return result;
}
