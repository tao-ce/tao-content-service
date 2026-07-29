// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

class StorageDriverInterface {
    constructor() {
        if (this.constructor === StorageDriverInterface) {
            throw new Error('StorageDriverInterface should not be instantiated directly');
        }
    }

    /**
     * @summary Returns a string identifying the driver's storageType.
     *
     * The driver identifier is then used to identify which driver is
     * to be used to retrieve data for a given asset.
     *
     * @return {string}
     */
    getName() {
        throw new Error('getName() must be overloaded by child classes');
    }

    /**
     * @summary Returns a string identifying the driver.
     *
     * @return {string}
     */
    getId() {
        throw new Error('getId() must be overloaded by child classes');
    }

    /* eslint no-unused-vars: "off" */

    /**
     * @summary Stores arbitrary information in persistent storage
     *
     * @param {object} params
     * @param {string} params.tenantId Opaque string that may be used to cluster data
     * @param {string|Buffer|(import('node:stream').Stream)} params.data Content to store
     * @param {string} [params.contentType] File MIME type
     * @param {string} [params.filePath]
     * @return {Promise<string>} Path used later as a param for getPublicUrl()
     */
    async store({ tenantId, data, contentType, filePath }) {
        return Promise.reject(new Error('store() must be overloaded by child classes'));
    }

    /**
     * @summary Provides a URL to retrieve data from persistent storage
     *
     * @param {object} params
     * @param {string} params.tenantId Tenant the data belongs to
     * @param {string} params.storagePath Path identifying data within a storage
     * @param {string} params.fileName Filename to retrieve
     * @param {?Number} [params.ttl] Optional signed URL TTL in milliseconds
     * @param {Boolean} [params.routeViaCdn=false] Whether to generate a signed URL to the CDN instead of the Cloud Storage
     * @param {Boolean} [params.signUrl=true]
     *
     * @return {Promise<?string>} Public URL to retrieve the data
     */
    async getPublicUrl({ tenantId, storagePath, fileName, ttl, routeViaCdn = false, signUrl = true }) {
        return Promise.reject(new Error('getPublicUrl() must be overloaded by child classes'));
    }

    /**
     * @returns {Promise<Buffer>}
     */
    async getContent(tenantId, storagePath) {
        return Promise.reject(new Error('getContent() must be overloaded by child classes'));
    }

    /**
     * @summary Streams a file from storage
     *
     * @param {string} tenantId Tenant the data belongs to
     * @param {string} storagePath Path identifying data within a storage
     * @returns {Promise}
     */
    async getFileStream(tenantId, storagePath) {
        return Promise.reject(new Error('getFileStream() must be overloaded by child classes'));
    }

    /**
     * @summary Moves (renames) a file from one location to another
     *
     * @param {string} tenantId Tenant the data belongs to
     * @param {string} storagePath Path identifying data within a storage
     * @param {string} newStoragePath
     * @returns {Promise}
     */
    async moveFile(tenantId, storagePath, newStoragePath) {
        return Promise.reject(new Error('moveFile() must be overloaded by child classes'));
    }

    /**
     * @summary Deletes a file from persistent storage
     *
     * @param {string} tenantId Tenant the data belongs to
     * @param {string} storagePath Path identifying data within a storage
     * @returns {Promise<void>}
     */
    async deleteFile(tenantId, storagePath) {
        throw new Error('deleteFile() must be overloaded by child classes');
    }

    /**
     * @summary Ensure that the provided filePath cannot be outside of the storage root
     *
     * @param {string} filePath
     * @return {?string} Normalized path or null if invalid
     */
    sanitizeFilePath(filePath) {
        throw new Error('sanitizeFilePath() must be overloaded by child classes');
    }
}

module.exports = StorageDriverInterface;
