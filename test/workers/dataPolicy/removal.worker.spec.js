// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const mockPublish = jest.fn().mockResolvedValue();

jest.mock('../../../src/infrastructure/configs/pubsub.config', () => ({
    removalConfirmationTopicName: 'test-confirmation-topic'
}));
jest.mock('../../../src/infrastructure/configs/dataPolicy.config', () => ({
    OWNER_APP: 'content-service'
}));
jest.mock('../../../src/infrastructure/services/pubsub.listener', () => ({
    publish: mockPublish
}));
jest.mock('../../../src/infrastructure/services/logger.service', () => ({
    log: { info: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));

const mockRemovalHandler = jest.fn();
jest.mock('../../../src/infrastructure/handlers/dataPolicy/removal.handler', () => ({
    handle: mockRemovalHandler
}));

const { handle } = require('../../../src/workers/dataPolicy/removal.worker');

describe('removal.worker', () => {
    const baseData = {
        ownerApp: 'content-service',
        policyId: 'remove-candidate-profile',
        dataSubjectRawId: 'user-1',
        tenantId: 'tenant-1',
        uniqueId: 'uid-1',
        name: 'user-profile',
        storageType: 'elasticsearch',
        policyVersion: '1'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should build confirmation explicitly from data and handler result', async () => {
        mockRemovalHandler.mockResolvedValue({ status: 'removed', errors: [] });

        await handle({ data: baseData });

        expect(mockRemovalHandler).toHaveBeenCalledWith(baseData);
        expect(mockPublish).toHaveBeenCalledWith({
            topicName: 'test-confirmation-topic',
            data: {
                dataSubjectRawId: 'user-1',
                tenantId: 'tenant-1',
                uniqueId: 'uid-1',
                ownerApp: 'content-service',
                policyId: 'remove-candidate-profile',
                policyVersion: '1',
                name: 'user-profile',
                storageType: 'elasticsearch',
                status: 'removed',
                errors: []
            }
        });
    });

    it('should skip messages for other ownerApps', async () => {
        await handle({ data: { ...baseData, ownerApp: 'portal' } });

        expect(mockRemovalHandler).not.toHaveBeenCalled();
        expect(mockPublish).not.toHaveBeenCalled();
    });

    it('should skip unknown policyIds', async () => {
        await handle({ data: { ...baseData, policyId: 'unknown-policy' } });

        expect(mockRemovalHandler).not.toHaveBeenCalled();
        expect(mockPublish).not.toHaveBeenCalled();
    });

    it('should throw when handler throws', async () => {
        mockRemovalHandler.mockRejectedValue(new Error('handler error'));

        await expect(handle({ data: baseData })).rejects.toThrow('handler error');
    });
});
