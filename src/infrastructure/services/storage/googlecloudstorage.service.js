// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const StorageDriverInterface = require('../../../domain/storagedriver.interface');
const crypto = require('crypto');
const { log } = require('../logger.service');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

class GoogleCloudStorageService extends StorageDriverInterface {
    /** @type string */
    #id;

    /** @var {Storage} */
    #storage;

    /** @var {string} */
    #bucketName;

    /** @var {string} */
    #bucketDirectory;

    /** @var {number} */
    #linkTtlMinutes;

    /** @var {URL|null} */
    #cdnUrl;

    /** @var {Buffer|null} */
    #cdnKey;

    /** @var {string|null} */
    #cdnKeyName;

    /** @var {boolean} */
    #signRequired;

    /**
     * @param {object} params
     * @param {object} params.driver
     */
    constructor({ driver }) {
        super();

        if (!Number.isInteger(driver.config.linkTtlMinutes) || driver.config.linkTtlMinutes < 1) {
            throw new Error('TTL for download links should be at least 1 minute');
        }

        const { projectId, keyFilename } = driver.config;

        this.#id = driver.id;
        this.#storage = new Storage({ projectId, ...(keyFilename && { keyFilename }) });
        this.#bucketName = driver.config.bucketName;
        this.#bucketDirectory = driver.config.bucketDirectory;
        this.#linkTtlMinutes = driver.config.linkTtlMinutes;
        this.#cdnUrl = driver.config.cdnUrl ? new URL(driver.config.cdnUrl) : null;
        this.#cdnKey = driver.config.cdnKey ? Buffer.from(driver.config.cdnKey, 'base64') : null;
        this.#cdnKeyName = driver.config.cdnKeyName;
        this.#signRequired = driver.config.signRequired;
    }

    /**
     * @inheritDoc
     *
     * @return {string}
     */
    getName() {
        return 'gcp';
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
    async store({ tenantId, data, contentType, filePath }) {
        const storagePath = filePath ? this.#getPathData(tenantId, filePath) : this.#randomStoragePath(tenantId);

        return this.#storage
            .bucket(this.#bucketName)
            .file(storagePath.full)
            .save(data, { contentType })
            .then(() => {
                // Note this callback does not receive any params (i.e. no additional
                // info is returned by the GCloud in case the data was stored
                // successfully).
                //
                // Note also subdirectories in the file path are created
                // automatically by GCloud in cse they don't exist.
                //
                log.info('Stored a new resource in GCP', { path: storagePath });

                return storagePath.relative;
            })
            .catch(err => {
                log.error(err, 'Error while storing new file in GCP');

                throw err; // Propagate up
            });
    }

    /**
     * @inheritDoc
     */
    async getPublicUrl({ storagePath, fileName, ttl, routeViaCdn = false, signUrl = true }) {
        const expires = Date.now() + parseInt(ttl ?? this.#linkTtlMinutes * 60 * 1000);

        if (this.#cdnUrl && routeViaCdn) {
            const url = new URL(this.#cdnUrl);
            url.pathname += `/${storagePath}`;

            if (this.#signRequired || signUrl) {
                url.searchParams.set('Expires', Math.ceil(expires / 1000).toString());
                url.searchParams.set('KeyName', this.#cdnKeyName);
                url.searchParams.set(
                    'Signature',
                    crypto.createHmac('sha1', this.#cdnKey).update(url.toString()).digest('base64url')
                );
            }

            return url.toString();
        }

        const pathData = this.#getPathDataByStoragePath(storagePath);
        const bucketFile = this.#storage.bucket(this.#bucketName).file(pathData.full);

        if (this.#signRequired || signUrl) {
            // Creates a signed URL to download the resource that expires in 15 minutes
            // The URL allows temporary read access to the file.
            return bucketFile
                .getSignedUrl({
                    version: 'v4',
                    action: 'read',
                    expires,
                    ...(fileName && { responseDisposition: `attachment; filename="${fileName}"` })
                })
                .then(([url]) => {
                    log.debug('retrieved signed URL', { url: url });

                    return url;
                })
                .catch(err => {
                    log.error(err, 'Error getting a signed URL from GCP');

                    throw err; // Propagate up
                });
        }

        return bucketFile.publicUrl();
    }

    // Returns Promise<Buffer>
    getContent(tenantId, storagePath) {
        const pathData = this.#getPathDataByStoragePath(storagePath);

        return this.#storage
            .bucket(this.#bucketName)
            .file(pathData.full)
            .download()
            .then(data => {
                log.debug('Downloaded data from GCP', { path: pathData });

                return data[0];
            })
            .catch(err => {
                log.error(err, 'Error downloading data from GCP');

                throw err;
            });
    }

    /**
     * @inheritDoc
     *
     * @return {Promise<ReadableStream>}
     */
    async getFileStream(tenantId, storagePath) {
        try {
            const bucket = this.#storage.bucket(this.#bucketName);
            const filePath = this.#getPathDataByStoragePath(storagePath);
            const fileRef = bucket.file(filePath.full);
            const [exists] = await fileRef.exists();
            if (!exists) {
                throw new Error(`File not found: ${filePath.full}`);
            }
            return fileRef.createReadStream();
        } catch (error) {
            log.error(error, 'Error getting file stream');
            throw new Error('Error getting file stream: ' + error.message, { cause: error });
        }
    }

    /**
     * @inheritDoc
     *
     * @return {Promise}
     */
    async moveFile(tenantId, storagePath, newStoragePath) {
        try {
            const bucket = this.#storage.bucket(this.#bucketName);
            const pathData = this.#getPathDataByStoragePath(storagePath);
            const newPath = this.#getPathDataByStoragePath(newStoragePath);
            const fileRef = bucket.file(pathData.full);
            const newFileRef = bucket.file(newPath.full);

            log.debug(
                `Moving GCS file: [${this.#bucketName}/${pathData.full}] to [${this.#bucketName}/${newPath.full}]`
            );

            await fileRef.move(newFileRef);
        } catch (error) {
            throw new Error('Error moving file: ' + error.message, { cause: error });
        }
    }

    /**
     * @inheritDoc
     *
     * @return {?string}
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

        if (path.resolve('/', normalized) !== `/${normalized}`) {
            return null;
        }

        return normalized;
    }

    #randomStoragePath(tenantId) {
        return this.#getPathData(tenantId, crypto.randomUUID());
    }

    #getPathDataByStoragePath(storagePath) {
        const ret = {
            relative: storagePath
        };

        if (!this.#hasBucketDirectory()) {
            ret.full = storagePath;
        } else {
            ret.full = `${this.#bucketDirectory}/${storagePath}`;
        }

        return ret;
    }

    #getPathData(tenantId, fileId) {
        const relative = this.#getRelativeGCPPath(tenantId, fileId);

        const ret = {
            relative: relative
        };

        if (!this.#hasBucketDirectory()) {
            ret.full = relative;
        } else {
            ret.full = `${this.#bucketDirectory}/${relative}`;
        }

        return ret;
    }

    #getRelativeGCPPath(tenantId, fileId) {
        return `${tenantId}/${fileId}`;
    }

    #hasBucketDirectory() {
        return typeof this.#bucketDirectory === 'string' && this.#bucketDirectory.length > 0;
    }
}

module.exports = GoogleCloudStorageService;
