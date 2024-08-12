# Cypress

## Simple plugin testing

You can use `npm run cypress:ci:plugins` to execute cypress tests against a previously built version (`npm run build`) of this package located in the `dist` folder.
This test run will test plugins without shell app. It is not fully integration tests, therefore it does not need recording of backend requests.
Test cases that will be executed with this approach are the ones that are marked with tag `@noShell` and will execute tests for default version of `ngx-components` of 1020.

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
