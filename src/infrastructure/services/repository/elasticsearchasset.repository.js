// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const AssetRepositoryInterface = require('../../../domain/assetrepository.interface');
const CollectionSlice = require('../../../domain/collectionslice.valueobject');
const { toAsset } = require('../../../../model/asset.model');
const crypto = require('crypto');

class ElasticsearchAssetRepository extends AssetRepositoryInterface {
    /**
     * @typedef {import('#model/asset.interface.js').Asset} Asset
     * @typedef {import('@elastic/elasticsearch').Client} Client
     * @typedef {import('pino').Logger} Logger
     */

    /** @type Logger */
    #logger;

    /** @type Client */
    #elasticsearchClient;

    /** @type String */
    #indexName;

    /** @type boolean */
    #immediateRefresh;

    /**
     * @param {Logger} logger A logger instance to use
     * @param {Client} elasticsearchClient An Elasticsearch client to use
     * @param {string} indexName Name for the index
     * @param {boolean} immediateRefresh Ask ES to update indices immediately
     */
    constructor(logger, elasticsearchClient, indexName, immediateRefresh = true) {
        super();

        this.#assertIsValidIndexName(indexName);

        this.#logger = logger;
        this.#elasticsearchClient = elasticsearchClient;
        this.#indexName = indexName;
        this.#immediateRefresh = !!immediateRefresh;
    }

    findAll(tenantId, ids) {
        if (!ids?.length) {
            return Promise.resolve([]);
        }

        return this.#elasticsearchClient
            .mget({
                index: this.#indexName,
                ids
            })
            .then(hits =>
                hits.docs.map(document => (document.found ? toAsset({ id: document._id, ...document._source }) : null))
            )
            .then(assets => assets.filter(asset => asset?.tenantId === tenantId));
    }

    async find(tenantId, id) {
        return this.#elasticsearchClient
            .get({
                index: this.#indexName,
                id
            })
            .then(document => toAsset({ id: document._id, ...document._source }))
            .then(asset => (asset.tenantId === tenantId ? asset : null))
            .catch(e => {
                if (e.meta?.statusCode !== 404) {
                    throw e;
                }
                return null;
            });
    }

    /**
     * @inheritDoc
     *
     * @return {Promise<?Asset>} asset data
     */
    findByVirtualPath(tenantId, virtualPath) {
        return this.#elasticsearchClient
            .search(this.#buildSearchCommand({ tenantId, isDirectory: false, virtualPath }, { count: 1 }))
            .then(response => {
                if (response.hits?.hits.length === 0) {
                    this.#logger.debug('Entry not found');
                    return null;
                }

                const itemData = response.hits?.hits[0];

                return toAsset({
                    id: itemData._id,
                    ...itemData._source
                });
            })
            .catch(e => {
                this.#logger.error(e);
                return null;
            });
    }

    /**
     * @inheritDoc
     *
     * @return {Promise<?Asset[]>} assets data
     */
    findByVirtualFolder(virtualFolder, maxResults = 0) {
        const options = maxResults > 0 ? { count: maxResults } : {};

        return this.#elasticsearchClient
            .search(this.#buildSearchCommand({ virtualFolder }, options))
            .then(response => {
                this.#logger.debug(
                    `[es] findByVirtualFolder: found ${response.hits?.hits?.length} assets (max: ${maxResults}) in virtualFolder: ${virtualFolder}`
                );

                if (!response.hits?.hits?.length) {
                    return [];
                }

                return response.hits.hits.map(itemData =>
                    toAsset({
                        id: itemData._id,
                        ...itemData._source
                    })
                );
            })
            .catch(e => {
                this.#logger.error(e);
                return [];
            });
    }

    /**
     * @inheritDoc
     *
     * @return {Promise<CollectionSlice<Asset>>}
     */
    list(tenantId, path, offset, count, userId) {
        // @todo Watch out the ES pagination limit (we'd need to use the scroll
        //       API if we want to list more than 10K assets from a single
        //       directory)

        if (path.indexOf('//') !== -1) {
            this.#logger.debug(`Requested an invalid path (double slashes): ${path}`);

            return Promise.resolve(new CollectionSlice([], 0, 0));
        }

        const query = this.#buildSearchCommand(
            { tenantId, isDirectory: true, virtualPath: path, userId },
            { offset, count }
        );

        return this.#elasticsearchClient
            .search(query)
            .then(response => {
                return new CollectionSlice(
                    response.hits?.hits.map(itemData =>
                        toAsset({
                            id: itemData._id,
                            ...itemData._source
                        })
                    ),
                    Math.floor(offset / count),
                    count
                );
            })
            .catch(e => {
                this.#logger.error(e);
                return null;
            });
    }

