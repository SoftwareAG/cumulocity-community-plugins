import { isRecording, isShellRequired } from '../../support/utils';

describe(
  'datapoints graph',
  {
    requires: { shell: ['1020', '1018', null] },
    tags: ['@noShell', '@shell'],
  },
  () => {
    beforeEach(function () {
      if (isShellRequired()) {
        if (isRecording()) {
          cy.getAuth('admin').login();
        }
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
      /**
       * `requires` can hold any array of semver ranges, including .x, .* or caret and tilde ranges.
       * This is just an example for specifying 1020 version requirement to highlight use of semver.
       * `requires` array elements are used to match cypress env variable C8Y_SHELL_VERSION for shell or
       * C8Y_SYSTEM_VERSION for system versions. Init shell and system version using cy.getShellVersion()
       * and cy.getSystemVersion() for example in e2e.ts, or by passing the env variables to the cypress command.
       *
       * Example:
       * `cypress run --env C8Y_CTRL_MODE=mocking,C8Y_SYSTEM_VERSION=1020.0.5,C8Y_SHELL_VERSION=1020.1.203`4
       *
       * Config can be for example:
       * ```ts
       * {
       *   requires: {
       *     shell: ['>=1018.0.0 <1020.0.0'],
       *     system: ['>=1018.0.0 <1020.0.0'],
       *   },
       * },
       *
       * Provide `null` element the test will also run if system or shell version or undefined.
       */
      {
        requires: { shell: ['1020.x.x', null] },
      },
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
        requires: {
          shell: ['>=1018.0.0 <1020.0.0'],
        },
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
