describe(
  'datapoints-graph-1020',
  { tags: '@1020', c8ypact: { id: 'datapoints-graph' } },
  () => {
    beforeEach(() => {
      cy.login({
        user: Cypress.env('admin_username') || 'ccw',
        password: Cypress.env('admin_password'),
      });

      cy.prepareGroupWithDashboard();
    });

    it('view component should be present', () => {
      cy.get('c8y-datapoints-graph-widget-view', { timeout: 10000 }).should(
        'exist'
      );
      cy.get('c8y-charts').should('exist');
    });

    it('config component should be present', () => {
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
    });
  }
);
