// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const config = require('../configs/general.config');

const prefix = config.elasticsearch.prefix;
const apiKey = config.elasticsearch.cloud.apiKey;
const url = config.elasticsearch.url;

module.exports = {
    url,
    indexes: {
        asset: () => {
            return {
                index: `${prefix || ''}asset`,
                multiTenant: true,
                hierarchyBased: true,
                description: 'Holds information about the assets',
                internal: true
            };
        }
    },
    prefix: prefix || '',
    apiKey: apiKey || '',
    maxSize: 5000
};
