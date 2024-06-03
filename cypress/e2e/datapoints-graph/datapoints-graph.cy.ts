describe('datapoints-graph', () => {
  beforeEach(() => {
    cy.interceptLoginOptions();
    cy.interceptCurrentTenant();
    cy.interceptCurrentUser();

    cy.intercept(
      '/inventory/managedObjects?fragmentType=c8y_Dashboard!name!home-cockpit1&pageSize=1',
      { fixture: 'widgets/datapoints-graph/cockpit-dashboard.json' }
    ).as('cockpitDashboardConfig');

    // TODO: make it configurable
    cy.visit(
      '/apps/cockpit-1019.24.2/index.html?remotes=%7B"sag-pkg-community-plugins"%3A%5B"ExampleWidgetPluginModule"%2C"DatapointsGraphWidgetModule"%5D%7D#/'
    );
    // cy.visit('/apps/sag-pkg-community-plugins/#/');
    cy.wait('@cockpitDashboardConfig');
  });

  it('view component should be present', () => {
    cy.get('c8y-datapoints-graph-widget-view').should('exist');
    cy.get('c8y-charts').should('exist');
  });

  it('config component should be present', () => {
    cy.get('c8y-dashboard-child .header-actions a[title="Settings"]').click();
    cy.get('bs-dropdown-container button[title="Edit widget"]').click();
    cy.get('c8y-datapoints-graph-widget-config button.c8y-realtime')
      .find('.c8y-pulse.active')
      .should('exist');
  });
});
