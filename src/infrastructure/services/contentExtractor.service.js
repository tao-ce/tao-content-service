// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

class ContentExtractorService {
    /**
     * @typedef {import('#domain/contentExtractor.interface.js')} ContentExtractorInterface
     */

    /** @type {ContentExtractorInterface[]} */
    #contentExtractors;

    /**
     * @param {ContentExtractorInterface[]} contentExtractors
     */
    constructor(contentExtractors) {
        this.#contentExtractors = contentExtractors;
    }

    /**
     * @returns {Promise<string>}
     */
    async extract(contentType, data) {
        for (let extractor of this.#contentExtractors) {
            if (extractor.supports(contentType)) {
                return await extractor.extract(data);
            }
        }

        throw new Error(`No content extractor found for content type: ${contentType}`);
    }
}

module.exports = ContentExtractorService;
