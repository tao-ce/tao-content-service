// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const fs = require('fs');
const FileStorageService = require('../../../src/infrastructure/services/storage/filestorage.service');
const { Readable, PassThrough } = require('node:stream');

// Mock logger used by implementation
jest.mock('../../../src/infrastructure/services/logger.service', () => ({
    log: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }
}));
const { log } = require('../../../src/infrastructure/services/logger.service');

// Mock fs module in a controlled way
jest.mock('fs', () => {
    const orig = jest.requireActual('fs');
    return {
        ...orig,
        createReadStream: jest.fn(),
        createWriteStream: jest.fn(),
        readFileSync: jest.fn(),
        promises: {
            stat: jest.fn(),
            mkdir: jest.fn(),
            rename: jest.fn(),
            unlink: jest.fn()
        }
    };
});

// Mock crypto
jest.mock('crypto', () => {
    const real = jest.requireActual('crypto');
    return {
        ...real,
        randomUUID: jest.fn(() => 'uuid-1')
    };
});

describe('FileStorageService', () => {
    const baseDriver = { config: { rootPath: '/root', baseUrl: 'http://example.com' } };
    const buildService = (overrides = {}) =>
        new FileStorageService({ driver: { config: { ...baseDriver.config, ...overrides } } });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getName returns file', () => {
        const svc = buildService();
        expect(svc.getName()).toBe('file');
    });

    describe('store', () => {
        it('writes file after ensuring directory exists and returns id', async () => {
            const svc = buildService();

            fs.promises.stat.mockResolvedValue({ isDirectory: () => true });

            const writeStream = {
                end: jest.fn(),
                on: jest.fn((event, handler) => {
                    if (event === 'finish') {
                        handler();
                    }
                    return writeStream;
                })
            };
            fs.createWriteStream.mockReturnValue(writeStream);

            const id = await svc.store({ tenantId: 'tenant', data: Buffer.from('data') });

            expect(id).toBe('uuid-1');
            expect(fs.promises.stat).toHaveBeenCalledWith('/root/tenant');
            expect(fs.createWriteStream).toHaveBeenCalledWith('/root/tenant/uuid-1');
            expect(writeStream.end).toHaveBeenCalledWith(Buffer.from('data'));
            expect(log.debug).toHaveBeenCalledWith('Data written to [%s]', '/root/tenant/uuid-1');
        });

        it('creates directory when stat fails and then writes', async () => {
            const svc = buildService();

            fs.promises.stat.mockRejectedValue(Object.assign(new Error('no dir'), { code: 'ENOENT' }));
            fs.promises.mkdir.mockResolvedValue();

            const writeStream = {
                end: jest.fn(),
                on: jest.fn((event, handler) => {
                    if (event === 'finish') {
                        handler();
                    }
                    return writeStream;
                })
            };
            fs.createWriteStream.mockReturnValue(writeStream);

            const id = await svc.store({ tenantId: 'tenant', data: 'x' });
            expect(id).toBe('uuid-1');
            expect(fs.promises.mkdir).toHaveBeenCalledWith('/root/tenant', { recursive: true });
        });

        it('logs and rejects when write returns error', async () => {
            const svc = buildService();
            fs.promises.stat.mockResolvedValue({ isDirectory: () => true });

            const writeStream = {
                end: jest.fn(),
                on: jest.fn((event, handler) => {
                    if (event === 'error') {
                        handler(new Error('disk full'));
                    }
                    return writeStream;
                })
            };
            fs.createWriteStream.mockReturnValue(writeStream);

            await expect(svc.store({ tenantId: 'tenant', data: 'x' })).rejects.toThrow(
                'Failed to write data: disk full'
            );
            expect(log.error).toHaveBeenCalledWith(expect.any(Error), 'Error writing data');
        });

        it('wraps and rethrows errors from ensureDirectoryExists (mkdir fails)', async () => {
            const svc = buildService();
            // Cause ensureDirectoryExists to attempt mkdir and fail
            fs.promises.stat.mockRejectedValue(Object.assign(new Error('not found'), { code: 'ENOENT' }));
            fs.promises.mkdir.mockRejectedValue(new Error('mkdir fail'));

            await expect(svc.store({ tenantId: 'tenant', data: 'x' })).rejects.toThrow(
                'Error storing data: mkdir fail'
            );
            expect(log.error).toHaveBeenCalledWith(expect.any(Error), 'Got error storing data');
            expect(fs.createWriteStream).not.toHaveBeenCalled();
        });

        it('stores data as stream', async () => {
            const svc = buildService();

            fs.promises.stat.mockResolvedValue({ isDirectory: () => true });

            const writeStream = new PassThrough();
            let writtedData = '';
            writeStream.on('data', chunk => {
                writtedData += chunk.toString();
            });

            fs.createWriteStream.mockReturnValue(writeStream);

            const request = Readable.from([Buffer.from('text 1'), Buffer.from(' '), Buffer.from('text 2')]);
            const id = await svc.store({ tenantId: 'tenant', data: request });

            expect(id).toBe('uuid-1');
            expect(writtedData).toBe('text 1 text 2');
            expect(fs.promises.stat).toHaveBeenCalledWith('/root/tenant');
            expect(fs.createWriteStream).toHaveBeenCalledWith('/root/tenant/uuid-1');
            expect(log.debug).toHaveBeenCalledWith('Data written to [%s]', '/root/tenant/uuid-1');
        });
    });

    describe('getPublicUrl', () => {
        it('builds URL from base and path', async () => {
            const svc = buildService();
            const url = await svc.getPublicUrl({ tenantId: 't1', storagePath: 'p1' });
            expect(url).toBe('http://example.com/t1/p1');
        });

        it('builds URL from base and path and fileName', async () => {
            const svc = buildService();
            const url = await svc.getPublicUrl({ tenantId: 't1', storagePath: 'p1', fileName: 'foo.txt' });
            expect(url).toBe('http://example.com/t1/p1?filename=foo.txt');
        });
    });

    describe('getContent', () => {
        it('returns buffer content', async () => {
            const svc = buildService();
            fs.readFileSync.mockReturnValue(Buffer.from('abc'));
            const data = await svc.getContent('t1', 'f1');
            expect(fs.readFileSync).toHaveBeenCalledWith('/root/t1/f1');
            expect(data).toEqual(Buffer.from('abc'));
        });

        it('rejects when readFileSync throws', async () => {
            const svc = buildService();
            fs.readFileSync.mockImplementation(() => {
                throw new Error('read fail');
            });
            await expect(svc.getContent('t1', 'f1')).rejects.toThrow('read fail');
        });
    });

    describe('getFileStream', () => {
        it('returns stream from path', async () => {
            const svc = buildService();
            fs.createReadStream.mockImplementation(path => `stream of ${path}`);
            const data = await svc.getFileStream('t1', 'f1');
            expect(fs.createReadStream).toHaveBeenCalledWith('/root/t1/f1');
            expect(data).toEqual('stream of /root/t1/f1');
        });
    });

    describe('moveFile', () => {
        it('resolves when rename succeeds', async () => {
            const svc = buildService();
            fs.promises.stat.mockResolvedValue({ isDirectory: () => true });
            fs.promises.rename.mockResolvedValue();
            await expect(svc.moveFile('t1', 'f1', 'f2')).resolves.toBeUndefined();
            expect(fs.promises.rename).toHaveBeenCalledWith('/root/t1/f1', '/root/t1/f2');
        });

        it('rejects when rename throws', async () => {
            const svc = buildService();
            fs.promises.stat.mockResolvedValue({ isDirectory: () => true });
            fs.promises.rename.mockRejectedValue(new Error('cannot rename file'));
            await expect(svc.moveFile('t1', 'f1', 'f2')).rejects.toThrow();
            expect(fs.promises.rename).toHaveBeenCalledWith('/root/t1/f1', '/root/t1/f2');
        });
    });

    describe('deleteFile', () => {
        it('deletes file from filesystem', async () => {
            const svc = buildService();
            fs.promises.unlink.mockResolvedValue();
            await svc.deleteFile('t1', 'f1');
            expect(fs.promises.unlink).toHaveBeenCalledWith('/root/t1/f1');
            expect(log.info).toHaveBeenCalledWith('Deleted file [%s]', '/root/t1/f1');
        });

        it('rejects when unlink throws', async () => {
            const svc = buildService();
            fs.promises.unlink.mockRejectedValue(new Error('ENOENT'));
            await expect(svc.deleteFile('t1', 'f1')).rejects.toThrow('Error deleting file: ENOENT');
            expect(log.error).toHaveBeenCalledWith(expect.any(Error), 'Error deleting file');
        });
    });

    describe('sanitizeFilePath', () => {
        it.each([
            ['123456', '123456'],
            ['foo.txt', 'foo.txt'],
            ['foo/bar.txt', 'foo/bar.txt'],
            ['foo/bar/baz.txt', 'foo/bar/baz.txt'],
            ['./foo/bar/baz.d/qux', 'foo/bar/baz.d/qux'],
            ['チシイ行き', 'チシイ行き'],
            ['😀.txt', '😀.txt']
        ])('returns sanitized path for %s', (filePath, expectedPath) => {
            const svc = buildService();
            expect(svc.sanitizeFilePath(filePath)).toBe(expectedPath);
        });

        // prettier-ignore
        it.each([
            void 0,
            null,
            123,
            '/foo.txt',
            '../foo.txt',
            'foo/bar/../../../baz.txt'
        ])('returns null for invalid path %s', (filePath) => {
            const svc = buildService();
            expect(svc.sanitizeFilePath(filePath)).toBe(null);
        });
    });
});
