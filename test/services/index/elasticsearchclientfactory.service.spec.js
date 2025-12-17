// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const ElasticsearchClientFactory = require('../../../src/infrastructure/services/index/elasticsearchclientfactory.service');

jest.mock('@elastic/elasticsearch');

describe('ElasticsearchClientFactory', () => {
    let elasticsearchClientFactory;

    beforeEach(() => {
        elasticsearchClientFactory = new ElasticsearchClientFactory();
    });

    describe('createClient', () => {
        it('should create a client with cloud config', () => {
            const config = {
                url: 'http://elasticsearch.test:80',
                cloud: {
                    apiKey: 'apiKey'
                },
                username: 'username',
                password: 'password' // NOSONAR
            };

            const client = elasticsearchClientFactory.createClient(config);

            expect(client).toBeDefined();
        });

        it('should create a client with node URL config', () => {
            const config = {
                url: 'http://localhost:9200',
                username: 'username',
                password: 'password' // NOSONAR
            };

            const client = elasticsearchClientFactory.createClient(config);

            expect(client).toBeDefined();
        });

        it('should throw error if config is missing required parameters', () => {
            const config = {};

            expect(() => elasticsearchClientFactory.createClient(config)).toThrow(Error);
        });
    });
});
