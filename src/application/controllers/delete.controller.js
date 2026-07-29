// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const AbstractController = require('../abstractcontroller');

class DeleteController extends AbstractController {
    /**
     * @typedef {import('#application/service/upload.service.js')} UploadService
     */

    /** @type UploadService */
    #uploadService;

    /**
     * @param {UploadService} uploadService
     */
    constructor(uploadService) {
        super();

        this.#uploadService = uploadService;
    }

    async deleteFile(request, response) {
        const tenantId = this.getTenantId(request);
        if (tenantId === null) {
            this.sendBadRequest(response, 'Missing or invalid tenantId');
            return;
        }

        const virtualPath = this.getVirtualPath(request);
        if (virtualPath === null) {
            this.sendBadRequest(response, 'Missing or invalid virtual path');
            return;
        }

        try {
            const deletedAsset = await this.#uploadService.deleteAsset(tenantId, virtualPath);

            if (deletedAsset === null) {
                response.status(404).json({ error: 'Asset not found' });
                return;
            }

            response.status(200).json({ message: 'Asset deleted', id: deletedAsset.id });
        } catch (err) {
            this.sendError(response, err);
        }
    }
}

module.exports = DeleteController;
