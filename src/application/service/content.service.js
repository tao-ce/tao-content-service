// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const storageFactoryService = require('../../infrastructure/services/storage/storagefactory.service');
const { log } = require('../../infrastructure/services/logger.service');

class ContentService {
    /**
     * @typedef {import('#domain/assetrepository.interface.js')}  AssetRepositoryInterface
     * @typedef {import('#model/asset.interface.js').Asset} Asset
     * @typedef {import('#infrastructure/services/contentExtractor.service.js')} ContentExtractorService
     */

    /** @type AssetRepositoryInterface */
    #assetRepository;

    /** @type ContentExtractorService */
    #contentExtractorService;

    /**
     * @param {AssetRepositoryInterface} assetRepository
     * @param {ContentExtractorService} contentExtractorService
     */
    constructor(assetRepository, contentExtractorService) {
        this.#assetRepository = assetRepository;
        this.#contentExtractorService = contentExtractorService;
    }

    /**
     * @param {object} params
     * @param {string} params.tenantId
     * @param {string} params.virtualPath
     * @param {string} [params.driverId]
     * @returns {Promise<Buffer|null>}
     */
    async getContent({ tenantId, virtualPath, driverId }) {
        log.debug(`Fetching content for tenant: ${tenantId}, path: ${virtualPath}`);

        const asset = await this.getAssetByVirtualPath(tenantId, virtualPath);

        if (asset === null) {
            log.warn(`Asset not found for tenant: ${tenantId}, path: ${virtualPath}`);
            return null;
        }

        const storageDriver = storageFactoryService.createStorageDriver({ driverId });
        const content = await storageDriver.getContent(asset['tenantId'], asset['storagePath']);

        log.info(`Successfully retrieved content for tenant: ${tenantId}, path: ${virtualPath}`);

        return content;
    }
    /**
     * @param {string} tenantId Tenant the data belongs to
     * @param {string} virtualPath Path identifying data
     *
     * @return {Promise<?Asset>} asset data
     */
    getAssetByVirtualPath(tenantId, virtualPath) {
        return this.#assetRepository.findByVirtualPath(tenantId, virtualPath);
    }

    async extractContent(asset) {
        return this.#contentExtractorService.extract(asset);
    }
}

module.exports = ContentService;
