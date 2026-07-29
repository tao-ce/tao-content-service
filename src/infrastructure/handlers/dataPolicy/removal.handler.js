// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const serviceContainer = require('../../services/servicecontainer');
const { log } = require('../../services/logger.service');
const { STATUSES, ADMIN_USER_ID } = require('../../configs/dataPolicy.config');

/**
 * @param {Object} params
 * @param {string} params.dataSubjectRawId
 * @param {string} params.tenantId
 * @returns {Promise<{ status: string, errors: Array }>}
 */
async function handle({ dataSubjectRawId, tenantId }) {
    const userId = dataSubjectRawId;
    let status = STATUSES.REMOVED;
    const errors = [];

    try {
        await serviceContainer.assetRepository.updateBy({
            changes: { userId: ADMIN_USER_ID },
            condition: { tenantId, userId }
        });
        log.info({ tenantId, newOwner: ADMIN_USER_ID }, 'Reassigned asset ownership to admin');
    } catch (err) {
        log.error({ err, tenantId }, 'Failed to reassign asset ownership');
        status = STATUSES.FAILED;
        errors.push({ entity: 'asset-metadata', message: err.message });
    }

    return { status, errors };
}

module.exports = { handle };
