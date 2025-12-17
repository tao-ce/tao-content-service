// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const FileStorageService = require('./filestorage.service');
const GoogleCloudStorageService = require('./googlecloudstorage.service');
const storageConfig = require('../../configs/storage.config');

/**
 * @param {object} params
 * @param {string} [params.driverId]
 * @returns {import('#domain/storagedriver.interface.js')}
 */
function createStorageDriver({ driverId = storageConfig.config.defaultDriver } = {}) {
    const driver = storageConfig.config.drivers[driverId];

    if (!driver) {
        throw new Error(`Driver ${driverId} not supported`);
    }
    driver.id = driverId;

    if (driver.type === storageConfig.driverTypes.FILESYSTEM) {
        return new FileStorageService({ driver });
    }

    if (driver.type === storageConfig.driverTypes.GCP) {
        return new GoogleCloudStorageService({ driver });
    }

    throw new Error(`Unknown storage type: '${driver.type}'`);
}

module.exports = {
    createStorageDriver
};
