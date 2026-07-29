// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const {
    handle: handleFullRemovalCheck
} = require('../../../src/infrastructure/handlers/dataPolicy/fullRemovalCheck.handler');

jest.mock('../../../src/infrastructure/services/servicecontainer', () => ({
    assetRepository: {
        findBy: jest.fn()
    }
}));
jest.mock('../../../src/infrastructure/services/logger.service', () => ({
    log: { info: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));

const serviceContainer = require('../../../src/infrastructure/services/servicecontainer');

describe('fullRemovalCheck.handler', () => {
    const baseInput = {
        dataSubjectRawId: 'user-123',
        tenantId: 'tenant-abc'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return dataRemoved true when no assets exist', async () => {
        serviceContainer.assetRepository.findBy.mockResolvedValue([]);

        const result = await handleFullRemovalCheck(baseInput);

        expect(serviceContainer.assetRepository.findBy).toHaveBeenCalledWith({
            tenantId: 'tenant-abc',
            userId: 'user-123'
        });
        expect(result.dataRemoved).toBe(true);
    });

    it('should return dataRemoved false when assets still exist', async () => {
        serviceContainer.assetRepository.findBy.mockResolvedValue([
            { id: 'a1', driverId: 'private', storagePath: 'path/a1' }
        ]);

        const result = await handleFullRemovalCheck(baseInput);

        expect(result.dataRemoved).toBe(false);
    });

    it('should only return dataRemoved', async () => {
        serviceContainer.assetRepository.findBy.mockResolvedValue([]);

        const result = await handleFullRemovalCheck(baseInput);

        expect(Object.keys(result)).toEqual(['dataRemoved']);
    });

    it('should throw when findBy fails', async () => {
        serviceContainer.assetRepository.findBy.mockRejectedValue(new Error('ES down'));

        await expect(handleFullRemovalCheck(baseInput)).rejects.toThrow('ES down');
    });
});
