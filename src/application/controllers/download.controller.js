// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { log } = require('../../infrastructure/services/logger.service');
const AbstractController = require('../abstractcontroller');
const DownloadAssetResponse = require('../response/downloadasset.response');
const storageFactoryService = require('../../infrastructure/services/storage/storagefactory.service');
const typeCaster = require('../../infrastructure/services/util/typeCaster.util');

class DownloadController extends AbstractController {
    /**
     * @typedef {import('#application/service/upload.service.js')} UploadService
     */

    /** @type UploadService */
    #uploadService;

    /**
     * @param {UploadService} uploadService
     */
    constructor(uploadService) {
        super();

        this.#uploadService = uploadService;
    }

    getExtractedContent(request, response) {
        const tenantId = this.getTenantId(request);
        if (tenantId === null) {
            this.sendBadRequest(response, 'Missing or invalid tenantId');

            return;
        }

        const virtualPath = this.getVirtualPath(request);
        if (virtualPath === null) {
            this.sendBadRequest(response, 'Missing or invalid virtual path');

            return;
        }

        const { driverId } = request.query || {};

        this.#uploadService
            .getAssetByVirtualPath(tenantId, virtualPath)
            .then(asset => {
                if (asset === null) {
                    response.status(404).json({
                        error: 'Asset not found'
                    });

                    return;
                }

                if (!asset.extractedContentStoragePath) {
                    response.status(404).json({
                        error: 'No extracted content available'
                    });

                    return;
                }

                storageFactoryService
                    .createStorageDriver({ driverId })
                    .getContent(tenantId, asset.extractedContentStoragePath)
                    .then(content => {
                        response.status(200).send(content.toString());
                    })
                    .catch(e => this.sendError(response, e));
            })
            .catch(e => this.sendError(response, e));
    }

    getByIds(request, response) {
        const tenantId = this.getTenantId(request);
        if (tenantId === null) {
            this.sendBadRequest(response, 'Missing or invalid tenantId');

            return;
        }
        const ids = request.query.id || [];
        this.#uploadService
            .getAssets(tenantId, Array.isArray(ids) ? ids : [ids])
            .then(assets => Promise.all(assets.map(this.#createParseAssetCallback(request))))
            .then(assets =>
                response.status(200).json(assets.map(([asset, url]) => new DownloadAssetResponse(asset, url)))
            )
            .catch(e => this.sendError(response, e));
    }

    getById(request, response) {
        const tenantId = this.getTenantId(request);
        if (tenantId === null) {
            this.sendBadRequest(response, 'Missing or invalid tenantId');

            return;
        }
        this.#uploadService
            .getAsset(tenantId, request.params.id)
            .then(this.#createParseAssetCallback(request))
            .then(this.#createSendAssetCallback(request, response))
            .catch(e => this.sendError(response, e));
    }

    getDownloadUrl(request, response) {
        const tenantId = this.getTenantId(request);
        if (tenantId === null) {
            this.sendBadRequest(response, 'Missing or invalid tenantId');

            return;
        }

        const virtualPath = this.getVirtualPath(request);
        if (virtualPath === null) {
            this.sendBadRequest(response, 'Missing or invalid virtual path');

            return;
        }

        this.#uploadService
            .getAssetByVirtualPath(tenantId, virtualPath)
            .then(this.#createParseAssetCallback(request))
            .then(this.#createSendAssetCallback(request, response))
            .catch(e => this.sendError(response, e));
    }

    getByVirtualFolder(request, response) {
        // NOT tenant-specific, we can get results from all tenants

        const virtualFolder = this.getVirtualFolder(request);
        if (virtualFolder === null) {
            this.sendBadRequest(response, 'Missing or invalid virtual folder');

            return;
        }

        const maxResults = parseInt(request.query.maxResults || 0);

        this.#uploadService
            .getAssetsByVirtualFolder(virtualFolder, maxResults)
            .then(assets => Promise.all(assets.map(this.#createParseAssetCallback(request))))
            .then(assets =>
                response.status(200).json(assets.map(([asset, url]) => new DownloadAssetResponse(asset, url)))
            )
            .catch(e => this.sendError(response, e));
    }

    async streamFile(request, response) {
        const tenantId = this.getTenantId(request);
        if (tenantId === null) {
            this.sendBadRequest(response, 'Missing or invalid tenantId');

            return;
        }

        const storagePath = this.getStoragePath(request);
        if (!storagePath) {
            this.sendBadRequest(response, 'Missing or invalid body property: storagePath');

            return;
        }

        const { driverId } = request.query || {};
        if (!driverId) {
            this.sendBadRequest(response, 'Missing or invalid param: driverId');

            return;
        }

        try {
            const stream = await this.#uploadService.getFileStream({
                driverId,
                tenantId,
                storagePath
            });

            stream.pipe(response);

            stream.on('error', err => {
                log.error(err);
                if (!response.headersSent) {
                    this.sendError(response, err);
                } else {
                    response.end();
                }
            });
        } catch (err) {
            this.sendError(response, err);
        }
    }

    #createParseAssetCallback(request) {
        return asset => {
            if (asset === null) {
                return [null, null];
            }

            const { ttl, routeViaCdn, driverId, signUrl } = request.query || {};

            return Promise.all([
                asset,
                this.#uploadService.getPublicUrl({
                    asset,
                    ttl,
                    routeViaCdn,
                    driverId: asset.driverId || driverId, // asset.driverId, if set, will be the correct one for getPublicUrl
                    signUrl: typeCaster.toBoolean(signUrl, true)
                })
            ]);
        };
    }

    #createSendAssetCallback(request, response) {
        return ([asset, url]) => {
            if (asset === null) {
                response.status(404).json({
                    error: 'Asset not found'
                });

                return;
            }

            if (typeof url !== 'string' || url.length === 0) {
                response.status(500).json({
                    error: 'Cannot determine asset public URL'
                });

                return;
            }

            if (this.isRedirectRequested(request)) {
                response.redirect(302, url);
            } else {
                response.status(200).json(new DownloadAssetResponse(asset, url));
            }
        };
    }
}

module.exports = DownloadController;
