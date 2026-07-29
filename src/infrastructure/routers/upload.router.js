// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const storageConfig = require('../configs/storage.config.js');
const { errorHandler } = require('../middleware/error.middleware');
const serviceContainer = require('../services/servicecontainer');
// const { extractToken } = require('../middleware/jwt.middleware');
// const bearerToken = require('express-bearer-token');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
    limits: {
        files: 1,
        fileSize: storageConfig.config.maxUploadSize
    }
}); // WARNING: received files will be in memory until storagedriver invoked

// @todo
//router.use(bearerToken());
//router.use(extractToken);

const UploadController = require('../../application/controllers/upload.controller.js');

// You'll need to run "gcloud auth application-default login"
// inside the container

const uploadController = new UploadController(serviceContainer.uploadService, serviceContainer.binaryBodyReader);

// Upload of file + metadata in FormData body
router.post(
    '/multipart/:tenantId/:virtualPath(*)',
    upload.single('file'),
    uploadController.createNewAssetMultipart.bind(uploadController)
);

router.post('/:tenantId/:virtualPath(*)', uploadController.createNewAsset.bind(uploadController));

router.use(errorHandler);

module.exports = router;
