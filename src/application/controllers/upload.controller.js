// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { log } = require('../../infrastructure/services/logger.service');
const AbstractController = require('../abstractcontroller');
const DownloadAssetResponse = require('../response/downloadasset.response');
const crypto = require('crypto');
const typeCaster = require('../../infrastructure/services/util/typeCaster.util');
const storageConfig = require('../../infrastructure/configs/storage.config');

class UploadController extends AbstractController {
    /**
     * @typedef {import('#application/service/upload.service.js')} UploadService
     * @typedef {import('#infrastructure/services/http/binarybodyreader.service.js')} BinaryBodyReaderService
     */

    /** @type BinaryBodyReaderService */
    #bodyReader;

    /** @type UploadService */
    #uploadService;

    /**
     * @param {UploadService} uploadService
     * @param {BinaryBodyReaderService} bodyReader
     */
    constructor(uploadService, bodyReader) {
        super();

        this.#bodyReader = bodyReader;
        this.#uploadService = uploadService;
    }

    async createNewAsset(request, response, next) {
        try {
            await this.#doCreateNewAsset(request, response);
        } catch (e) {
            if (e.message === 'Bad request') {
                this.sendBadRequest(response, e.message);
                return;
            }
            return next(e);
        }
    }

    async createNewAssetMultipart(request, response, next) {
        try {
            await this.#doCreateNewAssetMultipart(request, response);
        } catch (e) {
            if (e.message === 'Bad request') {
                this.sendBadRequest(response, e.message);
                return;
            }
            return next(e);
        }
    }

    #validateRequest(request, response) {
        if (!this.hasContentType(request)) {
            this.sendBadRequest(response, 'Missing or invalid Content-Type header');

            return;
        }

        const tenantId = this.getTenantId(request);
        if (tenantId === null) {
            this.sendBadRequest(response, 'Missing or invalid tenantId');

            return;
        }

        const userId = this.getUserIdHeader(request);
        if (userId === null) {
            this.sendBadRequest(response, 'Missing or invalid userId header');

            return;
        }

        let { filePath, driverId } = request.query;
        if (filePath) {
            filePath = this.#uploadService.sanitizeFilePath(filePath, driverId || storageConfig.config.defaultDriver);
            if (filePath === null) {
                this.sendBadRequest(response, 'Invalid file path');

                return;
            }
        }

        let virtualPath;
        if (this.isEmptyVirtualPath(request)) {
            // No path provided: Autogenerate it
            //
            virtualPath = crypto.randomUUID();
        } else {
            virtualPath = this.getVirtualPath(request);

            if (virtualPath === null) {
                this.sendBadRequest(response, 'Invalid virtual path');

                return;
            }
        }

        return { tenantId, userId, virtualPath, filePath };
    }

    #validateMultipartPayload(request, response) {
        const file = request.file;
        if (!file) {
            log.error('Missing file');
            this.sendBadRequest(response, 'Missing or invalid file');

            return;
        }

        let metadata;
        try {
            metadata = JSON.parse(request.body.metadata);
        } catch (e) {
            log.error(e, 'Missing or invalid metadata');
            this.sendBadRequest(response, 'Missing or invalid metadata');

            return;
        }

        return { file, metadata };
    }

    async #doCreateNewAsset(request, response) {
        const validParameters = this.#validateRequest(request, response);
        if (!validParameters) {
            return;
        }
        const { tenantId, userId, virtualPath, filePath } = validParameters;
        const { driverId, ttl, routeViaCdn, signUrl, assetId } = request.query || {};
        const contentType = request.headers['content-type'];

        try {
            const body = await this.#bodyReader.readFromRequest(request);
            const asset = await this.#uploadService.storeUpload({
                tenantId,
                userId,
                contentType,
                virtualPath,
                data: body,
                extractContent: this.#hasExtractContentParameter(request),
                driverId,
                assetId,
                filePath
            });

            log.info(`Stored ${body.length} bytes body, type is ${contentType}`);
            const publicUrl = await this.#uploadService.getPublicUrl({
                asset,
                ttl,
                routeViaCdn,
                driverId,
                signUrl: typeCaster.toBoolean(signUrl, true)
            });
            response.status(200).json(new DownloadAssetResponse(asset, publicUrl));
        } catch (e) {
            log.error(e);
            this.sendError(response, e);
        }
    }

    async #doCreateNewAssetMultipart(request, response) {
        const validParameters = this.#validateRequest(request, response);
        if (!validParameters) {
            return;
        }
        const { tenantId, userId, virtualPath, filePath } = validParameters;
        const { driverId, ttl, routeViaCdn, signUrl, assetId } = request.query || {};

        try {
            const validPayload = this.#validateMultipartPayload(request, response);
            if (!validPayload) {
                return;
            }

            const { file, metadata } = validPayload;

            const contentType = file.mimetype || request.headers['content-type'];

            const asset = await this.#uploadService.storeUpload({
                tenantId,
                userId,
                contentType,
                virtualPath,
                data: file.buffer,
                metadata,
                extractContent: this.#hasExtractContentParameter(request),
                driverId,
                assetId,
                filePath
            });
            log.info(`Stored from multipart ${file.buffer.length} bytes body, type is ${contentType}`);

            const publicUrl = await this.#uploadService.getPublicUrl({
                asset,
                ttl,
                routeViaCdn,
                driverId,
                signUrl: typeCaster.toBoolean(signUrl, true)
            });
            response.status(200).json(new DownloadAssetResponse(asset, publicUrl));
        } catch (e) {
            log.error(e);
            this.sendError(response, e);
        }
    }

    #hasExtractContentParameter(request) {
        return 'extractContent' in request.query;
    }
}

module.exports = UploadController;
