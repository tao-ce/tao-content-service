// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/* eslint-disable no-unused-vars */

class AssetRepositoryInterface {
    /**
     * @typedef {import('#domain/collectionslice.valueobject')<Asset>} AssetsCollection
     * @typedef {import('#model/asset.interface.js').Asset} Asset
     */

    constructor() {
        if (this.constructor === AssetRepositoryInterface) {
            throw new Error('AssetRepositoryInterface should not be instantiated directly');
        }
    }

    /**
     * @param {string} tenantId Tenant the data belongs to
     * @param {string[]} ids Asset IDs
     *
     * @return {Promise<Asset[]>} asset data
     */
    findAll(tenantId, ids) {
        throw new Error('findAll() must be overloaded by child classes');
    }

    /**
     * @param {string} tenantId Tenant the data belongs to
     * @param {string} id Asset ID
     *
     * @return {Promise<?Asset>} asset data
     */
    find(tenantId, id) {
        throw new Error('find() must be overloaded by child classes');
    }

    /**
     * @param {string} tenantId Tenant the data belongs to
     * @param {string} virtualPath Path identifying data
     *
     * @return {Promise<?Asset>} asset data
     */
    findByVirtualPath(tenantId, virtualPath) {
        throw new Error('findByVirtualPath() must be overloaded by child classes');
    }

    /**
     * @param {string} virtualFolder Path identifying data
     * @param {number} [maxResults]
     * This is intentionally a non-tenant-specific method.
     *
     * @return {Promise<?Asset[]>} assets data
     */
    findByVirtualFolder(virtualFolder, maxResults) {
        throw new Error('findByVirtualFolder() must be overloaded by child classes');
    }

    /**
     * Lists files having their virtual path starting with "$path/" for the
     * provided tenant, sorted by creation-timestamp.
     *
     * @param {string} tenantId ID of the tenant to list assets for
     * @param {string} path Path for the virtual directory containing the assets
     * @param {number} offset Index for the first asset to fetch
     * @param {number} count Number of assets to retrieve
     * @param {?string} userId If given, include only assets from this user
     *
     * @return {Promise<AssetsCollection>}
     */
    list(tenantId, path, offset, count, userId) {
        throw new Error('list() must be overloaded by child classes');
    }

    /**
     * Lists virtual directory names (recursively) having their virtual path
     * starting with "$path/" for the provided tenant.
     *
     * @param {string} tenantId ID of the tenant the root belongs to
     * @param {string} root Virtual path to list subdirectories for
     * @param {?string} userId If given, skip dirs without files from this user
     *
     * @return {Promise<string[]>}
     */
    listDirectories(tenantId, root, userId) {
        throw new Error('listDirectories() must be overloaded by child classes');
    }

    /**
     * Returns the number of assets contained in a given virtual path, and,
     * if the recurse flag is provided, all its child subdirectories.
     *
     * @param {string} tenantId ID of the tenant the root belongs to
     * @param {string} root Virtual path to count assets for
     * @param {boolean} recurse If set, count also assets from subdirectories
     * @param {?string} userId If given, include only assets from this user
     *
     * @return {Promise<?number>} Number of assets
     */
    countAssets(tenantId, root, recurse, userId) {
        throw new Error('countAssets() must be overloaded by child classes');
    }

    /**
     * @summary Deletes an asset by its virtual path.
     *
     * @param {string} tenantId Tenant the data belongs to
     * @param {string} virtualPath Virtual path of the asset to delete
     *
     * @return {Promise<?Asset>} The deleted asset, or null if not found
     */
    deleteByVirtualPath(tenantId, virtualPath) {
        throw new Error('deleteByVirtualPath() must be overloaded by child classes');
    }

    /**
     * @summary Creates or updates the data for a given asset.
     *
     * @param {Asset} asset Asset instance to persist
     *
     * @return {Promise<Asset>} A promise resolving to the persisted asset
     */
    persist(asset) {
        throw new Error('persist() must be overloaded by child classes');
    }

    /**
     * @param {Object} condition
     * @param {string} condition.tenantId
     * @param {string} [condition.userId]
     * @returns {Promise<Asset[]>}
     */
    findBy(condition) {
        throw new Error('findBy() must be overloaded by child classes');
    }

    /**
     * @param {Object} options
     * @param {Object} options.changes
     * @param {Object} options.condition
     * @returns {Promise<void>}
     */
    updateBy({ changes, condition }) {
        throw new Error('updateBy() must be overloaded by child classes');
    }
}

module.exports = AssetRepositoryInterface;
