describe('example-widget', { tags: ['@noShell'] }, () => {
  beforeEach(() => {
    cy.interceptLoginOptions();
    cy.interceptCurrentTenant();
    cy.interceptCurrentUser();
    cy.interceptAppManifest();

    cy.intercept(
      '/inventory/managedObjects?fragmentType=c8y_Dashboard!name!home-cockpit1&pageSize=1',
      {
        fixture: 'widgets/example-widget/cockpit-dashboard.json',
      }
    ).as('cockpitDashboardConfig');

    cy.visit('/apps/sag-pkg-community-plugins/#/');
    cy.wait('@cockpitDashboardConfig');
  });

  it('view component should be present', () => {
    cy.get('c8y-community-example-widget-plugin-view').should('exist');
    cy.get('c8y-community-example-widget-plugin-view p.text').contains('abc');
  });

  it('config component should be present', () => {
    cy.get('[data-cy="c8y-widget-dashboard--edit-widgets"]')
      .should('be.visible')
      .click({ force: true });
    cy.get(
      'c8y-dashboard-child .header-actions button[data-cy="c8y-dashboard-child--settings"]'
    ).click({ force: true });
    cy.get(
      '.dropdown-menu button[data-cy="widgets-dashboard--Edit-widget"]'
    ).click({ force: true });
    cy.get('c8y-community-example-widget-plugin-config textarea').then(
      ($textarea) => {
        expect($textarea.val()).to.contain('abc');
      }
    );
  });
});
