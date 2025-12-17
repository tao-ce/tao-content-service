// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2022 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const jwt = require('jsonwebtoken');
const { extractToken } = require('../../src/infrastructure/middleware/jwt.middleware');
const token = jwt.sign({ tenant_id: '1' }, 'secret');

describe('JWT middleware', () => {
    const res = { status: jest.fn() };
    const json = { json: jest.fn() };
    const next = jest.fn();

    beforeEach(() => {
        jest.resetAllMocks();
        res.status.mockReturnValue(json);
    });

    it('Process token from request', async () => {
        const req = { token: token };
        await extractToken(req, res, next).then(() => {
            expect(req.access_token).toBe(token);
            expect(req.token.tenant_id).toBe('1');
            expect(next).toHaveBeenCalledTimes(1);
            expect(json.json).toHaveBeenCalledTimes(0);
        });
    });

    it('Returns 400 if no token', async () => {
        const req = {};
        await extractToken(req, res, next).then(() => {
            expect(req.access_token).isUndefined;
            expect(json.json).toHaveBeenCalledTimes(1);
        });
    });

    it('Returns 500 if bad token', async () => {
        const req = { token: 'bad token' };
        await extractToken(req, res, next).then(() => {
            expect(req.access_token).isUndefined;
            expect(json.json).toHaveBeenCalledTimes(1);
        });
    });
});
