// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * @property {string} id Asset id.
 * @property {string} type User-provided content type ('image/jpeg', etc.)
 * @property {string} tenantId ID for the tenant an asset belongs to
 * @property {string} driverId storage driver id of the asset
 * @property {?string} userId ID for the user an asset belongs to (or null)
 * @property {string} creationTimestamp Asset creation timestamp (ISO 8601)
 * @property {string} virtualPath Public, user-provided asset full path
 * @property {string} storagePath Stored asset full path
 * @property {?object} metadata Arbitrary metadata of asset
 */
class AssetResponse {
    /**
     * @typedef {import('../../../model/asset.interface.ts').Asset} Asset
     */

    /**
     * @param {Asset} asset
     */
    constructor(asset) {
        this.id = asset.id;
        this.type = asset.type;
        this.tenantId = asset.tenantId;
        this.driverId = asset.driverId;
        this.userId = asset.userId;
        this.creationTimestamp = asset.creationTimestamp;
        this.virtualPath = asset.virtualPath;
        this.storagePath = asset.storagePath;
        this.metadata = asset.metadata;
    }

    /**
     * @param {Asset[]} assets
     */
    static fromArray(assets) {
        return assets.map(asset => new AssetResponse(asset));
    }
}

module.exports = AssetResponse;
