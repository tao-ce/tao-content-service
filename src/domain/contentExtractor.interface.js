// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

class ContentExtractorInterface {
    constructor() {
        if (this.constructor === ContentExtractorInterface) {
            throw new Error('ContentExtractorInterface should not be instantiated directly');
        }
    }

    /**
     *
     * @param {string} contentType
     * @returns {boolean}
     */
    /* eslint-disable-next-line no-unused-vars */
    supports(contentType) {
        throw new Error('supports() must be overloaded by child classes');
    }

    /**
     *
     * @param {Buffer} data
     * @returns {Promise<string>}
     */
    /* eslint-disable-next-line no-unused-vars */
    async extract(data) {
        return Promise.reject(new Error('extract() must be overloaded by child classes'));
    }
}

module.exports = ContentExtractorInterface;
