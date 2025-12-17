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

const BrowseController = require('../../application/controllers/browse.controller');
const browseController = new BrowseController(serviceContainer.browseService);

router.get('/:tenantId/:virtualPath(*)', browseController.list.bind(browseController));

router.use(errorHandler);

module.exports = router;
