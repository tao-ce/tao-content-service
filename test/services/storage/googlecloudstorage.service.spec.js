// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024-2025 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const GoogleCloudStorageService = require('../../../src/infrastructure/services/storage/googlecloudstorage.service');

// Mock logger service used by the implementation
jest.mock('../../../src/infrastructure/services/logger.service', () => ({
    log: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }
}));

// Access the mocked logger to assert calls
const { log } = require('../../../src/infrastructure/services/logger.service');

// Mock GCP Storage SDK (use hoist-safe pattern)
// eslint-disable-next-line no-var
const storageSdkMocks = {};
jest.mock('@google-cloud/storage', () => {
    const bucketMock = jest.fn();
    const fileMock = jest.fn();
    const saveMock = jest.fn();
    const getSignedUrlMock = jest.fn();
    const publicUrlMock = jest.fn();
    const downloadMock = jest.fn();
    const createReadStreamMock = jest.fn();
    const moveMock = jest.fn();
    const existsMock = jest.fn();
    const deleteMock = jest.fn();

    // expose mocks to the test via outer var
    storageSdkMocks.bucketMock = bucketMock;
    storageSdkMocks.fileMock = fileMock;
    storageSdkMocks.saveMock = saveMock;
    storageSdkMocks.getSignedUrlMock = getSignedUrlMock;
    storageSdkMocks.publicUrlMock = publicUrlMock;
    storageSdkMocks.downloadMock = downloadMock;
    storageSdkMocks.createReadStreamMock = createReadStreamMock;
    storageSdkMocks.moveMock = moveMock;
    storageSdkMocks.existsMock = existsMock;
    storageSdkMocks.deleteMock = deleteMock;

    const Storage = jest.fn().mockImplementation(() => ({
        bucket: bucketMock
    }));
    return { Storage };
});

// Mock crypto
jest.mock('crypto', () => {
    const real = jest.requireActual('crypto');
    return {
        ...real,
        randomUUID: jest.fn(() => 'mock-uuid'),
        createHmac: jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn(() => 'mock-signature')
        }))
    };
});

