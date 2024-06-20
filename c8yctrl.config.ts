import _ from 'lodash';
import fs from 'fs';
import path from 'path';

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
} from 'cumulocity-cypress-ctrl';

const safeTransports = !_.isEmpty(transports) ? transports : transportsDirect;

export default (config: Partial<C8yPactHttpControllerConfig>) => {
  config.logLevel = 'debug';

  config.preprocessor = new C8yDefaultPactPreprocessor({
    // TODO: add 'authorization' (lowercase) if needed
    obfuscate: ['request.headers.Authorization', 'response.body.password'],
    obfuscationPattern: '****',
  });

  config.onProxyResponse = ((
    ctrl: C8yPactHttpController,
    req: Request,
    res: C8yPactHttpResponse
  ) => {
    // log some details of request and responses for failing requests

    // TODO: debugging only
    if ((res.status || 200) >= 400) {
      console.error({
        url: req.url,
        status: `${res.status} ${res.statusText}`,
        requestHeader: req.headers,
        responseHeader: res.headers,
        responseBody: _.isString(res.body)
          ? res.body
          : JSON.stringify(res.body),
      });
    }
    // ctrl.logger?.error({
    //   url: req.url,
    //   status: `${res.status} ${res.statusText}`,
    //   requestHeader: req.headers,
    //   responseHeader: res.headers,
    //   responseBody: _.isString(res.body)
    //     ? res.body
    //     : ctrl.stringify(res.body),
    // });
    // }
    // filter out requests that are already recorded
    // const record = ctrl.currentPact?.nextRecordMatchingRequest(
    //   req,
    //   config.baseUrl
    // );
    // if (record) {
    //   res.headers = res.headers || {};
    //   res.headers["x-c8yctrl-type"] = "duplicate";
    // }
    // return record == null;
    return true;
  }) as any; // TODO: remove any

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
      // new safeTransports.File({
      //   format: format.simple(),
      //   filename: 'combined.log',
      // }),
    ],
  });

  config.requestLogger = () => [
    morgan(':method :url :status :res[content-length] - :response-time ms', {
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
          res.statusCode < 400 || req.url.startsWith('/notification/realtime')
        );
      },
      stream: {
        write: (message: string) => {
          config.logger?.error(message.trim());
        },
      },
    }),
    // morgan('common', {
    //   stream: fs.createWriteStream(path.join(__dirname, 'c8yctrl_access.log'), {
    //     flags: 'a',
    //   }),
    // }),
  ];

  return config;
};
