import { EnvironmentOptions } from '@c8y/devkit/dist/options';
import { author, description, version, license } from './package.json';
import * as versioningMatrix from './versioningMatrix.json';

export default {
  runTime: {
    author,
    description,
    version,
    license,
    name: 'Cumulocity community plugins',
    contextPath: 'sag-pkg-community-plugins',
    key: 'sag-pkg-community-plugins-application-key',
    contentSecurityPolicy:
      "base-uri 'none'; default-src 'self' 'unsafe-inline' http: https: ws: wss:; connect-src 'self' http: https: ws: wss:;  script-src 'self' *.bugherd.com *.twitter.com *.twimg.com *.aptrinsic.com 'unsafe-inline' 'unsafe-eval' data:; style-src * 'unsafe-inline' blob:; img-src * data: blob:; font-src * data:; frame-src *; worker-src 'self' blob:;",
    dynamicOptionsUrl: '/apps/public/public-options/options.json',
    remotes: {
      'sag-pkg-community-plugins': [
        'ExampleWidgetPluginModule',
        'DatapointsGraphWidgetModule',
      ],
    },
    package: 'plugin',
    isPackage: true,
    noAppSwitcher: true,
    exports: [
      {
        name: 'Example widget plugin',
        module: 'ExampleWidgetPluginModule',
        path: './src/app/example-widget/example-widget-plugin.module.ts',
        description: 'Adds a custom widget to the shell application',
      },
      {
        name: 'Data points graph',
        module: 'DatapointsGraphWidgetModule',
        path: './src/app/datapoints-graph/datapoints-graph-widget.module.ts',
        description: 'Adds data points graph widget to the shell application',
      },
    ],
    versioningMatrix,
  },
  buildTime: {
    federation: [
      '@angular/animations',
      '@angular/cdk',
      '@angular/common',
      '@angular/compiler',
      '@angular/core',
      '@angular/forms',
      '@angular/platform-browser',
      '@angular/platform-browser-dynamic',
      '@angular/router',
      '@angular/upgrade',
      '@c8y/client',
      '@c8y/ngx-components',
      'ngx-bootstrap',
      '@ngx-translate/core',
    ],
    copy: [
      {
        from: 'CHANGELOG.md',
        to: 'CHANGELOG.md',
      },
      {
        from: 'screenshots',
        to: 'screenshots',
      },
      {
        from: 'c8y-widget-preview-img',
        to: 'c8y-widget-preview-img',
      },
      {
        from: 'LICENSE',
        to: 'LICENSE.txt',
      },
    ],
  },
} as const satisfies EnvironmentOptions;
