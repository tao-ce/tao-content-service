// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const driver = {
    type: 'object',
    properties: {
        type: { type: 'string', enum: ['gcp', 'filesystem'] },
        config: { type: 'object' }
    },
    required: ['type', 'config'],
    additionalProperties: false
};

const gcpDriverConfig = {
    type: 'object',
    properties: {
        projectId: { type: 'string' },
        bucketName: { type: 'string' },
        keyFilename: { type: 'string' },
        bucketDirectory: { type: 'string' },
        linkTtlMinutes: { type: 'number', minimum: 1 },
        cdnUrl: { type: 'string', format: 'uri' },
        cdnKey: { type: 'string' },
        cdnKeyName: { type: 'string' },
        signRequired: { type: 'boolean' }
    },
    required: ['projectId', 'bucketName'],
    additionalProperties: false
};

const filesystemDriverConfig = {
    type: 'object',
    properties: {
        rootPath: { type: 'string' },
        baseUrl: { type: 'string', format: 'uri' }
    },
    required: ['rootPath', 'baseUrl'],
    additionalProperties: false
};

module.exports = {
    schemas: {
        driver,
        gcpDriverConfig,
        filesystemDriverConfig
    }
};
