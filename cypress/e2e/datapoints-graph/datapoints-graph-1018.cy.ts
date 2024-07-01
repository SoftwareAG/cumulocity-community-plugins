describe('datapoints-graph-1018', { tags: '@1018' }, () => {
  beforeEach(() => {
    cy.login2(
      // TODO: username should not be here, but without it, tests that are using mocks fails
      Cypress.env('admin_username') || 'ccw',
      Cypress.env('admin_password')
    );

    cy.request({
      url: '/inventory/managedObjects',
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: {
        c8y_IsDeviceGroup: {},
        c8y_Notes: '',
        name: 'e2eCopyGroup',
        type: 'c8y_DeviceGroup',
      },
    }).then((groupRes) => {
      cy.request({
        url: `/inventory/managedObjects/${groupRes.body.id}/childAdditions`,
        method: 'POST',
        headers: {
          'Content-Type':
            'application/vnd.com.nsn.cumulocity.managedobject+json;',
          Accept: 'application/json',
        },
        body: {
          name: 'e2eDashboard',
          [`c8y_Dashboard!group!${groupRes.body.id}`]: {},
          c8y_Dashboard: {
            name: 'e2eDashboard',
            priority: 10000,
            icon: 'th',
            translateWidgetTitle: true,
            children: {
              '1': {
                componentId: 'datapoints-graph',
                classes: {
                  'alerts-overlay': false,
                  'card-dashboard': true,
                  'panel-title-regular': true,
                  map: true,
                  card: true,
                },
                _x: 0,
                _y: 0,
                id: '1',
                title: 'Data points graph',
                _width: 12,
                config: {
                  datapoints: [],
                  displayDateSelection: false,
                  displayAggregationSelection: false,
                  widgetInstanceGlobalTimeContext: false,
                  canDecoupleGlobalTimeContext: false,
                  dateFrom: '2023-04-27T12:00:00.000Z',
                  dateTo: '2023-04-27T12:10:00.000Z',
                  interval: 'hours',
                  aggregation: null,
                  realtime: true,
                  yAxisSplitLines: false,
                  xAxisSplitLines: false,
                },
                _height: 6,
              },
            },
            classes: { 'dashboard-theme-light': true },
            c8y_IsNavigatorNode: null,
            widgetClasses: { 'panel-title-regular': true },
          },
        },
      }).then((dashboardRes) => {
        cy.visit(
          `/apps/cockpit/index.html?remotes=%7B"sag-pkg-community-plugins"%3A%5B"ExampleWidgetPluginModule"%2C"DatapointsGraphWidgetModule"%5D%7D#/group/${groupRes.body.id}/dashboard/${dashboardRes.body.id}`
        );
      });
    });
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
