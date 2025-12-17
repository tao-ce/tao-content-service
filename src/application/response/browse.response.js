// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const AssetResponse = require('./asset.response');
const PaginationResponse = require('./pagination.response');

/**
 * @property {PaginationResponse} pagination
 * @property {Object.<string, number>} directories
 * @property {Array<AssetResponse>} assets
 */
class BrowseResponse {
    /**
     * @typedef {import('#model/asset.interface.js').Asset} Asset
     * @typedef {import('#domain/collectionslice.valueobject.js')<Asset>} AssetsCollection
     */

    /**
     * @param {AssetsCollection} assets
     * @param {number} totalItems
     * @param {object} assetCountPerDirectory
     */
    constructor(assets, totalItems, assetCountPerDirectory) {
        this.pagination = new PaginationResponse(assets.pageNumber, assets.pageSize, totalItems);
        this.directories = this.#sortByKeys(assetCountPerDirectory);
        this.assets = AssetResponse.fromArray(assets.collection);
    }

    /**
     * @param {object} initialObject
     */
    #sortByKeys(initialObject) {
        return Object.keys(initialObject)
            .sort((a, b) => a.localeCompare(b))
            .reduce((obj, key) => {
                obj[key] = initialObject[key];
                return obj;
            }, {});
    }
}

module.exports = BrowseResponse;
