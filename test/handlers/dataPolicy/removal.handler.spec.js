// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { handle: handleRemoval } = require('../../../src/infrastructure/handlers/dataPolicy/removal.handler');
const { STATUSES } = require('../../../src/infrastructure/configs/dataPolicy.config');

jest.mock('../../../src/infrastructure/services/servicecontainer', () => ({
    assetRepository: {
        updateBy: jest.fn()
    }
}));
jest.mock('../../../src/infrastructure/services/logger.service', () => ({
    log: { info: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));

const serviceContainer = require('../../../src/infrastructure/services/servicecontainer');

describe('removal.handler', () => {
    const baseInput = {
        dataSubjectRawId: 'user-123',
        tenantId: 'tenant-abc'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reassign asset ownership to admin and return removed', async () => {
        serviceContainer.assetRepository.updateBy.mockResolvedValue();

        const result = await handleRemoval(baseInput);

        expect(serviceContainer.assetRepository.updateBy).toHaveBeenCalledWith({
            changes: { userId: 'admin' },
            condition: { tenantId: 'tenant-abc', userId: 'user-123' }
        });
        expect(result.status).toBe(STATUSES.REMOVED);
        expect(result.errors).toEqual([]);
    });

    it('should return failed when updateBy throws', async () => {
        serviceContainer.assetRepository.updateBy.mockRejectedValue(new Error('ES down'));

        const result = await handleRemoval(baseInput);

        expect(result.status).toBe(STATUSES.FAILED);
        expect(result.errors).toEqual([{ entity: 'asset-metadata', message: 'ES down' }]);
    });

    it('should only return status and errors', async () => {
        serviceContainer.assetRepository.updateBy.mockResolvedValue();

        const result = await handleRemoval(baseInput);

        expect(Object.keys(result)).toEqual(['status', 'errors']);
    });
});
