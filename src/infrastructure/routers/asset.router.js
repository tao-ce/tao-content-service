// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const serviceContainer = require('../services/servicecontainer');
const { errorHandler } = require('../middleware/error.middleware');
const express = require('express');
const router = express.Router({ mergeParams: true });

const DownloadController = require('../../application/controllers/download.controller');

const downloadController = new DownloadController(serviceContainer.uploadService);

router.get('/', downloadController.getByIds.bind(downloadController));
router.get('/:id', downloadController.getById.bind(downloadController));

router.use(errorHandler);

module.exports = router;
