// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const serviceContainer = require('../services/servicecontainer');
const { errorHandler } = require('../middleware/error.middleware');
// const { extractToken } = require('../middleware/jwt.middleware');
// const bearerToken = require('express-bearer-token');
const express = require('express');
const router = express.Router();

// @todo
//router.use(bearerToken());
//router.use(extractToken);

const DownloadController = require('../../application/controllers/download.controller');

// You'll need to run "gcloud auth application-default login"
// inside the container

const downloadController = new DownloadController(serviceContainer.uploadService);

router.get(
    '/extracted-contents/:tenantId/:virtualPath(*)',
    downloadController.getExtractedContent.bind(downloadController)
);

router.get('/:tenantId/:virtualPath(*)', downloadController.getDownloadUrl.bind(downloadController));

router.use(errorHandler);

module.exports = router;
