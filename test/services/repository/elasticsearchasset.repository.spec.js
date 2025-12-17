// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const CollectionSlice = require('../../../src/domain/collectionslice.valueobject');
const ElasticsearchAssetRepository = require('../../../src/infrastructure/services/repository/elasticsearchasset.repository');

describe('ElasticsearchAssetRepository', () => {
    let elasticsearchAssetRepository;
    let loggerMock;
    let elasticsearchClientMock;
    const indexName = 'test_index';

    beforeEach(() => {
        loggerMock = {
            debug: jest.fn(),
            error: jest.fn(),
            info: jest.fn()
        };
        elasticsearchClientMock = {
            search: jest.fn(),
            count: jest.fn(),
            index: jest.fn(),
            findByVirtualPath: jest.fn()
        };

        elasticsearchAssetRepository = new ElasticsearchAssetRepository(loggerMock, elasticsearchClientMock, indexName);
    });

    describe('findByVirtualPath', () => {
        it('should return asset data if found', async () => {
            const tenantId = 'test_tenant';
            const virtualPath = '/test/path';
            const expectedAsset = {
                id: '1',
                type: 'test_type',
                virtualPath,
                creationTimestamp: '123465',
                storagePath: '/path',
                storageType: 'file',
                tenantId: 'tenant',
                driverId: 'file'
            };

            const elasticsearchResponse = {
                hits: {
                    hits: [{ _id: '1', _source: expectedAsset }]
                },
                statusCode: 200
            };
            elasticsearchClientMock.search.mockResolvedValue(elasticsearchResponse);

            const result = await elasticsearchAssetRepository.findByVirtualPath(tenantId, virtualPath);

            expect(result).toEqual(expectedAsset);
            expect(elasticsearchClientMock.search).toHaveBeenCalledWith(expect.any(Object));
        });
    });

    describe('findByVirtualFolder', () => {
        it('should return assets data if found', async () => {
            const virtualFolder = '/test/path';
            const expectedAssets = [
                {
                    id: '1',
                    type: 'test_type',
                    virtualPath: '/test/path/1.csv',
                    virtualFolder,
                    creationTimestamp: '123465',
                    storagePath: '/path/1.csv',
                    storageType: 'file',
                    tenantId: 'tenant1',
                    driverId: 'private'
                },
                {
                    id: '2',
                    type: 'test_type',
                    virtualPath: '/test/path/2.csv',
                    virtualFolder,
                    creationTimestamp: '123465',
                    storagePath: '/path/2.csv',
                    storageType: 'file',
                    tenantId: 'tenant2',
                    driverId: 'public'
                }
            ];

            const elasticsearchResponse = {
                hits: {
                    hits: [
                        { _id: '1', _source: expectedAssets[0] },
                        { _id: '2', _source: expectedAssets[1] }
                    ]
                },
                statusCode: 200
            };
            elasticsearchClientMock.search.mockResolvedValue(elasticsearchResponse);

            const result = await elasticsearchAssetRepository.findByVirtualFolder(virtualFolder);

            expect(result).toEqual(expectedAssets);
            expect(elasticsearchClientMock.search).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: {
                        query: {
                            bool: {
                                must: [
                                    {
                                        term: {
                                            virtualFolder: '/test/path'
                                        }
                                    }
                                ]
                            }
                        },
                        sort: [
                            {
                                creationTimestamp: {
                                    format: 'strict_date_optional_time_nanos',
                                    order: 'asc'
                                }
                            },
                            '_score'
                        ]
                    },
                    from: 0,
                    index: 'test_index',
                    size: 1000
                })
            );
        });

        it('should return [] if nothing found', async () => {
            const virtualFolder = '/test/path';
            const expectedAssets = [];

            const elasticsearchResponse = {
                hits: {
                    hits: []
                },
                statusCode: 200
            };
            elasticsearchClientMock.search.mockResolvedValue(elasticsearchResponse);

            const result = await elasticsearchAssetRepository.findByVirtualFolder(virtualFolder);

            expect(result).toEqual(expectedAssets);
            expect(elasticsearchClientMock.search).toHaveBeenCalledWith(expect.any(Object));
        });
    });

    describe('list', () => {
        it('should return a collection slice with assets', async () => {
            const tenantId = 'test_tenant';
            const path = '/test/path';
            const offset = 0;
            const count = 10;
            const userId = 'test_userId';
            const virtualPath = '/test/path';
            const expectedAsset = {
                id: '1',
                type: 'test_type',
                virtualPath,
                creationTimestamp: '123465',
                storagePath: '/path',
                storageType: 'file',
                tenantId: 'tenant',
                driverId: 'file'
            };
            const expectedHits = [
                { _id: '1', _source: { ...expectedAsset, id: '1' } },
                { _id: '2', _source: { ...expectedAsset, id: '2' } }
            ];

            const elasticsearchResponse = {
                hits: {
                    hits: expectedHits
                },
                statusCode: 200
            };
            elasticsearchClientMock.search.mockResolvedValue(elasticsearchResponse);

            const result = await elasticsearchAssetRepository.list(tenantId, path, offset, count, userId);

            expect(result).toBeInstanceOf(CollectionSlice);
            expect(result.collection.length).toBe(expectedHits.length);
            expect(result.pageNumber).toBe(0);
            expect(result.pageSize).toBe(count);

            expect(elasticsearchClientMock.search).toHaveBeenCalledWith(expect.any(Object));
        });
    });

    describe('listDirectories', () => {
        it('should return an array of directory paths', async () => {
            const tenantId = 'test_tenant';
            const root = '/test';
            const userId = 'test_userId';
            const folder1 = '/test/folder1';
            const folder2 = '/test/folder2';
            const expectedBuckets = [{ key: folder1 }, { key: folder2 }];

            const elasticsearchResponse = {
                aggregations: {
                    path: {
                        buckets: expectedBuckets
                    }
                },
                statusCode: 200
            };
            elasticsearchClientMock.search.mockResolvedValue(elasticsearchResponse);

            const result = await elasticsearchAssetRepository.listDirectories(tenantId, root, userId);

            expect(result).toEqual([folder1, folder2]);

            expect(elasticsearchClientMock.search).toHaveBeenCalledWith(expect.any(Object));
        });
    });

    describe('countAssets', () => {
        it('should return the count of assets', async () => {
            const tenantId = 'test_tenant';
            const root = '/test/root';
            const userId = 'test_userId';
            const expectedCount = 10;

            const elasticsearchResponse = {
                count: expectedCount,
                statusCode: 200
            };
            elasticsearchClientMock.count.mockResolvedValue(elasticsearchResponse);

            const result = await elasticsearchAssetRepository.countAssets(tenantId, root, false, userId);

            expect(result).toBe(expectedCount);

            expect(elasticsearchClientMock.count).toHaveBeenCalledWith(expect.any(Object));
        });
    });

    describe('persist', () => {
        it('should reject with an error if asset has an empty path', async () => {
            const asset = {
                tenantId: 'testTenant',
                virtualPath: ''
            };

            await expect(elasticsearchAssetRepository.persist(asset)).rejects.toThrowError(
                'Unable to persist an asset with an empty path'
            );
        });
    });
});
