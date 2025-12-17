// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const ContentExtractorService = require('../../src/infrastructure/services/contentExtractor.service');

describe('ContentExtractorService', () => {
    let contentExtractorService;
    let mockContentExtractor;

    beforeEach(() => {
        mockContentExtractor = {
            supports: jest.fn(),
            extract: jest.fn()
        };
        contentExtractorService = new ContentExtractorService([mockContentExtractor]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('extract method', () => {
        it('should return extracted content when extractor supports the content type', async () => {
            const contentType = 'supportedType';
            const data = 'some data';
            const expectedContent = 'extracted content';

            mockContentExtractor.supports.mockReturnValueOnce(true);
            mockContentExtractor.extract.mockReturnValueOnce(expectedContent);

            const result = await contentExtractorService.extract(contentType, data);

            expect(result).toBe(expectedContent);
            expect(mockContentExtractor.supports).toHaveBeenCalledWith(contentType);
            expect(mockContentExtractor.extract).toHaveBeenCalledWith(data);
        });

        it('should throw an error when no extractor supports the content type', async () => {
            const contentType = 'unsupportedType';
            const data = 'some data';

            mockContentExtractor.supports.mockReturnValueOnce(false);

            await expect(contentExtractorService.extract(contentType, data)).rejects.toThrow(
                `No content extractor found for content type: ${contentType}`
            );
            expect(mockContentExtractor.supports).toHaveBeenCalledWith(contentType);
        });
    });
});
