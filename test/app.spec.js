// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('../src/infrastructure/services/logger.service', () => ({
    log: {
        info: jest.fn(),
        error: jest.fn()
    }
}));
const { log } = require('../src/infrastructure/services/logger.service');

jest.mock('../src/infrastructure/configs/storage.config.js', () => {
    const storageConfig = jest.requireActual('../src/infrastructure/configs/storage.config.js');
    const path2 = jest.requireActual('path');
    return {
        ...storageConfig,
        config: {
            ...storageConfig.config,
            drivers: {
                file: {
                    type: storageConfig.driverTypes.FILESYSTEM,
                    config: {
                        rootPath: path2.resolve('storage'),
                        baseUrl: 'http://test.example.com'
                    }
                }
            }
        }
    };
});

const path = require('path');
const fs = require('fs');
const request = require('supertest');
const assert = require('assert');

describe('Health query', () => {
    it('requests elastic search', async () => {
        const app = require('../src/app.js');
        await request(app)
            .get(`/api/v1/health`)
            .expect(200)
            .then(response => assert(response.status, 'ok'));
    });
});

describe('Static server', () => {
    it('starts static server if there is a filesystem-type driver', async () => {
        const storageRootPath = path.resolve('storage');
        const testCsvFilePath = path.resolve(storageRootPath, 'test.csv');
        await fs.promises.writeFile(testCsvFilePath, 'this,is,a,test');

        const app = require('../src/app.js');
        await request(app)
            .get(`/storage/test.csv?filename=foo.txt`)
            .expect(200)
            .then(response => {
                expect(response.text).toBe('this,is,a,test');
                expect(response.headers['content-type']).toBe('text/csv; charset=UTF-8');
                expect(response.headers['content-disposition']).toBe('attachment; filename=foo.txt');
                expect(log.info.mock.calls[0][0]).toBe('Static server: filesystem path [%s] mounted at [%s]');
                return fs.promises.unlink(testCsvFilePath);
            });
    });
});
