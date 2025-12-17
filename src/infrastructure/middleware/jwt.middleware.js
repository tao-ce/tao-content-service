// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const { createDecoder } = require('fast-jwt');

const extractToken = async (req, res, next) => {
    if (!req?.token) {
        return res.status(400).json({ message: 'Missing token' });
    }
    try {
        req.access_token = req.token;
        req.token = await createDecoder()(req.token);
        return next();
    } catch (e) {
        return res.status(500).json({ message: 'Internal error processing token' });
    }
};

module.exports = {
    extractToken
};
