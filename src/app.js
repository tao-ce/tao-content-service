// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const express = require('express');
const fs = require('fs');
const path = require('path');

const { requestLogger } = require('./infrastructure/services/logger.service.js');

const assetRouter = require('./infrastructure/routers/asset.router.js');
const browseRouter = require('./infrastructure/routers/browse.router.js');
const healthRouter = require('./infrastructure/routers/health.router.js');
const downloadRouter = require('./infrastructure/routers/download.router.js');
const uploadRouter = require('./infrastructure/routers/upload.router.js');
const contentRouter = require('./infrastructure/routers/content.router.js');
const filesRouter = require('./infrastructure/routers/files.router.js');

const storageConfig = require('./infrastructure/configs/storage.config.js');
const { log } = require('./infrastructure/services/logger.service.js');

const app = express();

app.disable('x-powered-by');

app.set('trust proxy', true); // use x-forwarded-for as client ip

// These try to parse the uploaded payload (we don't want that)
//app.use(express.json());
//app.use(express.text());

app.use('/api/v1/tenants/:tenantId/assets', assetRouter);
app.use('/api/v1/browse', browseRouter);
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/download', downloadRouter);
app.use('/api/v1/content', contentRouter);
app.use('/api/v1/files', filesRouter);

// set up static server for 'file' storage type, if needed
const fileDriverValue = Object.values(storageConfig.config.drivers)
    .filter(driver => driver.type === storageConfig.driverTypes.FILESYSTEM)
    .at(0);
if (fileDriverValue) {
    const mountPath = '/storage';
    const absolutePath = fileDriverValue.config.rootPath;
    app.use(
        mountPath,
        express.static(absolutePath, {
            index: false,
            setHeaders(res) {
                if (res.req.query.filename) {
                    const safeName = path
                        .basename(String(res.req.query.filename))
                        .replace(/[^\w\s.-]/g, '_')
                        .substring(0, 255);
                    res.setHeader('Content-Disposition', `attachment; filename=${safeName}`);
                } else {
                    res.setHeader('Content-Disposition', 'attachment');
                }
            }
        })
    );
    log.info('Static server: filesystem path [%s] mounted at [%s]', absolutePath, mountPath);
}

// initialize open api documentation
if (process.env.SWAGGER) {
    const swaggerUi = require('swagger-ui-express');
    const swaggerPath = path.join(__dirname, '../swagger.json');
    const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// setup logger
if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger());
}

module.exports = app;
