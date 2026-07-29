// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

require('dotenv-flow').config();
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const pubsubConfig = require('../infrastructure/configs/pubsub.config');
const { listen } = require('../infrastructure/services/pubsub.listener');
const dataPolicyRemovalHandler = require('./dataPolicy/removal.worker');
const dataPolicyFullRemovalCheckHandler = require('./dataPolicy/fullRemovalCheck.worker');

const processes = [
    {
        subscriptionName: pubsubConfig.subscriptionName,
        callback: async data => await dataPolicyRemovalHandler.handle({ data })
    },
    {
        subscriptionName: pubsubConfig.fullRemovalCheckSubscriptionName,
        callback: async data => await dataPolicyFullRemovalCheckHandler.handle({ data })
    }
];

for (const { subscriptionName, callback } of processes) {
    listen({ subscriptionName, callback, maxMessages: pubsubConfig.maxMessages });
}
