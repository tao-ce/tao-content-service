// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { errorHandler } = require('../middleware/error.middleware.js');
const serviceContainer = require('../services/servicecontainer.js');
const { extractToken } = require('../middleware/jwt.middleware');
const bearerToken = require('express-bearer-token');
const express = require('express');
const router = express.Router();

router.use(bearerToken());
router.use(extractToken);

const ContentController = require('../../application/controllers/content.controller.js');

// You'll need to run "gcloud auth application-default login"
// inside the container

const contentController = new ContentController(serviceContainer.contentService);
router.get('/:tenantId/:deliveryId/:itemPath(*)', contentController.getItemContent.bind(contentController));

router.use(errorHandler);

module.exports = router;
