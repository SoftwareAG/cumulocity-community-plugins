import { defineConfig } from 'cypress';
import { configureC8yPlugin } from 'cumulocity-cypress/plugin';

export default defineConfig({
  chromeWebSecurity: false,
  e2e: {
    setupNodeEvents(on, config) {
      const providerVersion = config.env['C8Y_CTRL_PROVIDER_VERSION'];
      if (!providerVersion) {
        config.env['C8Y_CTRL_PROVIDER_VERSION'] = '1020';
      }

      const baseUrl =
        config.env['baseUrl'] || config.env['C8Y_BASEURL'] || null;
      if (!config.baseUrl && baseUrl) {
        config.baseUrl = baseUrl;
      }
      configureC8yPlugin(on, config);

      return config;
    },
    baseUrl: 'http://localhost:4200',
  },
});
