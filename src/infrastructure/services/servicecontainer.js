// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023-2024 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const pdfParser = require('pdf-parse');
const { log } = require('./logger.service');
const config = require('../configs/general.config');
const elasticsearchConfig = require('../configs/elasticsearch.config');
const ElasticsearchClientFactory = require('./index/elasticsearchclientfactory.service');
const BinaryBodyReaderService = require('./http/binarybodyreader.service');
const BrowseService = require('../../application/service/browse.service');
const UploadService = require('../../application/service/upload.service');
const ContentService = require('../../application/service/content.service');
const MoveService = require('../../application/service/move.service');
const ElasticsearchAssetRepository = require('./repository/elasticsearchasset.repository');
const ContentExtractorService = require('./contentExtractor.service');
const PdfContentExtractor = require('./contentExtractors/pdf.contentExtractor');

const assetIndex = elasticsearchConfig.indexes.asset().index;

/**
 * @typedef {import('./index/elasticsearchclientfactory.service.js')} Client
 * @typedef {import('#domain/assetrepository.interface.js')} AssetRepositoryInterface
 * @typedef {import('pino').Logger} Logger
 *
 * @property {Logger} log
 * @property {BinaryBodyReaderService} binaryBodyReader
 * @property {Client} elasticsearchClient
 * @property {AssetRepositoryInterface} assetRepository
 * @property {BrowseService} browseService
 * @property {UploadService} uploadService
 * @property {ContentService} contentService
 * @property {MoveService} moveService
 */
class ServiceContainer {
    constructor() {
        this.log = log;
        this.binaryBodyReader = new BinaryBodyReaderService();
        this.elasticsearchClient = new ElasticsearchClientFactory().createClient(config.elasticsearch || {});
        this.assetRepository = new ElasticsearchAssetRepository(
            this.log,
            this.elasticsearchClient,
            assetIndex,
            config.elasticsearch.syncRefresh
        );
        this.browseService = new BrowseService(this.log, this.assetRepository);
        this.pdfContentExtractor = new PdfContentExtractor(pdfParser);
        this.contentExtractorService = new ContentExtractorService([this.pdfContentExtractor]);
        this.uploadService = new UploadService(this.assetRepository, this.contentExtractorService);
        this.contentService = new ContentService(this.assetRepository, this.contentExtractorService);
        this.moveService = new MoveService(this.assetRepository);
    }
}

module.exports = new ServiceContainer();
