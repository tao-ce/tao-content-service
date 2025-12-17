// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { log } = require('./logger.service');

const handleSignal = (signal, server) => () => {
    log.info(`signal [${signal}] received on process [${process.pid}], closing server.`);
    server.close(() => process.exit(0));
    setTimeout(() => {
        process.exit(0);
    }, 1000).unref();
};

function handleUncaughtException(err, origin) {
    log.error(`Uncaught exception: [${err.message}] at: [${origin}] stack: [${err.stack}]`);
    process.exit(1);
}

function handleUnhandledRejection(reason, promise) {
    log.error(`Unhandled rejection: [${reason.message}] at: [${promise}] stack: [${reason.stack}]`);
    process.exit(1);
}

module.exports = {
    handleSignal,
    handleUncaughtException,
    handleUnhandledRejection
};
