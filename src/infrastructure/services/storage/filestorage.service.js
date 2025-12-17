// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const StorageDriverInterface = require('../../../domain/storagedriver.interface');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { log } = require('../logger.service');
const { getFolderPath } = require('../util/paths.util.js');

class FileStorageService extends StorageDriverInterface {
    /** @type string */
    #id;

    /** @type string */
    #rootDirectory;

    /** @type string */
    #publicBaseUrl;

    /**
     * @param {object} params
     * @param {object} params.driver
     */
    constructor({ driver }) {
        super();

        this.#id = driver.id;
        this.#rootDirectory = driver.config.rootPath;
        this.#publicBaseUrl = driver.config.baseUrl;
    }

    /**
     * @inheritDoc
     *
     * @return {string}
     */
    getName() {
        return 'file';
    }

    /**
     * @inheritDoc
     *
     * @return {string}
     */
    getId() {
        return this.#id;
    }

    /**
     * @inheritDoc
     *
     * @return {Promise<string>} Path used later as a param for getPublicUrl()
     */
    async store({ tenantId, data, filePath }) {
        const id = crypto.randomUUID().toString();
        const dirPath = `${this.#rootDirectory}/${tenantId}`;
        const storagePath = filePath || id;
        const fullPath = `${dirPath}/${storagePath}`;
        const truncatedFullPath = getFolderPath(fullPath, true);

        try {
            await this.#ensureDirectoryExists(truncatedFullPath);

            return await new Promise((resolve, reject) => {
                const stream = fs.createWriteStream(fullPath);

                stream.write(data, err => {
                    if (err) {
                        log.error(err, 'Error writing data');
                        reject(new Error('Failed to write data: ' + err.message));
                        return;
                    }

                    log.debug('Data written');
                    resolve(storagePath);
                });

                stream.end();
            });
        } catch (err) {
            log.error(err, 'Got error storing data');
            throw new Error('Error storing data: ' + err.message);
        }
    }

    /**
     * @inheritDoc
     *
     * @return {Promise<?string>} Public URL to retrieve the data
     */
    async getPublicUrl({ tenantId, storagePath, fileName }) {
        const query = fileName ? `?filename=${fileName}` : '';
        return Promise.resolve(`${this.#publicBaseUrl}/${tenantId}/${storagePath}${query}`);
    }

    getContent(tenantId, storagePath) {
        return new Promise(resolve => {
            const fullPath = `${this.#rootDirectory}/${tenantId}/${storagePath}`;

            resolve(fs.readFileSync(fullPath));
        });
    }

    /**
     * @inheritDoc
     *
     * @return {Promise<fs.ReadStream>}
     */
    async getFileStream(tenantId, storagePath) {
        const fullPath = `${this.#rootDirectory}/${tenantId}/${storagePath}`;
        return Promise.resolve(fs.createReadStream(fullPath));
    }

    /**
     * @inheritDoc
     *
     * @return {Promise}
     */
    async moveFile(tenantId, storagePath, newStoragePath) {
        const fullPath = `${this.#rootDirectory}/${tenantId}/${newStoragePath}`;
        const truncatedNewStoragePath = getFolderPath(fullPath, true);

        log.debug(`Moving filestorage file: [${storagePath}] to [${truncatedNewStoragePath}]`);

        try {
            await this.#ensureDirectoryExists(truncatedNewStoragePath);
        } catch (err) {
            log.error(err, 'Error creating directory %s', truncatedNewStoragePath);
            throw new Error('Error moving file: ' + err.message, { cause: err });
        }
        return fs.promises.rename(
            `${this.#rootDirectory}/${tenantId}/${storagePath}`,
            `${this.#rootDirectory}/${tenantId}/${newStoragePath}`
        );
    }

    #ensureDirectoryExists(directory) {
        return fs.promises
            .stat(directory)
            .then(stats => {
                if (!stats.isDirectory()) {
                    throw new Error(`${directory} exists and is not a directory`);
                }
            })
            .catch(async err => {
                log.debug('Got error on stat, the directory may not exist: %o', err);

                log.debug('Directory "%s" does not exist, creating it', directory);

                await fs.promises.mkdir(directory, { recursive: true }).catch(e => {
                    throw e; // Propagate up
                });
            });
    }

    /**
     * Ensure that the provided filePath cannot be outside of the storage root
     * @param {string} filePath
     * @return {?string} Normalized path or null if invalid
     */
    sanitizeFilePath(filePath) {
        if (!filePath || typeof filePath !== 'string') {
            return null;
        }

        // Normalize provided path (handles ../, encoded sequences, etc.)
        const normalized = path.normalize(filePath.normalize('NFC'));

        // Prevent absolute paths or drive letters
        if (path.isAbsolute(normalized)) {
            return null;
        }

        const fullPath = path.resolve(this.#rootDirectory, normalized);

        if (!fullPath.startsWith(this.#rootDirectory + path.sep)) {
            return null;
        }

        return normalized;
    }
}

module.exports = FileStorageService;
