// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * Creates an error with http status code and throws it
 *
 * @param {number} status - Http status code
 * @param {string} message - Error message
 */
function throwHttpError(status, message) {
    let err = new Error(message);
    err.status = status;
    throw err;
}

/**
 * Checks params object if it has all required fields described by requiredFields array
 *
 * @param {object} params params options object. It's structure is {filedName: fieldValue, ...} like {page: 1, results: 20,...}
 * @param {Array} requiredFields array of field names, that are required
 */
function checkRequiredParams(params, requiredFields) {
    if (!requiredFields || !(requiredFields instanceof Array)) {
        throw new Error('requiredFields argument is required');
    }
    if (!params) {
        throw new Error('params argument is reqiured');
    }

    let errorMesage = '';
    for (let field of requiredFields) {
        if (!params[field]) {
            errorMesage = errorMesage.concat(`Parameter [${field}] is required. `);
        }
    }

    if (errorMesage) {
        throwHttpError(400, errorMesage);
    }
}

module.exports = {
    throwHttpError,
    checkRequiredParams
};