    /**
     * @inheritDoc
     *
     * @return {Promise<string[]>}
     */
    listDirectories(tenantId, root, userId) {
        /** @type Array<object> */
        const mustClauses = [
            { term: { tenantId } },
            {
                prefix: {
                    virtualFolder: root.length > 0 ? `${root}/` : ''
                }
            }
        ];

        if (userId !== null) {
            mustClauses.push({ term: { userId } });
        }

        const query = {
            index: this.#indexName,
            body: {
                aggs: {
                    path: {
                        terms: {
                            field: 'virtualFolder',
                            size: 10000
                        }
                    }
                },
                query: {
                    bool: {
                        must: mustClauses
                    }
                },
                size: 0
            }
        };

        return this.#elasticsearchClient
            .search(query)
            .then(response => {
                if ('path' in response.aggregations) {
                    const buckets = response.aggregations.path.buckets;

                    return buckets.map(item => item.key).filter(p => p !== root);
                }
            })
            .catch(e => {
                this.#logger.error(e);
                return null;
            });
    }

    /**
     * @inheritDoc
     *
     * @return {Promise<?number>} Number of assets
     */
    countAssets(tenantId, root, recurse, userId) {
        if (root.indexOf('//') !== -1) {
            this.#logger.debug(`Requested an invalid path (double slashes): ${root}`);

            return Promise.resolve(new CollectionSlice([], 0, 0));
        }

        const query = this.#buildCountCommand(tenantId, { virtualPath: root, userId }, false);

        return this.#elasticsearchClient
            .count(query)
            .then(response => {
                return response.count || 0;
            })
            .catch(e => {
                this.#logger.error(e);
                return null;
            });
    }

    /**
     * @inheritDoc
     *
     * @return {Promise<Asset>}
     */
    persist(asset) {
        // Do not allow reusing the same virtual path for two assets
        // under the same tenant
        //
        const tenantId = asset['tenantId'];
        const path = asset['virtualPath']?.trim();
        const hasId = typeof asset.id !== 'undefined' && asset.id.length > 0;
        const theId = hasId ? asset.id : crypto.randomUUID();

        if (path.length === 0) {
            return new Promise((_resolve, reject) =>
                reject(new Error('Unable to persist an asset with an empty path'))
            );
        }

        return this.findByVirtualPath(tenantId, path).then(existingAsset => {
            if (existingAsset === null || existingAsset.id === theId) {
                // Create a new document or update the existing one
                return this.#doPersist(theId, asset);
            } else {
                throw new Error(`The provided path "${path}" is already in use for this tenant`);
            }
        });
    }

    /**
     * Builds an object to be used in an Elasticsearch count request.
     *
     * If recurse is set, the query is built using a prefix clause so that it
     * wll count all assets on the given virtual path and its descendants;
     * otherwise it will use a term query against the path in order to count
     * only the assets located in the given root (i.e. ignoring child folders).
     */
    #buildCountCommand(tenantId, terms, recurse) {
        const { virtualPath, userId } = terms;

        /** @type object */
        const mustClauses = [{ term: { tenantId } }];

        if (recurse) {
            mustClauses.push({
                prefix: {
                    virtualFolder: virtualPath.length > 0 ? `${virtualPath}/` : ''
                }
            });
        } else {
            mustClauses.push({
                term: { virtualFolder: virtualPath }
            });
        }

        if (userId !== null) {
            mustClauses.push({
                term: { userId }
            });
        }

        // @todo Shall this be filter clauses instead?
        //       (i.e. we don't need the score)

