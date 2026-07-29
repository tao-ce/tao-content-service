// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

jest.mock('../../src/infrastructure/services/logger.service', () => ({
    log: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() }
}));

const DeleteController = require('../../src/application/controllers/delete.controller');

describe('DeleteController', () => {
    let controller;
    let uploadService;
    let response;

    beforeEach(() => {
        uploadService = {
            deleteAsset: jest.fn()
        };
        controller = new DeleteController(uploadService);
        response = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('deleteFile', () => {
        it('should return 400 when tenantId is missing', async () => {
            const request = { params: {} };

            await controller.deleteFile(request, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({ message: 'Missing or invalid tenantId' });
            expect(uploadService.deleteAsset).not.toHaveBeenCalled();
        });

        it('should return 400 when tenantId is empty', async () => {
            const request = { params: { tenantId: '  ' } };

            await controller.deleteFile(request, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({ message: 'Missing or invalid tenantId' });
        });

        it('should return 400 when virtualPath is missing', async () => {
            const request = { params: { tenantId: 'tenant-1' } };

            await controller.deleteFile(request, response);

            expect(response.status).toHaveBeenCalledWith(400);
            expect(response.json).toHaveBeenCalledWith({ message: 'Missing or invalid virtual path' });
            expect(uploadService.deleteAsset).not.toHaveBeenCalled();
        });

        it('should return 404 when asset is not found', async () => {
            const request = { params: { tenantId: 'tenant-1', virtualPath: 'img/file.png' } };
            uploadService.deleteAsset.mockResolvedValue(null);

            await controller.deleteFile(request, response);

            expect(uploadService.deleteAsset).toHaveBeenCalledWith('tenant-1', 'img/file.png');
            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.json).toHaveBeenCalledWith({ error: 'Asset not found' });
        });

        it('should return 200 with deleted asset id on success', async () => {
            const request = { params: { tenantId: 'tenant-1', virtualPath: 'img/file.png' } };
            uploadService.deleteAsset.mockResolvedValue({ id: 'asset-123' });

            await controller.deleteFile(request, response);

            expect(uploadService.deleteAsset).toHaveBeenCalledWith('tenant-1', 'img/file.png');
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({ message: 'Asset deleted', id: 'asset-123' });
        });

        it('should return 500 when service throws', async () => {
            const request = { params: { tenantId: 'tenant-1', virtualPath: 'img/file.png' } };
            uploadService.deleteAsset.mockRejectedValue(new Error('DB failure'));

            await controller.deleteFile(request, response);

            expect(response.status).toHaveBeenCalledWith(500);
            expect(response.json).toHaveBeenCalledWith({ error: expect.stringContaining('DB failure') });
        });
    });
});
