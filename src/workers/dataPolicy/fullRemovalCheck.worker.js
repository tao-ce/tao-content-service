// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const pubsubConfig = require('../../infrastructure/configs/pubsub.config');
const { OWNER_APP } = require('../../infrastructure/configs/dataPolicy.config');
const { handle: checkAssetsRemoved } = require('../../infrastructure/handlers/dataPolicy/fullRemovalCheck.handler');
const { publish } = require('../../infrastructure/services/pubsub.listener');
const { log } = require('../../infrastructure/services/logger.service');

const FULL_REMOVAL_CHECK_HANDLERS = {
    'remove-candidate-peripheral-data': checkAssetsRemoved,
    'remove-candidate-without-tests-peripheral-data': checkAssetsRemoved
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

    const handler = FULL_REMOVAL_CHECK_HANDLERS[data.policyId];
    if (!handler) {
        log.error(
            { policyId: data.policyId, tenantId: data.tenantId, ownerApp: data.ownerApp },
            'No handler registered for policyId, skipping'
        );
        return;
    }

    const result = await handler(data);

    if (result.dataRemoved) {
        const confirmation = {
            dataSubjectRawId: data.dataSubjectRawId,
            tenantId: data.tenantId,
            ownerApp: data.ownerApp,
            policyId: data.policyId,
            policyVersion: data.policyVersion
        };

        await publish({ topicName: pubsubConfig.fullRemovalConfirmationTopicName, data: confirmation });
        log.info(
            { policyId: data.policyId, dataRemoved: result.dataRemoved },
            'Published full removal check confirmation'
        );
    }
}

module.exports = { handle };
