// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const serviceContainer = require('../services/servicecontainer');
const { errorHandler } = require('../middleware/error.middleware');
// const { extractToken } = require('../middleware/jwt.middleware');
// const bearerToken = require('express-bearer-token');
const DownloadController = require('../../application/controllers/download.controller');
const MoveController = require('../../application/controllers/move.controller');
const DeleteController = require('../../application/controllers/delete.controller');
const express = require('express');
const router = express.Router();

// @todo
//router.use(bearerToken());
//router.use(extractToken);

const downloadController = new DownloadController(serviceContainer.uploadService);
const moveController = new MoveController(serviceContainer.moveService);
const deleteController = new DeleteController(serviceContainer.uploadService);

router.get('/stream/:tenantId/:storagePath(*)', downloadController.streamFile.bind(downloadController));

router.get('/:virtualFolder(*)', downloadController.getByVirtualFolder.bind(downloadController));

router.post('/move/:tenantId', express.json(), moveController.moveFile.bind(moveController));

router.delete('/:tenantId/:virtualPath(*)', deleteController.deleteFile.bind(deleteController));

router.use(errorHandler);

module.exports = router;
