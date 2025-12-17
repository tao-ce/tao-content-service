// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { Buffer } = require('node:buffer');

class BinaryBodyReaderService {
    /**
     * @return {Promise<Buffer>}
     */
    readFromRequest(request) {
        /**
         * Holds the user-provided POST payload.
         *
         * Note the upload contains arbitrary data of any kind,
         * and we should not try to parse it.
         *
         * @type {Buffer}
         */
        let body = Buffer.alloc(0);

        return new Promise((resolve, reject) => {
            request.on('data', chunk => {
                body = Buffer.concat([body, chunk]);
            });

            request.on('error', e => {
                reject(e instanceof Error ? e : new Error(String(e)));
            });

            request.on('end', () => resolve(body));
        });
    }
}

module.exports = BinaryBodyReaderService;
