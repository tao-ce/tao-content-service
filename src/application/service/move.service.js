// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const storageFactoryService = require('../../infrastructure/services/storage/storagefactory.service');
const { log } = require('../../infrastructure/services/logger.service');

class MoveService {
    /**
     * @typedef {import('#model/asset.interface.js').Asset} Asset
     * @typedef {import('#domain/assetrepository.interface.js')}  AssetRepositoryInterface
     */

    /** @type {AssetRepositoryInterface} */
    #assetRepository;

    /**
     * @param {AssetRepositoryInterface} assetRepository
     */
    constructor(assetRepository) {
        this.#assetRepository = assetRepository;
    }

    /**
     * Update an asset's virtualPath and optionally storagePath
     * @param {object} params
     * @param {string} params.tenantId
     * @param {string} params.virtualPath
     * @param {string} params.newVirtualPath
     * @param {string} params.newVirtualFolder
     * @param {string} [params.newStoragePath] if provided, the storage will be updated as well as the asset record
     * @returns {Promise<Asset>}
     */
    async moveFile({ tenantId, virtualPath, newVirtualPath, newVirtualFolder, newStoragePath }) {
        if (!tenantId || !virtualPath || !newVirtualPath || !newVirtualFolder) {
            throw new Error('moveFile: required parameters missing');
        }

        if (virtualPath === newVirtualPath) {
            throw new Error('moveFile: source and destination paths are identical');
        }

        // 1. find the repository entry, validating by tenantId & virtualPath
        // 2. [move the stored file if possible]
        // 3. update the repository entry
        const asset = await this.#assetRepository.findByVirtualPath(tenantId, virtualPath);
        if (!asset) {
            log.error(`moveFile: asset with vPath ${virtualPath} not found in repository`);
            throw new Error('moveFile: asset not found in repository');
        }

        const updatedAsset = { ...asset };

        if (newStoragePath) {
            try {
                const storageDriver = storageFactoryService.createStorageDriver({ driverId: asset.driverId });
                await storageDriver.moveFile(tenantId, asset.storagePath, newStoragePath);
                updatedAsset.storagePath = newStoragePath;
            } catch (err) {
                log.error(err, 'moveFile: error moving stored file');
                throw new Error('moveFile: error moving stored file: ' + err.message, { cause: err });
            }
        }

        return this.#assetRepository.persist({
            ...updatedAsset,
            virtualPath: newVirtualPath,
            virtualFolder: newVirtualFolder
        });
    }
}

module.exports = MoveService;