        return {
            index: this.#indexName,
            body: {
                query: {
                    bool: { must: mustClauses }
                }
            }
        };
    }

    /**
     * Builds an object representing an Elasticsearch search query.
     *
     * If isDirectory is set, the query is built against the virtualFolder,
     * otherwise it uses a term query against the full file path (i.e. folder
     * and filename).
     *
     * @param {object} terms
     * @param {string} [terms.tenantId] ID of the tenant to list assets for
     * @param {boolean} [terms.isDirectory] Whether the path is a directory name
     * @param {string} [terms.virtualPath] Virtual directory containing the assets
     * @param {string} [terms.virtualFolder] Virtual directory containing the assets
     * @param {string} [terms.storagePath] Real path to file(s)
     * @param {?string} [terms.userId] If given, include only assets from this user
     * @param {object} options
     * @param {number} [options.offset] Offset for the first result to return
     * @param {number} [options.count]  Max number of results to return
     *
     * @return {Object} Elasticsearch query as a plain object
     */
    #buildSearchCommand(terms = {}, options = {}) {
        const { tenantId, isDirectory = false, virtualPath, virtualFolder, storagePath, userId } = terms;
        const { offset = 0, count = 1000 } = options;

        // @todo Shall this be filter clauses instead?
        //       (i.e. we don't really need the score)

        /** @type Array<object> */
        const mustClauses = [];

        if (tenantId) {
            mustClauses.push({
                term: { tenantId }
            });
        }

        if (virtualPath) {
            mustClauses.push({
                term: isDirectory ? { virtualFolder: virtualPath } : { virtualPath }
            });
        }

        if (virtualFolder) {
            mustClauses.push({
                term: { virtualFolder }
            });
        }

        if (storagePath) {
            mustClauses.push({
                prefix: { storagePath }
            });
        }

        if (userId) {
            mustClauses.push({
                term: { userId }
            });
        }

        if (!mustClauses.length) {
            throw new Error('Query aborted because no search terms provided');
        }
        this.#logger.debug('buildSearchCommand mustClauses: %o', mustClauses);

        return {
            index: this.#indexName,
            body: {
                query: {
                    bool: {
                        must: mustClauses
                    }
                },
                sort: [
                    {
                        creationTimestamp: {
                            order: 'asc',
                            format: 'strict_date_optional_time_nanos'
                        }
                    },
                    '_score'
                ]
            },
            from: offset,
            size: count
        };
    }

    /**
     * Creates or updates the document associated with a given asset.
     *
     * @param {string} assetId ID of the asset being persisted
     * @param {Asset} asset Instance of the asset being persisted
     *
     * @return {Promise<Asset>} A promise resolving to the persisted asset
     */
    #doPersist(assetId, asset) {
        const values = this.#getValuesFromAssetInstance(asset);
        const indexCommand = {
            index: this.#indexName,
            refresh: this.#immediateRefresh,
            id: assetId,
            document: values
        };

        return new Promise((resolve, reject) => {
            this.#elasticsearchClient
                .index(indexCommand)
                .then(response => {
                    this.#logger.info('Stored data for a new asset in Elasticsearch');

                    resolve(
                        toAsset({
                            id: response._id,
                            ...values
                        })
                    );
                })
                .catch(e => {
                    this.#logger.error('Error indexing document');
                    this.#logger.error(e);
                    reject(new Error('Error indexing document'));
                });
        });
    }

    /**
     * Returns a plain object holding the values for the passed asset instance
     * and suitable for being used in the JSON body of an Elasticsearch request
     * to create or update a document.
     *
     * @param {Asset} asset Instance of the asset being persisted
     *
     * @return {Object} POJO to use in Elasticsearch requests
     */
    #getValuesFromAssetInstance(asset) {
        let userId = null;

        if ('userId' in asset) {
            userId = asset['userId'];
        }

        return {
            tenantId: asset['tenantId'],
            userId: userId,
            type: asset['type'],
            virtualPath: asset['virtualPath'],
            virtualFolder: asset['virtualFolder'],
            storagePath: asset['storagePath'],
            storageType: asset['storageType'],
            driverId: asset['driverId'],
            creationTimestamp: asset['creationTimestamp'],
            extractedContentStoragePath: asset['extractedContentStoragePath'],
            metadata: asset['metadata']
        };
    }

    #assertIsValidIndexName(name) {
        if (typeof name !== 'string' || name.trim().length === 0 || !/^[$_A-Za-z][0-9A-Za-z$_-]*$/.test(name)) {
            throw new Error(`Invalid index name: ${name}`);
        }
    }
}

module.exports = ElasticsearchAssetRepository;
