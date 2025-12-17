// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const storageFactoryService = require('../../infrastructure/services/storage/storagefactory.service');
const { getFolderPath } = require('../../infrastructure/services/util/paths.util.js');

class UploadService {
    /**
     * @typedef {import('#domain/assetrepository.interface.js')}  AssetRepositoryInterface
     * @typedef {import('#model/asset.interface.ts').Asset} Asset
     * @typedef {import('#infrastructure/services/contentExtractor.service.js')} ContentExtractorService
     * @typedef {string|Buffer|null} FileContents
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
     * Stores the payload and metadata for a new upload.
     *
     * @param {object} params
     * @param {string} params.tenantId Tenant the asset belongs to
     * @param {string} params.userId User ID to associated with the asset
     * @param {string} params.contentType User-provided content type for the asset
     * @param {string} params.virtualPath Path to assign the data to within this tenant
     * @param {string} params.data Asset payload
     * @param {object} [params.metadata] Asset metadata
     * @param {string} params.assetId
     * @param {string} [params.driverId]
     * @param {string} [params.filePath]
     * @param {boolean} [params.extractContent=false] Indicates whether to extract content from the asset data or not
     * @return {Promise<Asset>}
     */
    async storeUpload({
        tenantId,
        userId,
        contentType,
        virtualPath,
        data,
        metadata,
        driverId,
        assetId,
        filePath,
        extractContent = false
    }) {
        const extractedContentData = extractContent
            ? await this.#contentExtractorService.extract(contentType, data)
            : null;

        if (assetId) {
            const existingAsset = await this.getAsset(tenantId, assetId);
            filePath ??= existingAsset?.storagePath?.split('/').slice(1).join('/');
        }

        const storageDriver = storageFactoryService.createStorageDriver({ driverId });

        const promises = [storageDriver.store({ tenantId, data, contentType, filePath })];

        if (extractContent && extractedContentData) {
            promises.push(storageDriver.store({ tenantId, data: extractedContentData }));
        }

        const res = await Promise.all(promises);

        const storagePath = res[0];

        /** @type {Asset} */
        let asset = {
            id: assetId,
            tenantId: tenantId,
            userId: userId,
            type: contentType,
            virtualPath: virtualPath,
            virtualFolder: getFolderPath(virtualPath),
            storagePath: storagePath,
            storageType: storageDriver.getName(),
            driverId: storageDriver.getId(),
            creationTimestamp: new Date().toISOString(),
            metadata
        };

        if (extractContent) {
            asset = {
                ...asset,
                extractedContentStoragePath: res[1]
            };
        }

        return this.#assetRepository.persist(asset);
    }

    getAssets(tenantId, ids) {
        return this.#assetRepository.findAll(tenantId, ids);
    }

    getAsset(tenantId, id) {
        return this.#assetRepository.find(tenantId, id);
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

    /**
     * @param {string} virtualFolder Path identifying data
     * @param {number} [maxResults]
     *
     * @return {Promise<Asset[]>} assets
     */
    async getAssetsByVirtualFolder(virtualFolder, maxResults = 0) {
        return (await this.#assetRepository.findByVirtualFolder(virtualFolder, maxResults)) || [];
    }

    /**
     * @summary Provides a URL to retrieve data from persistent storage
     *
     * @param {object} params
     * @param {?Asset} params.asset Asset to get a public URL for
     * @param {?Number} params.ttl Signed URL TTL in milliseconds
     * @param {string} [params.driverId]
     * @param {boolean} [params.signUrl=true]
     * @param {Boolean} [params.routeViaCdn=false] Whether to generate a signed URL to the CDN instead of the Cloud Storage
     *
     * @return {Promise<?string>} Public URL to retrieve the data
     */
    getPublicUrl({ asset, ttl, driverId, signUrl = true, routeViaCdn = false }) {
        if (asset !== null) {
            const fileName = asset['virtualPath']?.split('/').pop() ?? '';
            const { tenantId, storagePath } = asset;

            return storageFactoryService.createStorageDriver({ driverId }).getPublicUrl({
                tenantId,
                storagePath,
                fileName,
                ttl,
                routeViaCdn,
                signUrl
            });
        }

        return Promise.resolve('');
    }

    /**
     * @summary Provides a stream to retrieve data from persistent storage
     *
     * @param {object} params
     * @param {string} [params.driverId]
     * @param {string} params.tenantId Tenant the data belongs to
     * @param {string} params.storagePath
     *
     * @return {Promise<ReadableStream>} Stream of the stored data
     */
    getFileStream({ driverId, tenantId, storagePath }) {
        return storageFactoryService.createStorageDriver({ driverId }).getFileStream(tenantId, storagePath);
    }

    /**
     * @summary Ensure that the provided filePath cannot be outside of the storage root
     *
     * @param {string} filePath - The file path to sanitize
     * @param {string} [driverId] - Storage driver ID
     * @return {?string}
     */
    sanitizeFilePath(filePath, driverId) {
        return storageFactoryService.createStorageDriver({ driverId }).sanitizeFilePath(filePath);
    }
}

module.exports = UploadService;
