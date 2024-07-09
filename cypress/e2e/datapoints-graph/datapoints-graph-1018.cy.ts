describe('datapoints-graph-1018', { tags: '@1018' }, () => {
  beforeEach(() => {
    cy.login2(
      // TODO: username should not be here, but without it, tests that are using mocks fails
      Cypress.env('admin_username') || 'ccw',
      Cypress.env('admin_password')
    );

    cy.prepareGroupWithDashboard();
  });

  it('view component should be present', () => {
    cy.get('c8y-datapoints-graph-widget-view', { timeout: 10000 }).should(
      'exist'
    );
    cy.get('c8y-charts').should('exist');
  });

  it('config component should be present', () => {
    cy.get('c8y-dashboard-child .header-actions button[title="Settings"]', {
      timeout: 10000,
    })
      .should('exist')
      .click();
    cy.get('.dropdown-menu button[title="Edit widget"]').click();
    cy.get('c8y-datapoints-graph-widget-config button.c8y-realtime')
      .find('.c8y-pulse.active')
      .should('exist');
  });
});
