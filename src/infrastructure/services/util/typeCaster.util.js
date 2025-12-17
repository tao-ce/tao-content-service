// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * @param {*} value
 * @param {*} [defaultValue=false]
 * @returns {boolean}
 */
function toBoolean(value, defaultValue = false) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return ['true', '1'].includes(value.toLowerCase().trim());
    }

    return defaultValue;
}

module.exports = {
    toBoolean
};
