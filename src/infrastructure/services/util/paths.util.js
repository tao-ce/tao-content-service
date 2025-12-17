// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * Returns the part of a virtual filepath that corresponds to the folder path.
 * @param {string} fullPath Full file path to get the folder path for
 * @param {Boolean} [preserveSlashes] if true, do not discard leading or trailing slash
 * @return {string} The folder path, empty string for paths with no folder prefix
 */
function getFolderPath(fullPath, preserveSlashes = false) {
    const parts = fullPath.trim().split('/');
    if (parts.length > 1) {
        return parts
            .slice(0, -1)
            .filter(e => e !== '' || preserveSlashes)
            .join('/');
    }
    return '';
}

module.exports = {
    getFolderPath
};
