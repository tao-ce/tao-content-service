// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const AbstractController = require('../abstractcontroller');
const BrowseResponse = require('../response/browse.response');

class BrowseController extends AbstractController {
    /**
     * @typedef {import('#model/asset.interface.js')} Asset
     * @typedef {import('#domain/collectionslice.valueobject')<Asset>} AssetsCollection
     * @typedef {import('../service/browse.service')} BrowseService
     */

    /** @type BrowseService */
    #browseService;

    /**
     * @param {BrowseService} browseService
     */
    constructor(browseService) {
        super();

        this.#browseService = browseService;
    }

    list(request, response, next) {
        try {
            this.#doHandle(request, response);
        } catch (e) {
            if (e.message === 'Bad request') {
                this.sendBadRequest(e.message);

                return;
            }

            return next(e);
        }
    }

    #doHandle(request, response) {
        const tenantId = this.getTenantId(request);
        if (tenantId === null) {
            this.sendBadRequest(response, 'Missing or invalid tenantId');

            return;
        }

        const path = this.getVirtualPath(request);
        if (path === null) {
            this.sendBadRequest(response, 'Missing or invalid virtual path');

            return;
        }

        const userId = this.getUserId(request);

        const assetList = this.#browseService.listAssets(
            tenantId,
            path,
            this.getPageNumber(request) ?? 0,
            this.getPageSize(request) ?? 10,
            userId
        );

        const dirList = this.#browseService.listDirectories(tenantId, path, userId);

        Promise.all([assetList, dirList]).then(data => {
            const [assets, directories] = data;

            let countPerDirectory = {};
            let currentDirectoryAssetCount = 0;

            const retrievers = [
                this.#getCountsPerDirectory(tenantId, userId, directories).then(values => (countPerDirectory = values)),
                this.#browseService
                    .countAssets(tenantId, path, userId)
                    .then(count => (currentDirectoryAssetCount = count))
            ];

            Promise.all(retrievers).then(() => {
                response.status(200).json(new BrowseResponse(assets, currentDirectoryAssetCount, countPerDirectory));
            });
        });
    }

    /**
     * @param {string}      tenantId
     * @param {string|null} userId
     * @param {string[]}    directories
     *
     * @return {Promise<object>}
     */
    #getCountsPerDirectory(tenantId, userId, directories) {
        const retrievers = [];
        const countPerDirectory = {};

        for (const dir of directories) {
            const p = this.#browseService.countAssets(tenantId, dir, userId);

            retrievers.push(
                p.then(count => {
                    countPerDirectory[dir] = count;
                })
            );
        }

        return Promise.all(retrievers).then(() => countPerDirectory);
    }
}

module.exports = BrowseController;
