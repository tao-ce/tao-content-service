// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const config = {
    port: process.env.PORT || 3000,
    elasticsearch: {
        url: process.env.ELASTICSEARCH_URL || 'http://elasticsearch.docker.localhost:80',
        prefix: process.env.ELASTICSEARCH_PREFIX,
        cloud: {
            apiKey: process.env.ELASTICSEARCH_API_KEY || 'api-key'
        },
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
        syncRefresh: process.env.ELASTICSEARCH_SYNC_REFRESH || false
    }
};

module.exports = config;
