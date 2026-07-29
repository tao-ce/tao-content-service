// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { log } = require('../infrastructure/services/logger.service');

class AbstractController {
    /**
     * @typedef {import('pino').Logger} Logger
     */

    /** @type Logger */
    logger;

    constructor() {
        if (this.constructor === AbstractController) {
            throw new Error('AbstractController should not be instantiated directly');
        }

        this.logger = log;
    }

    hasContentType(request) {
        return 'content-type' in request.headers && request.headers['content-type'].toString().trim().length > 0;
    }

    getUserIdHeader(request) {
        if (!('x-userid' in request.headers) || request.headers['x-userid'].toString().trim().length === 0) {
            return null;
        }

        const strValue = request.headers['x-userid'].toString();

        return strValue.trim() === strValue ? strValue : null;
    }

    /**
     * Returns metadata header as JSON string.
     *
     * @param {import('express').Request} request
     * @returns {string|null}
     */
    getMetadataHeader(request) {
        return request.get('x-metadata')?.trim() || null;
    }

    getTenantId(request) {
        if (!('tenantId' in request.params) || request.params['tenantId'].toString().trim().length === 0) {
            return null;
        }

        const strValue = request.params['tenantId'].toString();

        return strValue.trim() === strValue ? strValue : null;
    }

    getUserId(request) {
        if (!('userId' in request.query) || request.query['userId'].toString().trim().length === 0) {
            return null;
        }

        const strValue = request.query['userId'].toString();

        return strValue.trim() === strValue ? strValue : null;
    }

    getPageNumber(request) {
        if (!('page' in request.query) || request.query['page'].toString().trim().length === 0) {
            return null;
        }

        return this.#asInteger(request.query['page'].toString().trim());
    }

    getPageSize(request) {
        if (!('size' in request.query) || request.query['size'].toString().trim().length === 0) {
            return null;
        }

        return this.#asInteger(request.query['size'].toString().trim());
    }

    /**
     * @return {?number|null}
     */
    #asInteger(strValue) {
        const intValue = Number.parseInt(strValue);

        if (isNaN(intValue)) {
            return null;
        }

        return intValue.toString().trim() === strValue ? intValue : null;
    }

    isRedirectRequested(request) {
        return 'redirect' in request.query && request.query['redirect'].toString().trim() === 'true';
    }

    isEmptyVirtualPath(request) {
        return !('virtualPath' in request.params) || request.params['virtualPath'].length === 0;
    }

    isEmptyVirtualFolder(request) {
        return !('virtualFolder' in request.params) || request.params['virtualFolder'].length === 0;
    }

    isEmptyStoragePath(request) {
        return !('storagePath' in request.params) || request.params['storagePath'].length === 0;
    }

    isEmptyDeliveryId(request) {
        return !('deliveryId' in request.params) || request.params['deliveryId'].toString().trim().length === 0;
    }

    isEmptyItemPath(request) {
        return !('itemPath' in request.params) || request.params['itemPath'].toString().trim().length === 0;
    }

    getDeliveryId(request) {
        if (this.isEmptyDeliveryId(request)) {
            return null;
        }

        const strValue = request.params['deliveryId'];

        return strValue.toString().trim() === strValue ? strValue : null;
    }

    getItemPath(request) {
        if (this.isEmptyItemPath(request)) {
            return null;
        }

        const strValue = request.params['itemPath'];

        return strValue.toString().trim() === strValue ? strValue : null;
    }

    getVirtualPath(request) {
        if (this.isEmptyVirtualPath(request)) {
            return null;
        }
        return this.#validatePathString(request.params['virtualPath']);
    }

    getVirtualFolder(request) {
        if (this.isEmptyVirtualFolder(request)) {
            return null;
        }
        return this.#validatePathString(request.params['virtualFolder']);
    }

    getStoragePath(request) {
        if (this.isEmptyStoragePath(request)) {
            return null;
        }
        return this.#validatePathString(request.params['storagePath']);
    }

    sendError(response, err) {
        response.status(500).json({
            error: err.toString()
        });
    }

    sendBadRequest(response, message) {
        response.status(400).json({
            message: message
        });
    }

    sendAuthorizationError(response, message) {
        response.status(403).json({
            message: message
        });
    }

    #validatePathString(strValue) {
        // Virtual paths cannot start nor end with slashes since
        //
        // (1) they are already appended the tenantId, and
        // (2) they represent filenames, not directories
        //
        // This also avoids confusions in case of errors.
        //
        // This means, "img/file.jpg is a valid path (corresponds to
        // http://base.url/someassetdir/img.file.jpg depending on
        // the particular driver config) but:
        //
        // - "/img/file.jpg isn't: Double slash,
        //    http://host.url/dir//img/file.jpg"
        // - "img/file.jpg/ isn't: Can be confused with a directory name
        //    http://host.url/dir/img/file.jpg/"
        //
        if (strValue.substring(0, 0) === '/' || strValue.substring(strValue.length - 1) === '/') {
            return null;
        }

        // Paths cannot contain empty folder names (i.e. "//").
        //
        if (strValue.indexOf('//') !== -1) {
            return null;
        }

        // Paths cannot start nor end with whitespaces
        // to avoid confusion in case of errors
        //
        return strValue.toString().trim() === strValue ? strValue : null;
    }
}

module.exports = AbstractController;
