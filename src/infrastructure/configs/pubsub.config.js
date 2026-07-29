// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const config = {
    projectId: process.env.GCP_PROJECT_ID || '',
    subscriptionName: process.env.GCP_PUBSUB_DATA_POLICY_REMOVAL_SUBSCRIPTION_NAME || '',
    removalConfirmationTopicName: process.env.GCP_PUBSUB_DATA_POLICY_REMOVAL_CONFIRMATION_TOPIC_NAME || '',
    fullRemovalCheckSubscriptionName: process.env.GCP_PUBSUB_DATA_POLICY_FULL_REMOVAL_CHECK_SUBSCRIPTION_NAME || '',
    fullRemovalConfirmationTopicName: process.env.GCP_PUBSUB_DATA_POLICY_FULL_REMOVAL_CONFIRMATION_TOPIC_NAME || '',
    maxMessages: parseInt(process.env.GCP_PUBSUB_MAX_MESSAGES, 10) || 5
};

module.exports = config;
