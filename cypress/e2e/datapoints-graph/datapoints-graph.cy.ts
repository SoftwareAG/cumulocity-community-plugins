describe('datapoints-graph', () => {
  beforeEach(() => {
    cy.interceptLoginOptions();
    cy.interceptCurrentTenant();
    cy.interceptCurrentUser();

    cy.intercept(
      '/inventory/managedObjects?fragmentType=c8y_Dashboard!name!home-cockpit1&pageSize=1',
      { fixture: 'widgets/datapoints-graph/cockpit-dashboard.json' }
    ).as('cockpitDashboardConfig');

    cy.visit('/apps/sag-pkg-community-widgets/#/');
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
