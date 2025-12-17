// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const validationConfig = require('./validation.config');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const driverTypes = Object.freeze({
    GCP: 'gcp',
    FILESYSTEM: 'filesystem'
});

const defaultDriverValues = Object.freeze({
    [driverTypes.GCP]: {
        bucketDirectory: 'content-service',
        linkTtlMinutes: 10,
        signRequired: true
    },
    [driverTypes.FILESYSTEM]: {
        rootPath: '/',
        baseUrl: 'http://content-be.ngs.test:80'
    }
});

let drivers;

try {
    drivers = JSON.parse(process.env.DRIVERS || '{}');
} catch (error) {
    throw new Error(`Failed to parse DRIVERS environment variable: ${error.message}`);
}

for (const driverId in drivers) {
    const { type, config } = drivers[driverId];

    if (!ajv.validate(validationConfig.schemas.driver, { type, config })) {
        throw new Error(`Driver "${driverId}" is not valid: ${ajv.errorsText(ajv.errors)}`);
    }

    drivers[driverId].config = { ...defaultDriverValues[type], ...config };
    const { cdnKey, cdnKeyName } = drivers[driverId].config;

    if (cdnKey) {
        drivers[driverId].config.cdnKey = process.env[cdnKey] || cdnKey;
    }

    if (cdnKeyName) {
        drivers[driverId].config.cdnKeyName = process.env[cdnKeyName] || cdnKeyName;
    }

    let driverConfigValidationResult;

    if (type === driverTypes.GCP) {
        driverConfigValidationResult = ajv.validate(validationConfig.schemas.gcpDriverConfig, drivers[driverId].config);
    } else if (type === driverTypes.FILESYSTEM) {
        driverConfigValidationResult = ajv.validate(
            validationConfig.schemas.filesystemDriverConfig,
            drivers[driverId].config
        );
    }

    if (!driverConfigValidationResult) {
        throw new Error(`Invalid configuration for driver "${driverId}": ${ajv.errorsText(ajv.errors)}`);
    }
}

const config = {
    defaultDriver: process.env.DEFAULT_DRIVER || 'private',
    drivers,
    maxUploadSize: Number.parseInt(process.env.MAX_UPLOAD_SIZE || '25000000')
};

module.exports = {
    driverTypes,
    config
};
