import _ from 'lodash';
import { createLogger, format, transports } from 'winston';
// https://github.com/winstonjs/winston/issues/2430
// use following import if transports is empty
import { default as transportsDirect } from 'winston/lib/winston/transports/';
import morgan from 'morgan';

import {
  C8yDefaultPactPreprocessor,
  C8yPactHttpController,
  C8yPactHttpControllerConfig,
  C8yPactHttpResponse,
  C8yPactRecord,
} from 'cumulocity-cypress-ctrl';

import { Request } from 'express';

const safeTransports = !_.isEmpty(transports) ? transports : transportsDirect;

export default (config: Partial<C8yPactHttpControllerConfig>) => {
  config.logLevel = 'debug';

  config.logger = createLogger({
    transports: [
      new safeTransports.Console({
        format: format.combine(
          format.colorize({
            all: true,
            colors: {
              info: 'green',
              error: 'red',
              warn: 'yellow',
              debug: 'white',
            },
          }),
          format.simple()
        ),
      }),
    ],
  });

  const requestLogFormat =
    ':method :url :status :res[content-length] - :response-time ms';
  config.requestLogger = [
    morgan(`[c8yctrl] ${requestLogFormat}`, {
      skip: (req) => {
        return (
          !req.url.startsWith('/c8yctrl') || req.url.startsWith('/c8yctrl/log')
        );
      },
      stream: {
        write: (message: string) => {
          config.logger?.warn(message.trim());
        },
      },
    }),
    morgan('dev', {
      skip: (req, res) => {
        return (
          res.statusCode < 400 ||
          req.url.startsWith('/notification/realtime') ||
          req.url.startsWith('/c8yctrl')
        );
      },
      stream: {
        write: (message: string) => {
          config.logger?.error(message.trim());
        },
      },
    }),
  ];

  config.preprocessor = new C8yDefaultPactPreprocessor({
    ignore: [
      'request.headers.cookie',
      'request.headers.accept-encoding',
      'response.headers.cache-control',
      'response.headers.content-length',
      'response.headers.content-encoding',
      'response.headers.transfer-encoding',
      'response.headers.keep-alive',
    ],
    obfuscate: [
      'request.headers.Authorization',
      'request.headers.authorization',
      'request.headers.X-XSRF-TOKEN',
      'response.body.password',
    ],
    obfuscationPattern: '****',
  });

  config.onMockRequest = (
    ctrl: C8yPactHttpController,
    req: Request,
    record: C8yPactRecord | undefined | null
  ) => {
    // ALWAYS mock login and current tenant requests. This way we can avoid missing login
    // requests and responses in recording files.
    if (
      req.url.startsWith('/tenant/oauth?tenant_id=') &&
      req.method === 'POST'
    ) {
      const response: C8yPactHttpResponse = {
        status: 200,
        statusText: 'OK',
        body: '',
        headers: {
          connection: 'close',
          'content-length': '0',
          'set-cookie': [
            'authorization=c8yctrlauthorization; Max-Age=1209600; Path=/; HttpOnly',
            'XSRF-TOKEN=c8yctrltoken; Max-Age=1209600; Path=/;',
          ],
        },
      };
      return response;
    }

    if (req.url.startsWith('/tenant/currentTenant') && record == null) {
      const tenant = ctrl.currentPact?.info.tenant;
      const baseUrl = ctrl.currentPact?.info.baseUrl || ctrl.baseUrl;
      const domain = baseUrl?.replace(/^https?:\/\//, '');

      const response: C8yPactHttpResponse = {
        status: 200,
        statusText: 'OK',
        body: {
          allowCreateTenants: true,
          customProperties: { gainsightEnabled: false },
          domain: domain || '',
          name: tenant || 't1234567',
          self: `https://${baseUrl}/currentTenant`,
          applications: {
            references: [],
          },
        },
        headers: {
          connection: 'close',
          'content-type':
            'application/vnd.com.nsn.cumulocity.currenttenant+json;charset=UTF-8;ver=0.9',
        },
      };
      return response;
    }

    if (req.url.startsWith('/tenant/loginOptions') && record == null) {
      const response: C8yPactHttpResponse = {
        status: 200,
        statusText: 'OK',
        body: {
          loginOptions: [],
        },
        headers: {
          connection: 'close',
          'content-type':
            'application/vnd.com.nsn.cumulocity.loginoptioncollection+json;charset=UTF-8;ver=0.9',
        },
      };
      return response;
    }

    // mock /apps/ requests not served from static files as 404
    if (!record) {
      return {
        status: 404,
        statusText: 'Not Found',
      };
    }
    return record?.response;
  };

  config.onProxyRequest = (_ctrl, proxyReq) => {
    if (proxyReq.hasHeader('x-c8yctrl-noproxy')) {
      return {
        status: 404,
        statusText: 'Not Found',
      };
    }
    return undefined;
  };

  config.onProxyResponse = (
    _ctrl: C8yPactHttpController,
    req: Request,
    res: C8yPactHttpResponse
  ) => {
    // log request and responses for failing requests
    if ((res.status || 200) >= 400) {
      config.logger?.error({
        url: req.url,
        status: `${res.status} ${res.statusText}`,
        requestHeader: req.headers,
        responseHeader: res.headers,
        responseBody: (_.isString(res.body)
          ? res.body
          : JSON.stringify(res.body)
        ).slice(0, 200),
      });
    }

    return true;
  };

  return config;
};
