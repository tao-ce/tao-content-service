// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { pino } = require('pino');
const { pinoHttp } = require('pino-http');

// minimum log level in hierarchy: trace (10), debug (20), info (30), warn (40), error (50), fatal (60)
const logLevel = process.env.DEBUG === 'true' ? 'trace' : 'info';

const requestLoggerOptions = (enabled = true) => ({
    level: logLevel,
    customLogLevel: function (req, res, err) {
        if (!enabled) {
            return 'silent';
        } else if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn';
        } else if (res.statusCode >= 500 || err) {
            return 'error';
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
            return 'silent';
        }
        return 'info';
    },
    // customize request an output (discard headers etc.)
    serializers: {
        req: pino.stdSerializers.wrapRequestSerializer(req => {
            return {
                id: req.raw.id,
                method: req.raw.method,
                path: req.raw.url,
                headers: {
                    host: req.raw.headers.host,
                    'user-agent': req.raw.headers['user-agent'],
                    referer: req.raw.headers.referer
                }
            };
        }),
        res: pino.stdSerializers.wrapResponseSerializer(res => {
            return {
                statusCode: res.raw.statusCode,
                headers: {
                    'content-type': res.headers['content-type'],
                    'content-length': res.headers['content-length']
                }
            };
        })
    }
});

const log = pino({
    level: logLevel
});

const requestLogger = enabled => {
    if (process.env.DEBUG === 'true') {
        log.info(`DEBUG mode.`);
        return pinoHttp();
    } else if (process.env.LOG_TYPE === 'file') {
        return pinoHttp(
            requestLoggerOptions(enabled),
            pino.transport({
                targets: [
                    { level: 'error', target: 'pino/file', options: { destination: 'logs/error.log' } },
                    { target: 'pino/file', options: { destination: 'logs/app.log' } }
                ]
            })
        );
    }
    return pinoHttp(requestLoggerOptions(enabled));
};

module.exports = {
    requestLogger,
    log,
    logLevel
};
