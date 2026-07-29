// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { PubSub } = require('@google-cloud/pubsub');
const pubsubConfig = require('../configs/pubsub.config');
const { log } = require('./logger.service');

const pubSubClient = new PubSub({ projectId: pubsubConfig.projectId });

/**
 * @param {Object} message
 * @returns {Object|null}
 */
function parseMessage(message) {
    const raw = message.data.toString();
    const parsed = JSON.parse(raw);
    return typeof parsed.body === 'string' ? JSON.parse(parsed.body) : parsed.body;
}

/**
 * @param {Object} options
 * @param {string} options.subscriptionName
 * @param {Function} options.callback
 * @param {number} [options.maxMessages]
 */
function listen({ subscriptionName, callback, maxMessages = 5 }) {
    const logPrefix = `PubSub[${subscriptionName}]`;

    if (!subscriptionName?.length) {
        log.info(`${logPrefix} Subscription not configured, skipping`);
        return;
    }

    const subscription = pubSubClient.subscription(subscriptionName, {
        flowControl: { maxMessages }
    });

    subscription.on('message', async msg => {
        if (!msg.data) {
            log.error(`${logPrefix} Received message with empty data`);
            msg.ack();
            return;
        }

        let data;
        try {
            data = parseMessage(msg);
        } catch (err) {
            log.error(err, `${logPrefix} Failed to parse message`);
            msg.ack();
            return;
        }

        try {
            await callback(data);
            msg.ack();
        } catch (err) {
            log.error(err, `${logPrefix} Failed to process message`);
            msg.nack();
        }
    });

    subscription.on('error', error => {
        log.error(error, `${logPrefix} Subscription error`);
    });

    log.info(`${logPrefix} Listening for messages...`);
}

/**
 * @param {Object} options
 * @param {string} options.topicName
 * @param {Object} options.data
 * @returns {Promise<void>}
 */
async function publish({ topicName, data }) {
    const message = Buffer.from(
        JSON.stringify({
            header: { type: topicName },
            body: JSON.stringify(data)
        })
    );
    await pubSubClient.topic(topicName).publishMessage({ data: message });
}

module.exports = { listen, publish };
