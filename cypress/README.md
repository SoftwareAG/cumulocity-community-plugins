# Cypress

## Simple plugin testing

You can use `npm run cypress:ci:plugins` to execute cypress tests against a previously built version (`npm run build`) of this package located in the `dist` folder.
This test run will test plugins without shell app. It is not fully integration tests, therefore it does not need recording of backend requests.
Test cases that will be executed with this approach are the ones that are marked with tag `@noShell` and will execute tests for default version of `ngx-components` of 1020.
All requests are intercepted with Cypress and data is mocked within test suite.

## Testing plugins against Cockpit as shell

You can also run test in the context of shell app, which is Cockpit in our case.
These tests are using recorded backend requests stored as json files in `cypress/rec` folder. Once recording is created,
it can be used for testing plugins against shell without making actual API calls.

Test cases are filtered by tag `@shell` and by version of shell using `config.requires.shell` property.
For shell tests, it is string representing semver constraint.
Shell version is automatically read from `dist/apps/cockpit/cumulocity.json`, but can be also provided with command `C8Y_SHELL_VERSION` env variable.
For example, if our shell version is `C8Y_SHELL_VERSION=1018.0.270`
and test case has `config.requires` of value `['>=1018.0.0 <1020.0.0', null]`, it will test 1018.0.270 against semver constraints
in array and run test case if particular version of shell is matching one of the constraints.

### Running tests and creating recordings

To create recordings of API calls for further use, recording test run has to be executed.

1. Build plugins with `npm run build` and put build file to `dist/apps/sag-pkg-community-plugins`
2. Get Cockpit app (for our example it will be 1018.0.271), put it in `dist/apps/cockpit`
3. Create `cypress.env.json` file in root folder with credentials

```json
{
  "admin_username": "username",
  "admin_password": "password"
}
```

4. Run command `npm run cypress:headless:shell:recording`. It will host both Cockpit and plugins locally (c8yctrl will also take care for authorisation), run cypress tests for specific shell version and create API requests recordings.
5. After successful run, recordings of API requests will be saved in `cypress/rec`

### Running tests using recordings

1. Repeat steps 1-2 from `Running tests and creating recordings`. File with credentials is not needed for these tests.
2. Run `npm run cypress:headless:shell:mocking` to run tests using previously created recordings from `cypress/rec`

You can also add `C8Y_SHELL_VERSION` variable to override shell version from `dist/apps/cockpit` and test this Cockpit against test suite meant for different shell.
This can be useful if e.g. you have tests for shell of version 1020 and want to run these tests against new version of Cockpit, e.g. 1021.
To do it, run `npm run start-test --expect 404 cypress:ctrl :4200/c8yctrl/current 'cypress run --env C8Y_CTRL_MODE=mocking,C8Y_SHELL_VERSION=1021.0.0,grepTags=@shell'`.
Additionally, backend system version can be overriden with `C8Y_SYSTEM_VERSION` environment variable (which be later matched with `config.requires.system` of test suite).

## Repository setup for testing against shell

There are few steps that needs to be done to set up your repository to make testing against shell available, just like in this repository.
Steps below assumes that basic Cypress setup is done and won't be covered.

### Add necessary packages to your project as devDependencies:

- [cumulocity-cypress](https://www.npmjs.com/package/cumulocity-cypress)
- [cumulocity-cypress-ctrl](https://www.npmjs.com/package/cumulocity-cypress-ctrl)

Additional packages that might be useful:

- morgan (used for logging purposes)
- @types/morgan

### Add `c8yctrl.config.ts` file

`c8yctrl.config.ts` is configuration file for `cumulocity-cypress-ctrl`. By default, `c8yctrl` will be looking for in root folder, so we put it
there (but it can be also placed anywhere in repository, but path to config file should be then configured according to package docs).
It's main element is callback that will return config for `cumulocity-cypress-ctrl`.
This package is responsible for hosting plugin and shell from dist folder, running cypress tests,
creating recordings of backend requests and using these recordings in mocking (offline) mode later.

Config itself in our case consists of:

- logging config (properties `logLevel`, `logger`, `requestLogger`).
- `preprocessor` object that is responsible for obfuscating credentials (and any other requests properties declared)
- `onMockRequest` is called before a request is mocked. Use to modify or return custom response as mock.
- `onProxyRequest` is called before a request is proxied. Use to modify the request before it is proxied, e.g. to add or remove headers, etc. or to abort the request by returning a custom or error response to send back to the client.
- `onProxyResponse` is called after receiving the response for a proxied request. By returning false, the request and response are ignored and not processed and saved. Use to filter requests and responses from recording.
  For more details about the config, see [cumulocity-cypress-ctrl](https://www.npmjs.com/package/cumulocity-cypress-ctrl) package website
  and it's public repository.

### Load Cypress plugin from `cumulocity-cypress` package

Cypress plugin from `cumulocity-cypress` is required for recording and mocking of requests and responses.
Load it in your `cypress.config.ts` file with `configureC8yPlugin`.
In our case we also make sure that base url is applied to config.

[//]: # (TODO: do we need "on('task'.... " ?)

```typescript
import { defineConfig } from 'cypress';
import { configureC8yPlugin } from 'cumulocity-cypress/plugin';

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      const baseUrl = config.env['baseUrl'] || config.env['C8Y_BASEURL'] || null;
      if (!config.baseUrl && baseUrl) {
        config.baseUrl = baseUrl;
      }

      configureC8yPlugin(on, config);
      // important to return the config object
      return config;
    },
  },
});
```

### Cypress tests run modification

In `e2e.ts` file, we declare steps that are shared between all test suites. Our case supports testing plugins
against shell (using recordings of backend requests) and no-shell tests that requires no shell (where all requests are intercepted by Cypress
commands and mocked with data declared in test suites).

#### Before all tests

In `before(...)` callback, we check if shell is required for tests (in our case we support both shell tests and no-shell). If we do,
we handle the authentication (with `useAuth`, `getTenantId` and `login` methods) and then gather information of system and shell versions.

#### Before each test case

Before each test case we run `cy.wrap(c8yctrl(), ....);` from `cumulocity-cypress-control` package to create requests recordings
or to use existing recording to mock requests. `c8yctrl` method from utils is using REST interface to configure the HTTP controller at runtime.
There is also an error handling in case mock is not found.

#### After each test case

Similar to before each callback, `afterEach` also uses REST interface to control HTTP controller to stop the process.

### Test suite

Both test suite `describe` and test cases `it` blocks in `cypress/e2e/datapoints-graph/datapoints-graph.cy.ts` have config with `requires` property declared.
It is an object that can contain two properties:

- shell: to declare shell versions
- system: to declare system (backend) versions

Both properties can hold any array of semver ranges, including `.x`, `.*` or caret and tilde ranges.
Provide `null` element the test will also run if system or shell version or undefined.
`requires` array elements are used to match cypress env variable `C8Y_SHELL_VERSION` for shell or `C8Y_SYSTEM_VERSION` for system versions.
In our case there is also `tags` property- it is necessary to support both shell and no-shell tests approaches.
If `requires` property is not declared for test case (`it` block), it will always be executed (as long as `describe` block config matches current run environment).

### Running tests

See [Testing plugins against Cockpit as shell](#testing-plugins-against-cockpit-as-shell) section for details about running tests against shell.

### Usage in workflow

See `.github/workflows/test-plugins-against-cockpit.yml` file to see how testing plugins against shell can be automated.
