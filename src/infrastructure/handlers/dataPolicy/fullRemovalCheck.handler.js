// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const serviceContainer = require('../../services/servicecontainer');
const { log } = require('../../services/logger.service');

/**
 * @param {Object} params
 * @param {string} params.dataSubjectRawId
 * @param {string} params.tenantId
 * @returns {Promise<{ dataRemoved: boolean }>}
 */
async function handle({ dataSubjectRawId, tenantId }) {
    const userId = dataSubjectRawId;
    const assets = await serviceContainer.assetRepository.findBy({ tenantId, userId });

    const dataRemoved = assets.length === 0;
    log.info({ tenantId, dataRemoved, assetCount: assets.length }, 'Full removal check completed');

    return { dataRemoved };
}

module.exports = { handle };
