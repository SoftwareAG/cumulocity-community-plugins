describe('example-widget', () => {
  beforeEach(() => {
    cy.interceptLoginOptions();
    cy.interceptCurrentTenant();
    cy.interceptCurrentUser();
    cy.interceptAppManifest();

    cy.intercept(
      '/inventory/managedObjects?fragmentType=c8y_Dashboard!name!home-cockpit1&pageSize=1',
      { fixture: 'widgets/example-widget/cockpit-dashboard.json' }
    ).as('cockpitDashboardConfig');

    cy.visit('/apps/sag-pkg-community-plugins/#/');
    cy.wait('@cockpitDashboardConfig');
  });

  it('view component should be present', () => {
    cy.get('c8y-community-example-widget-plugin-view').should('exist');
    cy.get('c8y-community-example-widget-plugin-view p.text').contains('abc');
  });

  it('config component should be present', () => {
    cy.get(
      'c8y-dashboard-child .header-actions button[data-cy="c8y-dashboard-child--settings"]'
    ).click();
    cy.get(
      '.dropdown-menu button[data-cy="c8y-widgets-dashboard--edit-dashboard"]'
    ).click();
    cy.get('c8y-community-example-widget-plugin-config textarea').then(
      ($textarea) => {
        expect($textarea.val()).to.contain('abc');
      }
    );
  });
});
