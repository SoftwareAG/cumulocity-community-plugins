import { pactId } from 'cumulocity-cypress';

const { _ } = Cypress;

export function isShellRequired(): boolean {
  const tags = Cypress.env('grepTags');
  const configTags = _.get(Cypress.config(), 'tags');
  const shell = '@shell';
  return (
    Cypress.env('C8Y_CTRL_MODE') != null &&
    (tags?.includes(shell) || tags === shell) &&
    (configTags?.includes(shell) || configTags === shell)
  );
}

export function isRecording(): boolean {
  return Cypress.env('C8Y_CTRL_MODE') === 'recording';
}

/**
 * Update c8yctrl pact file to be used for recording or mocking.
 * @param titleOrId An id or array of titles with names of suite or titles
 */
export function c8yctrl(
  titleOrId: string | string[] = Cypress.c8ypact.getCurrentTestId()
): Promise<Response> {
  const id = pactId(titleOrId);
  const parameter: string = isRecording()
    ? '?recording=true&clear'
    : '?recording=false';

  return (cy.state('window') as Cypress.AUTWindow).fetch(
    `${Cypress.config().baseUrl}/c8yctrl/current${parameter}&id=${id}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{}',
    }
  );
}

export function resetC8yCtrl() {
  return (cy.state('window') as Cypress.AUTWindow).fetch(
    `${Cypress.config().baseUrl}/c8yctrl/current`,
    {
      method: 'DELETE',
    }
  );
}
