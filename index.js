// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

require('dotenv-flow').config();
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const app = require('./src/app.js');
const config = require('./src/infrastructure/configs/general.config.js');
const init = require('./src/infrastructure/setup/init.service.js');
const {
    handleSignal,
    handleUncaughtException,
    handleUnhandledRejection
} = require('./src/infrastructure/services/errorHandling.service.js');
const { log, logLevel } = require('./src/infrastructure/services/logger.service.js');

init.applyMappings().then(result => {
    if (result) {
        const server = app.listen(config.port, () => {
            log.info(`App: [${process.pid}] listening on port: [${server.address().port}]`);
            log.info(`Log level: [${logLevel}]`);
        });

        ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => process.on(signal, handleSignal(signal, server)));

        process.on('uncaughtException', handleUncaughtException);
        process.on('unhandledRejection', handleUnhandledRejection);
    }
});
