// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { log } = require('../services/logger.service');
// eslint-disable-next-line no-unused-vars
const errorHandler = (error, req, res, next) => {
    log.error(error.message);

    const errorBody = {
        message: error.message,
        stack: error.stack
    };
    if (error.status) res.status(error.status).json(errorBody);
    else res.status(500).json(errorBody);
};

module.exports = {
    errorHandler
};
