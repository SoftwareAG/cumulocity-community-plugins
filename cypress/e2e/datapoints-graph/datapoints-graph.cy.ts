describe(
  'datapoints-graph',
  {
    c8yctrl: { id: 'datapoints-graph', versions: ['1020', '1018', null] },
  },
  () => {
    beforeEach(function () {
      if (Cypress.env('C8Y_CTRL_MODE') != null) {
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
      'config component should be present 1020',
      { c8yctrl: { versions: ['1020', null] } },
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
      'config component should be present 1018',
      { c8yctrl: { versions: ['1018', null] } },
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
