describe('datapoints-graph', { tags: '@1020' }, () => {
  beforeEach(() => {
    cy.intercept(
      '/inventory/managedObjects?fragmentType=c8y_Dashboard!name!home-cockpit1&pageSize=1',
      { fixture: 'widgets/datapoints-graph/cockpit-dashboard.json' }
    ).as('cockpitDashboardConfig');
    cy.useAuth('admin').login();
    // TODO: make it configurable OR make sure folder is called 'cockpit'
    cy.visit(
      '/apps/cockpit/index.html?remotes=%7B"sag-pkg-community-plugins"%3A%5B"ExampleWidgetPluginModule"%2C"DatapointsGraphWidgetModule"%5D%7D#/'
    );
    // cy.visit('/apps/sag-pkg-community-plugins/#/');
    cy.wait('@cockpitDashboardConfig', { timeout: 10_000 });
  });

  it('view component should be present', () => {
    cy.get('c8y-datapoints-graph-widget-view').should('exist');
    cy.get('c8y-charts').should('exist');
  });

  it('config component should be present', () => {
    cy.get('[data-cy="c8y-widget-dashboard--edit-widgets"]')
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
});