describe('GoogleCloudStorageService', () => {
    const baseDriverConfig = {
        projectId: 'proj',
        keyFilename: null,
        bucketName: 'my-bucket',
        bucketDirectory: 'my-dir',
        linkTtlMinutes: 15,
        cdnUrl: null,
        cdnKey: null,
        cdnKeyName: null,
        signRequired: true
    };

    const buildService = (overrides = {}) =>
        new GoogleCloudStorageService({ driver: { config: { ...baseDriverConfig, ...overrides } } });

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset bucket/file chain
        storageSdkMocks.saveMock.mockResolvedValue();
        storageSdkMocks.getSignedUrlMock.mockResolvedValue(['https://signed.example/url']);
        storageSdkMocks.publicUrlMock.mockReturnValue('https://public.example/url');
        storageSdkMocks.downloadMock.mockResolvedValue([Buffer.from('data')]);
        storageSdkMocks.existsMock.mockResolvedValue([true]);

        storageSdkMocks.deleteMock.mockResolvedValue();

        storageSdkMocks.fileMock.mockReturnValue({
            save: storageSdkMocks.saveMock,
            getSignedUrl: storageSdkMocks.getSignedUrlMock,
            publicUrl: storageSdkMocks.publicUrlMock,
            download: storageSdkMocks.downloadMock,
            createReadStream: storageSdkMocks.createReadStreamMock,
            move: storageSdkMocks.moveMock,
            exists: storageSdkMocks.existsMock,
            delete: storageSdkMocks.deleteMock
        });

        storageSdkMocks.bucketMock.mockReturnValue({ file: storageSdkMocks.fileMock });
    });

    describe('constructor', () => {
        it('throws when TTL is less than 1 minute', () => {
            expect(() => buildService({ linkTtlMinutes: 0 })).toThrow(
                'TTL for download links should be at least 1 minute'
            );
        });
    });

    it('getName returns gcp', () => {
        const svc = buildService();
        expect(svc.getName()).toBe('gcp');
    });

    describe('store', () => {
        it('stores data without filePath using random UUID and returns relative path', async () => {
            const svc = buildService();
            const result = await svc.store({ tenantId: 'tenant', data: Buffer.from('x'), contentType: 'text/plain' });

            expect(result).toBe('tenant/mock-uuid');
            expect(storageSdkMocks.bucketMock).toHaveBeenCalledWith('my-bucket');
            expect(storageSdkMocks.fileMock).toHaveBeenCalledWith('my-dir/tenant/mock-uuid');
            expect(storageSdkMocks.saveMock).toHaveBeenCalledWith(Buffer.from('x'), { contentType: 'text/plain' });
            expect(log.info).toHaveBeenCalledWith('Stored a new resource in GCP', {
                path: { relative: 'tenant/mock-uuid', full: 'my-dir/tenant/mock-uuid' }
            });
        });

        it('stores data with provided filePath and returns relative path', async () => {
            const svc = buildService();
            const result = await svc.store({ tenantId: 'tenant', data: 'abc', contentType: 'bin', filePath: 'file-1' });

            expect(result).toBe('tenant/file-1');
            expect(storageSdkMocks.fileMock).toHaveBeenCalledWith('my-dir/tenant/file-1');
        });

        it('logs and rethrows on save error', async () => {
            const svc = buildService();
            const err = new Error('save failed');
            storageSdkMocks.saveMock.mockRejectedValueOnce(err);

            await expect(svc.store({ tenantId: 'tenant', data: 'x', contentType: 'text/plain' })).rejects.toBe(err);

            expect(log.error).toHaveBeenCalledWith(err, 'Error while storing new file in GCP');
        });
    });

    describe('getPublicUrl', () => {
        it('returns CDN signed URL when routeViaCdn and signing enabled', async () => {
            const svc = buildService({
                cdnUrl: 'https://cdn.example.com/base',
                cdnKey: Buffer.from('secret').toString('base64'),
                cdnKeyName: 'key1',
                signRequired: true
            });

            const url = await svc.getPublicUrl({ storagePath: 'tenant/path/file', routeViaCdn: true });

            expect(url).toContain('https://cdn.example.com/base/tenant/path/file');
            expect(url).toContain('Expires=');
            expect(url).toContain('KeyName=key1');
            expect(url).toContain('Signature=mock-signature');
        });

        it('returns CDN URL without signature when signing disabled and not requested', async () => {
            const svc = buildService({
                cdnUrl: 'https://cdn.example.com/base',
                signRequired: false
            });

            const url = await svc.getPublicUrl({ storagePath: 'tenant/path/file', routeViaCdn: true, signUrl: false });

            expect(url).toBe('https://cdn.example.com/base/tenant/path/file');
        });

        it('returns signed GCS URL when not using CDN', async () => {
            const svc = buildService({ cdnUrl: null, signRequired: true });

            const url = await svc.getPublicUrl({ storagePath: 'tenant/file' });

            expect(storageSdkMocks.bucketMock).toHaveBeenCalledWith('my-bucket');
            expect(storageSdkMocks.fileMock).toHaveBeenCalledWith('my-dir/tenant/file');
            expect(storageSdkMocks.getSignedUrlMock).toHaveBeenCalledWith({
                version: 'v4',
                action: 'read',
                expires: expect.any(Number)
            });
            expect(log.debug).toHaveBeenCalledWith('retrieved signed URL', { url });
        });

        it('passes responseDisposition when fileName provided', async () => {
            const svc = buildService({ cdnUrl: null, signRequired: true });

            await svc.getPublicUrl({ storagePath: 'tenant/file', fileName: 'name.pdf' });

            expect(storageSdkMocks.getSignedUrlMock).toHaveBeenCalledWith({
                version: 'v4',
                action: 'read',
                expires: expect.any(Number),
                responseDisposition: 'attachment; filename="name.pdf"'
            });
        });

        it('logs and rethrows when signing fails', async () => {
            const svc = buildService({ cdnUrl: null, signRequired: true });
            const err = new Error('sign failed');
            storageSdkMocks.getSignedUrlMock.mockRejectedValueOnce(err);

            await expect(svc.getPublicUrl({ storagePath: 'tenant/file' })).rejects.toBe(err);
            expect(log.error).toHaveBeenCalledWith(err, 'Error getting a signed URL from GCP');
        });

        it('returns public URL when signing disabled and not requested', async () => {
            const svc = buildService({ signRequired: false });
            const url = await svc.getPublicUrl({ storagePath: 'tenant/file', signUrl: false });
            expect(url).toBe('https://public.example/url');
        });
    });

    describe('getContent', () => {
        it('downloads and returns buffer', async () => {
            const svc = buildService();
            const data = await svc.getContent('tenant', 'tenant/file');
            expect(data).toEqual(Buffer.from('data'));
            expect(storageSdkMocks.bucketMock).toHaveBeenCalledWith('my-bucket');
            expect(storageSdkMocks.fileMock).toHaveBeenCalledWith('my-dir/tenant/file');
            expect(storageSdkMocks.downloadMock).toHaveBeenCalled();
            expect(log.debug).toHaveBeenCalledWith('Downloaded data from GCP', {
                path: { relative: 'tenant/file', full: 'my-dir/tenant/file' }
            });
        });

        it('logs and rethrows on download error', async () => {
            const svc = buildService();
            const err = new Error('download failed');
            storageSdkMocks.downloadMock.mockRejectedValueOnce(err);
            await expect(svc.getContent('tenant', 'tenant/file')).rejects.toBe(err);
            expect(log.error).toHaveBeenCalledWith(err, 'Error downloading data from GCP');
        });
    });

    describe('getFileStream', () => {
        it('returns promise of stream of file', async () => {
            const svc = buildService();
            storageSdkMocks.createReadStreamMock.mockResolvedValueOnce(123);
            const data = await svc.getFileStream('tenant', 'tenant/file');
            expect(data).toEqual(123);
            expect(storageSdkMocks.bucketMock).toHaveBeenCalledWith('my-bucket');
            expect(storageSdkMocks.fileMock).toHaveBeenCalledWith('my-dir/tenant/file');
            expect(storageSdkMocks.createReadStreamMock).toHaveBeenCalled();
        });
    });

    describe('moveFile', () => {
        it('resolves when move succeeds', async () => {
            const svc = buildService();
            storageSdkMocks.moveMock.mockResolvedValue();
            await svc.moveFile('tenant', 'tenant/file', 'tenant/newfile');
            expect(storageSdkMocks.bucketMock).toHaveBeenCalledWith('my-bucket');
            expect(storageSdkMocks.fileMock).toHaveBeenCalledWith('my-dir/tenant/file');
            expect(storageSdkMocks.fileMock).toHaveBeenCalledWith('my-dir/tenant/newfile');
            expect(storageSdkMocks.moveMock).toHaveBeenCalled();
        });

        it('rejects when move throws', async () => {
            const svc = buildService();
            storageSdkMocks.moveMock.mockRejectedValue(new Error('move failed'));
            await expect(svc.moveFile('tenant', 'tenant/file', 'tenant/newfile')).rejects.toThrow('move failed');
        });
    });

    describe('deleteFile', () => {
        it('deletes file from GCP bucket', async () => {
            const svc = buildService();
            await svc.deleteFile('tenant', 'tenant/file');
            expect(storageSdkMocks.bucketMock).toHaveBeenCalledWith('my-bucket');
            expect(storageSdkMocks.fileMock).toHaveBeenCalledWith('my-dir/tenant/file');
            expect(storageSdkMocks.deleteMock).toHaveBeenCalled();
            expect(log.info).toHaveBeenCalledWith('Deleted resource from GCP [%s]', 'tenant/file');
        });

        it('rejects when delete throws', async () => {
            const svc = buildService();
            storageSdkMocks.deleteMock.mockRejectedValueOnce(new Error('delete failed'));
            await expect(svc.deleteFile('tenant', 'tenant/file')).rejects.toThrow('delete failed');
            expect(log.error).toHaveBeenCalledWith(expect.any(Error), 'Error deleting file from GCP');
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
        ])('returns sanitized path', (filePath, expectedPath) => {
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
        ])('returns null for invalid path', (filePath) => {
            const svc = buildService();
            expect(svc.sanitizeFilePath(filePath)).toBe(null);
        });
    });
});
