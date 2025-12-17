// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2024 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const fs = require('fs');
const { Policy } = require('cockatiel');
const { prefix } = require('../configs/elasticsearch.config.js');
const serviceContainer = require('../services/servicecontainer.js');
const { log } = require('../services/logger.service.js');

const retryWithBreaker = Policy.wrap(
    Policy.handleAll()
        .retry()
        .attempts(10)
        .delay(2 * 1000)
);
const elasticsearch = serviceContainer.elasticsearchClient;

async function applyMappings() {
    const path = 'mappings';
    try {
        return await retryWithBreaker.execute(async () => {
            const pipeline = {
                description: 'Adds indexed_at timestamp to documents',
                processors: [
                    {
                        set: {
                            field: 'last_update_date',
                            value: '{{_ingest.timestamp}}'
                        }
                    },
                    {
                        script: {
                            lang: 'painless',
                            source: 'ctx.last_update_date = ZonedDateTime.parse(ctx.last_update_date).toInstant().toEpochMilli();'
                        }
                    }
                ]
            };
            await elasticsearch.ingest.putPipeline({
                id: 'content-service-last-update-date',
                body: pipeline
            });
            log.debug('Pipeline defined for content-service-last-update-date');

            const files = fs.readdirSync(path);
            for (const file of files) {
                const data = fs.readFileSync(path + '/' + file, 'utf8');
                const index = prefix + file.replace('.json', '');
                log.info('Applying mapping for ' + index);

                const exists = await elasticsearch.indices.exists({ index });
                if (exists) {
                    await elasticsearch.indices.putMapping({
                        index,
                        body: JSON.parse(data).mappings
                    });
                } else {
                    await elasticsearch.indices.create({
                        index,
                        body: JSON.parse(data)
                    });
                }
                await elasticsearch.indices.putSettings({
                    index,
                    body: {
                        'index.default_pipeline': 'content-service-last-update-date'
                    }
                });
                log.debug(`Index defined for: [${index}]`);
            }
            return true;
        });
    } catch (err) {
        log.info('Error applying mappings, please review ' + err);
        return false;
    }
}

module.exports = {
    applyMappings
};
