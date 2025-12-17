// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * @template T
 */
class CollectionSlice {
    /**
     * @param {T[]} collection
     * @param {number} pageNumber
     * @param {number} pageSize
     */
    constructor(collection, pageNumber, pageSize) {
        this.collection = collection;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
    }
}

module.exports = CollectionSlice;
