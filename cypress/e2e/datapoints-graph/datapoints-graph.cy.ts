import { isShellRequired } from '../../support/utils';

describe(
  'datapoints graph',
  {
    requires: ['1020', '1018'],
    tags: ['@noShell', '@shell'],
  },
  () => {
    beforeEach(function () {
      if (isShellRequired()) {
        cy.login({
          user: Cypress.env('admin_username') || 'ccw',
          password: Cypress.env('admin_password'),
        });
        cy.setLanguage('en');
        cy.prepareGroupWithDashboard();
      } else {
        cy.interceptLoginOptions();
        cy.interceptCurrentTenant();
        cy.interceptCurrentUser();
        cy.interceptAppManifest();

        cy.intercept(
          '/inventory/managedObjects?fragmentType=c8y_Dashboard!name!home-cockpit1&pageSize=1',
          { fixture: 'widgets/datapoints-graph/cockpit-dashboard.json' }
        ).as('cockpitDashboardConfig');

        cy.setLanguage('en');
        cy.visit('/apps/sag-pkg-community-plugins/#/');
        cy.wait('@cockpitDashboardConfig');
      }
    });

    it('view component should be present', () => {
      cy.get('c8y-datapoints-graph-widget-view', { timeout: 10000 }).should(
        'exist'
      );
      cy.get('c8y-charts').should('exist');
    });

    it(
      'config component should be present v1020',
      // `requires` can be any semver range including .x, .* or caret and tilde ranges.
      // This is just an example for specifying 1020 version requirement to highlight use of semver.
      // `requires` array elements are used to match cypress env argument C8Y_SYSTEM_VERSION
      // e.g. running command `cypress run --env C8Y_CTRL_MODE=mocking,C8Y_SYSTEM_VERSION=1020.0.5` will check if 1020.0.5 is matching with 1020.x.x,
      // and test will be executed if it is.
      // null element is for case when C8Y_SYSTEM_VERSION is not provided (in our case for tests without Cockpit shell)
      { requires: ['1020.x.x'] },
      () => {
        cy.get('[data-cy="c8y-widget-dashboard--edit-widgets"]', {
          timeout: 10000,
        })
          .should('be.visible')
          .click();
        cy.get(
          'c8y-dashboard-child .header-actions button[data-cy="c8y-dashboard-child--settings"]'
        ).click({ force: true });
        cy.get(
          '.dropdown-menu button[data-cy="widgets-dashboard--Edit-widget"]'
        ).click({ force: true });
        cy.get('c8y-datapoints-graph-widget-config button.c8y-realtime')
          .find('.c8y-pulse.active')
          .should('exist');
      }
    );

    it(
      'config component should be present v1018',
      // more complex semver range to define 1018 version as required
      {
        requires: ['>=1018.0.0 <1020.0.0'],
        tags: ['@shell'],
      },
      () => {
        cy.get('c8y-dashboard-child .header-actions button[title="Settings"]', {
          timeout: 10000,
        })
          .should('exist')
          .click();
        cy.get('.dropdown-menu button[title="Edit widget"]').click();
        cy.get('c8y-datapoints-graph-widget-config button.c8y-realtime')
          .find('.c8y-pulse.active')
          .should('exist');
      }
    );
  }
);
