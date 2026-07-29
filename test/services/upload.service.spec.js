// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('../../src/infrastructure/services/logger.service', () => ({
    log: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() }
}));

const { log } = require('../../src/infrastructure/services/logger.service');

const mockStorageDriver = {
    deleteFile: jest.fn()
};

jest.mock('../../src/infrastructure/services/storage/storagefactory.service', () => ({
    createStorageDriver: jest.fn(() => mockStorageDriver)
}));

const UploadService = require('../../src/application/service/upload.service');

describe('UploadService', () => {
    let uploadService;
    let assetRepository;
    let contentExtractorService;

    beforeEach(() => {
        assetRepository = {
            deleteByVirtualPath: jest.fn()
        };
        contentExtractorService = {};
        uploadService = new UploadService(assetRepository, contentExtractorService);
        jest.clearAllMocks();
    });

    describe('deleteAsset', () => {
        it('should return null when asset is not found', async () => {
            assetRepository.deleteByVirtualPath.mockResolvedValue(null);

            const result = await uploadService.deleteAsset('tenant-1', 'img/file.png');

            expect(result).toBeNull();
            expect(assetRepository.deleteByVirtualPath).toHaveBeenCalledWith('tenant-1', 'img/file.png');
            expect(mockStorageDriver.deleteFile).not.toHaveBeenCalled();
        });

        it('should delete file from storage and return asset', async () => {
            const asset = { id: 'a1', driverId: 'gcs', storagePath: 'tenant-1/img/file.png' };
            assetRepository.deleteByVirtualPath.mockResolvedValue(asset);
            mockStorageDriver.deleteFile.mockResolvedValue();

            const result = await uploadService.deleteAsset('tenant-1', 'img/file.png');

            expect(result).toEqual(asset);
            expect(mockStorageDriver.deleteFile).toHaveBeenCalledWith('tenant-1', 'tenant-1/img/file.png');
        });

        it('should log error but still return asset when storage delete fails', async () => {
            const asset = { id: 'a1', driverId: 'gcs', storagePath: 'tenant-1/img/file.png' };
            assetRepository.deleteByVirtualPath.mockResolvedValue(asset);
            mockStorageDriver.deleteFile.mockRejectedValue(new Error('storage error'));

            const result = await uploadService.deleteAsset('tenant-1', 'img/file.png');

            expect(result).toEqual(asset);
            expect(log.error).toHaveBeenCalledWith(
                expect.any(Error),
                'Failed to delete file from storage (asset index entry already removed)'
            );
        });

        it('should delete extracted content when present', async () => {
            const asset = {
                id: 'a1',
                driverId: 'gcs',
                storagePath: 'tenant-1/img/file.pdf',
                extractedContentStoragePath: 'tenant-1/img/file.pdf.txt'
            };
            assetRepository.deleteByVirtualPath.mockResolvedValue(asset);
            mockStorageDriver.deleteFile.mockResolvedValue();

            const result = await uploadService.deleteAsset('tenant-1', 'img/file.pdf');

            expect(result).toEqual(asset);
            expect(mockStorageDriver.deleteFile).toHaveBeenCalledTimes(2);
            expect(mockStorageDriver.deleteFile).toHaveBeenCalledWith('tenant-1', 'tenant-1/img/file.pdf');
            expect(mockStorageDriver.deleteFile).toHaveBeenCalledWith('tenant-1', 'tenant-1/img/file.pdf.txt');
        });

        it('should log error but return asset when extracted content delete fails', async () => {
            const asset = {
                id: 'a1',
                driverId: 'gcs',
                storagePath: 'tenant-1/img/file.pdf',
                extractedContentStoragePath: 'tenant-1/img/file.pdf.txt'
            };
            assetRepository.deleteByVirtualPath.mockResolvedValue(asset);
            mockStorageDriver.deleteFile
                .mockResolvedValueOnce()
                .mockRejectedValueOnce(new Error('extracted content error'));

            const result = await uploadService.deleteAsset('tenant-1', 'img/file.pdf');

            expect(result).toEqual(asset);
            expect(log.error).toHaveBeenCalledWith(
                expect.any(Error),
                'Failed to delete extracted content from storage'
            );
        });
    });
});
