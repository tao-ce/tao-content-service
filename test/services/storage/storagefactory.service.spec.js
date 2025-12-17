// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2025 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const storageFactoryService = require('../../../src/infrastructure/services/storage/storagefactory.service');
const FileStorageService = require('../../../src/infrastructure/services/storage/filestorage.service');
const GoogleCloudStorageService = require('../../../src/infrastructure/services/storage/googlecloudstorage.service');
const storageConfig = require('../../../src/infrastructure/configs/storage.config');

// Mock the storage service classes
jest.mock('../../../src/infrastructure/services/storage/filestorage.service');
jest.mock('../../../src/infrastructure/services/storage/googlecloudstorage.service');

describe('StorageFactoryService', () => {
    let originalDrivers;
    let originalDefaultDriver;

    beforeEach(() => {
        jest.clearAllMocks();

        // Save originals
        originalDrivers = { ...storageConfig.config.drivers };
        originalDefaultDriver = storageConfig.config.defaultDriver;

        // Set up test drivers if they don't exist
        storageConfig.config.drivers['file'] = {
            type: storageConfig.driverTypes.FILESYSTEM,
            config: {
                rootPath: '/test',
                baseUrl: 'http://test.example.com'
            }
        };
        storageConfig.config.drivers['private'] = {
            type: storageConfig.driverTypes.GCP,
            config: {
                projectId: 'test-project',
                bucketName: 'test-bucket',
                linkTtlMinutes: 10,
                signRequired: true,
                bucketDirectory: ''
            }
        };
        storageConfig.config.drivers['public'] = {
            type: storageConfig.driverTypes.GCP,
            config: {
                projectId: 'test-project',
                bucketName: 'test-bucket-public',
                linkTtlMinutes: 10,
                signRequired: true,
                bucketDirectory: ''
            }
        };
    });

    afterEach(() => {
        storageConfig.config.drivers = originalDrivers;
        storageConfig.config.defaultDriver = originalDefaultDriver;
        delete storageConfig.config.drivers['invalidTypeDriver'];
    });

    describe('createStorageDriver', () => {
        it.each([
            { storage: FileStorageService, driverId: 'file' },
            { storage: GoogleCloudStorageService, driverId: 'private' },
            { storage: GoogleCloudStorageService, driverId: 'public' }
        ])('creates correct service for $driverId', ({ storage, driverId }) => {
            const result = storageFactoryService.createStorageDriver({ driverId });

            expect(result).toBeInstanceOf(storage);
            expect(storage).toHaveBeenCalledWith({ driver: storageConfig.config.drivers[driverId] });
        });

        it('uses defaultDriver when driverId is omitted', () => {
            const previousDefault = storageConfig.config.defaultDriver;
            storageConfig.config.defaultDriver = 'private';
            try {
                const result = storageFactoryService.createStorageDriver({});

                expect(result).toBeInstanceOf(GoogleCloudStorageService);
                expect(GoogleCloudStorageService).toHaveBeenCalledWith({
                    driver: storageConfig.config.drivers['private']
                });
            } finally {
                storageConfig.config.defaultDriver = previousDefault;
            }
        });

        it('throws when driver ID not supported', () => {
            expect(() => storageFactoryService.createStorageDriver({ driverId: 'unknown' })).toThrow(
                'Driver unknown not supported'
            );
        });

        it('throws when driver type unknown', () => {
            storageConfig.config.drivers['invalidTypeDriver'] = {
                type: 'INVALID',
                config: {}
            };
            expect(() => storageFactoryService.createStorageDriver({ driverId: 'invalidTypeDriver' })).toThrow(
                "Unknown storage type: 'INVALID'"
            );
        });
    });
});
