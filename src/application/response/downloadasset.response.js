// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const AssetResponse = require('./asset.response');

/**
 * @property {AssetResponse} asset Data for the newly-created asset.
 * @property {string} publicUrl Public URL to use for downloading the asset.
 */
class DownloadAssetResponse {
    /**
     * @typedef {import('../../../model/asset.interface.ts').Asset} Asset
     */

    /**
     * @param {Asset} asset Data for the newly-created asset.
     * @param {string} [publicUrl] Public URL to use for downloading the asset.
     */
    constructor(asset, publicUrl) {
        this.asset = new AssetResponse(asset);
        this.publicUrl = publicUrl;
        // TODO: full url?
        this.streamUrl = `files/stream/${asset.tenantId}/${asset.storagePath}`;
    }
}

module.exports = DownloadAssetResponse;
