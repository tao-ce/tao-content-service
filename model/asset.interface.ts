// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * Data in the Elasticsearch index for an asset
 */
export interface Asset {
    /**
     * Asset creation time as an ISO 8601 timestamp
     */
    creationTimestamp: string;
    /**
     * Storage driver-specific pathname for extracted content (GPC path, local file path, etc)
     */
    extractedContentStoragePath?: string;
    /**
     * Internal ID exposed by the API. This is NOT the _id automatically created by ES
     */
    id: string;
    /**
     * Storage driver-specific pathname (GPC path, local file path, etc)
     */
    storagePath: string;
    /**
     * Storage driver id used for storing the asset data. Must be an id used in the app's drivers config.
     */
    driverId?: string;
    /**
     * Storage driver to use for storing the asset data. Currently-supported values: 'file' or
     * 'gcp'
     */
    storageType: StorageType | string;
    tags?: string[];
    /**
     * Identifies the tenant an asset belongs to. This is an arbitrary string
     */
    tenantId: string;
    /**
     * User-provided content type (such as 'image/jpeg' or 'application/json')
     */
    type: string;
    /**
     * Identifies the user an asset belongs to. This is an arbitrary string
     */
    userId?: string;
    /**
     * Part of the virtualPath associated to the folder (used for listings)
     */
    virtualFolder?: string;
    /**
     * Public, user-provided full path for the asset
     */
    virtualPath: string;
    [property: string]: any;
}

/**
 * Storage driver to use for storing the asset data. Currently-supported values: 'file' or
 * 'gcp'
 */
export enum StorageType {
    File = 'file',
    Gcp = 'gcp'
}
