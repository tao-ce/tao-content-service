// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

class BrowseService {
    /**
     * @typedef {import('#domain/collectionslice.valueobject.js')<Asset>} AssetCollection
     * @typedef {import('#domain/assetrepository.interface.js')} AssetRepositoryInterface
     * @typedef {import('#model/asset.interface.js').Asset} Asset
     * @typedef {import('pino').Logger} Logger
     */

    /** @type Logger */
    #logger;

    /** @type AssetRepositoryInterface */
    #assetRepository;

    /**
     * @param {Logger} logger A logger instance to use
     * @param {AssetRepositoryInterface} assetRepository
     */
    constructor(logger, assetRepository) {
        this.#logger = logger;
        this.#assetRepository = assetRepository;
    }

    /**
     * Retrieves data for a set of assets from the given tenant, returning a subset of
     * elements with a predefined size.
     *
     * @param {string} tenantId ID of the tenant to list assets for
     * @param {string} path Path for the virtual directory containing the assets
     * @param {number} pageNumber Page number to fetch
     * @param {number} pageSize Number of assets to retrieve
     * @param {?string} userId If given, include only assets from this user
     *
     * @return {Promise<AssetCollection>}
     */
    listAssets(tenantId, path, pageNumber, pageSize, userId) {
        // @todo Watch out the ES pagination limit (we'd need to use the scroll API
        //       if we want to list more than 10K assets from a single directory)

        if (pageNumber < 0) {
            throw new Error('Page numbers cannot be less than zero');
        }

        return this.#assetRepository.list(tenantId, path, pageNumber * pageSize, pageSize, userId);
    }

    /**
     * Lists all directories contained in the given one.
     *
     * @param {string} tenantId ID of the tenant the path belongs to
     * @param {string} path Virtual path to list subdirectories for
     * @param {?string} userId If given, skip dirs without files from this user
     *
     * @return {Promise<string[]>}
     */
    listDirectories(tenantId, path, userId) {
        return this.#assetRepository.listDirectories(tenantId, path, userId);
    }

    /**
     * Returns the number of assets contained in a given directory in a
     * non-recursively way.
     *
     * @param {string} tenantId ID of the tenant the path belongs to
     * @param {string} path Virtual path to count assets from
     * @param {?string} userId If given, include only assets from this user
     *
     * @return {Promise<number>}
     */
    countAssets(tenantId, path, userId) {
        return this.#assetRepository.countAssets(tenantId, path, false, userId);
    }
}

module.exports = BrowseService;
