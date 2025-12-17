// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const AbstractController = require('../abstractcontroller.js');
const { getFolderPath } = require('../../infrastructure/services/util/paths.util.js');

class MoveController extends AbstractController {
    /**
     * @typedef {import('../service/move.service.js')} MoveService
     */

    /** @type MoveService */
    #moveService;

    /**
     * @param {MoveService} moveService
     */
    constructor(moveService) {
        super();

        this.#moveService = moveService;
    }

    moveFile(request, response, next) {
        try {
            this.#doMoveFile(request, response);
        } catch (err) {
            return next(err);
        }
    }

    #doMoveFile(request, response) {
        const tenantId = this.getTenantId(request);
        if (tenantId === null) {
            this.sendBadRequest(response, 'Missing or invalid tenantId');

            return;
        }

        const virtualPath = request.body.virtualPath;
        if (!virtualPath) {
            this.sendBadRequest(response, 'Missing or invalid body property: virtualPath');

            return;
        }

        const newVirtualPath = request.body.newVirtualPath;
        if (!newVirtualPath) {
            this.sendBadRequest(response, 'Missing or invalid body property: newVirtualPath');

            return;
        }

        const newStoragePath = request.body.newStoragePath;

        const newVirtualFolder = getFolderPath(newVirtualPath);

        this.#moveService
            .moveFile({ tenantId, virtualPath, newVirtualPath, newVirtualFolder, newStoragePath })
            .then(() => response.status(200).json({}))
            .catch(e => this.sendError(response, e));
    }
}

module.exports = MoveController;
