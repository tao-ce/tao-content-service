// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { Readable } = require('stream');
const BinaryBodyReaderService = require('../../../src/infrastructure/services/http/binarybodyreader.service');

describe('BinaryBodyReaderService', () => {
    let binaryBodyReaderService;

    beforeEach(() => {
        binaryBodyReaderService = new BinaryBodyReaderService();
    });

    it('should read binary data from a request stream', async () => {
        const testData = 'test test';
        const requestStream = new Readable();
        requestStream.push(testData);
        requestStream.push(null);

        const result = await binaryBodyReaderService.readFromRequest(requestStream);

        expect(result instanceof Buffer).toBe(true);
        expect(result.toString()).toBe(testData);
    });

    it('should handle error events from the request stream', async () => {
        const requestStream = Readable.from([]);

        const errorPromise = new Promise((resolve, reject) => {
            requestStream.on('error', error => {
                reject(error);
            });
        });

        const expectedError = new Error('Test error');
        setTimeout(() => {
            requestStream.emit('error', expectedError);
        }, 100);

        await expect(errorPromise).rejects.toThrow(expectedError);
    });
});
