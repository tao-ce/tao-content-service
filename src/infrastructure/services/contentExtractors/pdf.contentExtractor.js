// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const ContentExtractorInterface = require('../../../domain/contentExtractor.interface');

class PdfContentExtractor extends ContentExtractorInterface {
    /**
     * @typedef {import('pdf-parse')} pdf
     */

    /** @type pdf */
    #pdfParser;

    /**
     * @param {pdf} pdfParser
     */
    constructor(pdfParser) {
        super();

        this.#pdfParser = pdfParser;
    }

    supports(contentType) {
        return contentType === 'application/pdf';
    }

    async extract(data) {
        const { text } = await this.#pdfParser(data);

        return text;
    }
}

module.exports = PdfContentExtractor;
