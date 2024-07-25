# Cypress

## Simple plugin testing

You can use `npm run cypress:ci:plugins` to execute cypress tests against a previously built version (`npm run build`) of this package located in the `dist` folder.
This test run will test plugins without shell app. It is not fully integration tests, therefore it does not need recording of backend requests.
Test cases that will be executed with this approach are the ones that
- has no config provided in test suite (see `example-widget` test suite in `example-widget.cy.ts`)
- has config provided to test suite with `requires` property containing `null` (as required indicates shell version required for test case, which is "no shell" in this approach) 


## Testing plugins against Cockpit as shell

You can also run test in the context of shell app, which is Cockpit in our case. 
These tests are using recorded backend requests stored as json files in `cypress/rec` folder. Once recording is created,
it can be used for testing plugins against shell without making actual API calls.


Test cases are filtered by version of shell using `config.requires` property.
For shell tests, it is string representing semver constraint. For example, if our shell version is 1018.0.270
and test case has `config.requires` of value `['>=1018.0.0 <1020.0.0', null]`, it will test 1018.0.270 against semver constraints
in array and run test case if particular version of shell is matching one of the constraints.


### Running tests and creating recordings

To create recordings of API calls for further use, recording test run has to be executed.
1. Build plugins with `npm run build` and put build file to `dist/apps/sag-pkg-community-plugins`
2. Get Cockpit app (for our example it will be 1020.4.1), put it in `dist/apps/cockpit`
3. Run cumulocity-cypress-ctrl with command 
`npx c8yctrl --config c8yctrl.config.ts --baseUrl <tenant url> --port 4200 --staticRoot ./dist --folder ./cypress/rec --user <user> --password <password> --tenant <tenant id>`
to host both cockpit and plugins locally (c8yctrl will also take care for authorisation)
4. In second terminal, run `npx cypress run --env C8Y_CTRL_MODE=recording`
5. After successful run recordings of API requests will be saved in `cypress/rec`


### Running tests using recordings

1. Repeat steps 1-3 from `Creating recordings`
2. In second terminal, run `npx cypress run --env C8Y_CTRL_MODE=mocking`
3. Tests will be run using previously created recordings from `cypress/rec`

Additionally, you can provide C8Y_SYSTEM_VERSION parameter like `npx cypress run --env C8Y_CTRL_MODE=recording,C8Y_SYSTEM_VERSION=1020.0.0`.
This way version read from shell app will be overridden. 
It can be useful to e.g. run tests against Cockpit of version 1021.0.0 (in the future) using test cases and recordings meant for 1020.
