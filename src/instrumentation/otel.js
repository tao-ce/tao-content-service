// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/**
 * OpenTelemetry instrumentation for tao-content-service.
 * Enabled when OTEL_SDK_ENABLED=true and OTEL_TRACES_EXPORTER is set (e.g. 'otlp').
 * Loaded via node --require in package.json start script.
 */
require('dotenv-flow').config();

const { propagation } = require('@opentelemetry/api');
const { W3CTraceContextPropagator } = require('@opentelemetry/core');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

const OTEL_SDK_ENABLED = process.env.OTEL_SDK_ENABLED === 'true';
const OTEL_TRACES_EXPORTER = process.env.OTEL_TRACES_EXPORTER ?? 'none';

/**
 * Match health-like endpoints and exclude them from tracing.
 * Examples: /health, /healthcheck, /healthz, /healthy, /api/health, /api/v1/health
 */
const HEALTH_ENDPOINT_PATTERN = /(^|\/)health(check|y|z)?(\/|$)/i;
const READINESS_ENDPOINT_PATTERN = /(^|\/)ready(\/|$)/i;
const PING_ENDPOINT_PATTERN = /(^|\/)(ping|pong)(\/|$)/i;

/**
 * Check if OpenTelemetry instrumentation is enabled.
 * @returns {boolean} True if instrumentation should be active (enabled via env and traces exporter set)
 */
function isOtelEnabled() {
    return OTEL_SDK_ENABLED && OTEL_TRACES_EXPORTER !== 'none';
}

let sdk = null;

/**
 * Initialize and start the OpenTelemetry SDK.
 * Idempotent - safe to call multiple times.
 * @returns {void}
 */
function startOtel() {
    if (!isOtelEnabled() || sdk) return;

    propagation.setGlobalPropagator(new W3CTraceContextPropagator());

    sdk = new NodeSDK({
        resource: new Resource({
            [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'tao-content-service'
        }),
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-express': {
                    enabled: true,
                    ignoreLayers: [/^middleware - /]
                },
                '@opentelemetry/instrumentation-http': {
                    ignoreIncomingRequestHook: req => {
                        const path = (req.url || '').split('?')[0];
                        return (
                            HEALTH_ENDPOINT_PATTERN.test(path) ||
                            READINESS_ENDPOINT_PATTERN.test(path) ||
                            PING_ENDPOINT_PATTERN.test(path)
                        );
                    }
                }
            })
        ]
    });
    sdk.start();
}

/**
 * Shutdown the SDK gracefully and flush pending spans.
 * Call on process exit (e.g. SIGTERM) to avoid losing traces.
 * @returns {Promise<void>}
 */
async function shutdownOtel() {
    if (sdk) {
        await sdk.shutdown();
        sdk = null;
    }
}

startOtel();

module.exports = {
    isOtelEnabled,
    shutdownOtel
};
