// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { log } = require('console');
const AbstractController = require('../abstractcontroller');

class ContentController extends AbstractController {
    /**
     * @typedef {import('#application/service/content.service.js')} ContentService
     */

    /** @type ContentService */
    #contentService;

    /**
     * @param {ContentService} contentService
     */
    constructor(contentService) {
        super();

        this.#contentService = contentService;
    }

    async getItemContent(request, response, next) {
        try {
            await this.#doHandle(request, response);
        } catch (e) {
            if (e.message === 'Bad request') {
                this.sendBadRequest(e.message);
                return;
            }

            return next(e);
        }
    }

    async #doHandle(request, response) {
        const tenantId = this.getTenantId(request);

        if (tenantId === null) {
            this.sendBadRequest(response, 'Missing or invalid tenantId');

            return;
        }

        if (tenantId !== request.token.tenant_id) {
            this.sendAuthorizationError(response, 'You are not allowed to access this tenant');

            return;
        }

        let deliveryId;

        if (this.isEmptyDeliveryId(request)) {
            this.sendBadRequest(response, 'Missing or invalid DeliveryId');

            return;
        } else {
            deliveryId = this.getDeliveryId(request);

            if (deliveryId === null) {
                this.sendBadRequest(response, 'Invalid deliveryId');

                return;
            }
        }

        let itemPath;
        if (this.isEmptyItemPath(request)) {
            this.sendBadRequest(response, 'Missing or invalid ItemId');

            return;
        } else {
            itemPath = this.getItemPath(request);

            if (itemPath === null) {
                this.sendBadRequest(response, 'Invalid ItemId');

                return;
            }
        }

        const { driverId } = request.query || {};

        try {
            const content = await this.#contentService.getContent({
                tenantId,
                virtualPath: `${deliveryId}/${itemPath}`,
                driverId
            });
            const contentJson = JSON.parse(content.toString('utf-8'));
            response.status(200).json(contentJson);
        } catch (e) {
            log(e);
            this.sendError(response, e);
        }
    }
}

module.exports = ContentController;
