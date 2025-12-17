// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2022 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * This small script calls health API endpoint to check is it available or not.
 * It exits with 0 if everything ok
 * and exits with 1 if it is not available or there is any error.
 */

require('dotenv-flow').config();

const http = require('http');
const config = require('./src/infrastructure/configs/general.config.js');

http.request(
    {
        host: 'localhost',
        path: '/api/v1/health',
        port: config.port,
        timeout: 2000
    },
    res => {
        if (res.statusCode === 200) {
            process.exit(0);
        }
        process.exit(1);
    }
)
    .on('error', () => process.exit(1))
    .end();
