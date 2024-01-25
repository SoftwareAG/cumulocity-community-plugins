export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      interceptCurrentUser(customRoles?: string[]): Chainable<void>;
      interceptCurrentTenant(): Chainable<void>;
      interceptLoginOptions(): Chainable<void>;
      interceptAppManifest(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('interceptCurrentUser', (customRoles?: string[]) => {
  const defaultRoles = [
    'ROLE_TENANT_ADMIN',
    'ROLE_TENANT_MANAGEMENT_ADMIN',
    'ROLE_TENANT_MANAGEMENT_READ',
    'ROLE_ALARM_ADMIN',
    'ROLE_ALARM_READ',
    'ROLE_AUDIT_ADMIN',
    'ROLE_AUDIT_READ',
    'ROLE_DEVICE_CONTROL_ADMIN',
    'ROLE_DEVICE_CONTROL_READ',
    'ROLE_EVENT_ADMIN',
    'ROLE_EVENT_READ',
    'ROLE_IDENTITY_ADMIN',
    'ROLE_IDENTITY_READ',
    'ROLE_INVENTORY_ADMIN',
    'ROLE_INVENTORY_READ',
    'ROLE_INVENTORY_CREATE',
    'ROLE_MEASUREMENT_ADMIN',
    'ROLE_MEASUREMENT_READ',
    'ROLE_APPLICATION_MANAGEMENT_ADMIN',
    'ROLE_APPLICATION_MANAGEMENT_READ',
    'ROLE_OPTION_MANAGEMENT_ADMIN',
    'ROLE_OPTION_MANAGEMENT_READ',
  ];
  const roles = customRoles || defaultRoles;
  const roleReferences = roles.map((roleId) => ({
    role: { name: roleId, id: roleId },
  }));
  const user = {
    roles: {
      references: roleReferences,
    },
    passwordStrength: 'GREEN',
    displayName: 'Max',
    enabled: true,
    devicePermissions: {},
    supportUserEnabled: false,
    id: 'Max',
    email: 'max@example.com',
    shouldResetPassword: false,
    userName: 'Max',
    customProperties: { userOrigin: 'BASIC' },
    phone: '',
    applications: [],
  };
  cy.intercept('/user/currentUser', (req) => {
    req.reply(user);
  }).as('currentUser');
});

Cypress.Commands.add('interceptCurrentTenant', () => {
  cy.intercept('/tenant/currentTenant', (req) => {
    req.reply({
      allowCreateTenants: true,
      customProperties: { gainsightEnabled: false },
      domainName: 'test.example.com',
      name: 'test',
      applications: {
        references: [],
      },
    });
  }).as('currentTenant');
});

Cypress.Commands.add('interceptLoginOptions', () => {
  cy.intercept('/tenant/loginOptions', (req) => {
    req.reply({
      loginOptions: [],
    });
  }).as('loginOptions');
});

Cypress.Commands.add('interceptAppManifest', () => {
  cy.intercept(
    '/application/applications/sag-pkg-community-plugins/manifest',
    (req) => {
      req.reply((res) => {
        res.send(404);
      });
    }
  ).as('appManifest');
});
