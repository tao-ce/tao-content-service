// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const express = require('express');
const router = express.Router();

const healthController = require('./../../application/controllers/health.controller.js');

router.get('/', healthController.get);

module.exports = router;
