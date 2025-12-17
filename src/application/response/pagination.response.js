// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * @property {number} pageNumber Number for the current page (zero-based)
 * @property {number} pageSize Items per page
 * @property {number} totalItems Total items in the collection being paginated
 * @property {number} totalPages Total pages to fetch to traverse all items
 */
class PaginationResponse {
    /**
     * @param {number} pageNumber Number for the current page (zero-based)
     * @param {number} pageSize Items per page
     * @param {number} totalItems Total items in the collection being paginated
     */
    constructor(pageNumber, pageSize, totalItems) {
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
        this.totalItems = totalItems;
        this.totalPages = Math.ceil(totalItems / pageSize);
    }
}

module.exports = PaginationResponse;
