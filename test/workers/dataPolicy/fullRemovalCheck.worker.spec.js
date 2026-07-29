// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const mockPublish = jest.fn().mockResolvedValue();

jest.mock('../../../src/infrastructure/configs/pubsub.config', () => ({
    fullRemovalConfirmationTopicName: 'test-full-removal-confirmation-topic'
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

const mockFullRemovalCheckHandler = jest.fn();
jest.mock('../../../src/infrastructure/handlers/dataPolicy/fullRemovalCheck.handler', () => ({
    handle: mockFullRemovalCheckHandler
}));

const { handle } = require('../../../src/workers/dataPolicy/fullRemovalCheck.worker');

describe('fullRemovalCheck.worker', () => {
    const baseData = {
        ownerApp: 'content-service',
        policyId: 'remove-candidate-peripheral-data',
        dataSubjectRawId: 'user-1',
        tenantId: 'tenant-1',
        policyVersion: '1'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should build confirmation explicitly when dataRemoved is true', async () => {
        mockFullRemovalCheckHandler.mockResolvedValue({ dataRemoved: true });

        await handle({ data: baseData });

        expect(mockFullRemovalCheckHandler).toHaveBeenCalledWith(baseData);
        expect(mockPublish).toHaveBeenCalledWith({
            topicName: 'test-full-removal-confirmation-topic',
            data: {
                dataSubjectRawId: 'user-1',
                tenantId: 'tenant-1',
                ownerApp: 'content-service',
                policyId: 'remove-candidate-peripheral-data',
                policyVersion: '1'
            }
        });
    });

    it('should not publish when dataRemoved is false', async () => {
        mockFullRemovalCheckHandler.mockResolvedValue({ dataRemoved: false });

        await handle({ data: baseData });

        expect(mockFullRemovalCheckHandler).toHaveBeenCalled();
        expect(mockPublish).not.toHaveBeenCalled();
    });

    it('should skip messages for other ownerApps', async () => {
        await handle({ data: { ...baseData, ownerApp: 'portal' } });

        expect(mockFullRemovalCheckHandler).not.toHaveBeenCalled();
        expect(mockPublish).not.toHaveBeenCalled();
    });

    it('should skip unknown policyIds', async () => {
        await handle({ data: { ...baseData, policyId: 'unknown-policy' } });

        expect(mockFullRemovalCheckHandler).not.toHaveBeenCalled();
        expect(mockPublish).not.toHaveBeenCalled();
    });

    it('should throw when handler throws', async () => {
        mockFullRemovalCheckHandler.mockRejectedValue(new Error('handler error'));

        await expect(handle({ data: baseData })).rejects.toThrow('handler error');
    });
});
