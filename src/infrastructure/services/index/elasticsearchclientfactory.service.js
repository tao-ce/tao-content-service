// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2024 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { Client } = require('@elastic/elasticsearch');

class ElasticsearchClientFactory {
    /**
     * @return {Client}
     */
    createClient(config) {
        const params = {};

        if (this.#hasValue(config, 'cloud') && this.#hasStringValue(config.cloud, 'apiKey')) {
            params['auth'] = {
                apiKey: config.cloud.apiKey
            };
        } else if (this.#hasStringValue(config, 'username') && this.#hasStringValue(config, 'password')) {
            params['auth'] = {
                username: config.username.trim(),
                password: config.password.trim()
            };
        }

        if (this.#hasStringValue(config, 'url')) {
            params['node'] = config.url.trim();
        } else if (this.#hasStringValue(config.cloud, 'id')) {
            params['cloud'] = {
                id: config.cloud.id.trim()
            };
        }

        if (!params['auth'] || (!params['node'] && !params['cloud'])) {
            throw new Error('Elasticsearch config missing one of auth or node/cloud parameters.');
        }

        return new Client(params);
    }

    /**
     * @param {object} config
     * @param {string} key
     * @return boolean
     */
    #hasValue(config, key) {
        return key in config && typeof config[key] !== 'undefined';
    }

    #hasStringValue(config, key) {
        return this.#hasValue(config, key) && config[key].trim().length > 0;
    }
}

module.exports = ElasticsearchClientFactory;
