// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const pubsubConfig = require('../../infrastructure/configs/pubsub.config');
const { OWNER_APP } = require('../../infrastructure/configs/dataPolicy.config');
const { handle: removeAssets } = require('../../infrastructure/handlers/dataPolicy/removal.handler');
const { publish } = require('../../infrastructure/services/pubsub.listener');
const { log } = require('../../infrastructure/services/logger.service');

const REMOVAL_HANDLERS = {
    'remove-candidate-profile': removeAssets,
    'remove-candidate-without-tests-profile': removeAssets,
    'remove-candidate-delivery-execution': removeAssets,
    'remove-candidate-peripheral-data': removeAssets,
    'remove-candidate-without-tests-peripheral-data': removeAssets
};

/**
 * @param {Object} options
 * @param {Object} options.data
 * @returns {Promise<void>}
 */
async function handle({ data }) {
    if (data.ownerApp !== OWNER_APP) {
        return;
    }

    const handler = REMOVAL_HANDLERS[data.policyId];
    if (!handler) {
        log.error(
            { policyId: data.policyId, tenantId: data.tenantId, ownerApp: data.ownerApp },
            'No handler registered for policyId, skipping'
        );
        return;
    }

    const result = await handler(data);

    const confirmation = {
        dataSubjectRawId: data.dataSubjectRawId,
        tenantId: data.tenantId,
        uniqueId: data.uniqueId,
        ownerApp: data.ownerApp,
        policyId: data.policyId,
        policyVersion: data.policyVersion,
        name: data.name,
        storageType: data.storageType,
        status: result.status,
        errors: result.errors
    };

    await publish({ topicName: pubsubConfig.removalConfirmationTopicName, data: confirmation });
    log.info({ policyId: data.policyId, status: result.status }, 'Published removal confirmation');
}

module.exports = { handle };
