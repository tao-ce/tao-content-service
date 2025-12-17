// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA ;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
const controllerUtil = require('../../../src/infrastructure/services/util/controller.util');

describe('Controler Util functionality', () => {
    it('Throws exception with status code', () => {
        try {
            controllerUtil.throwHttpError(404, 'Page not found');
            throw new Error('Shouldn reach this code line');
        } catch (e) {
            expect(e.message).toBe('Page not found');
            expect(e.status).toBe(404);
        }
    });

    it('Checks parameters objects if it have required parameters inside', () => {
        const parameters = {
            one: 1,
            two: 2
        };

        expect(() => {
            controllerUtil.checkRequiredParams(parameters);
        }).toThrow('requiredFields argument is required');

        expect(() => {
            controllerUtil.checkRequiredParams(parameters, 'one');
        }).toThrow('requiredFields argument is required');

        expect(() => {
            controllerUtil.checkRequiredParams(null, ['one']);
        }).toThrow('params argument is reqiured');

        controllerUtil.checkRequiredParams(parameters, ['one']);
        controllerUtil.checkRequiredParams(parameters, ['one', 'two']);

        expect(() => {
            controllerUtil.checkRequiredParams(parameters, ['one', 'three']);
        }).toThrow('Parameter [three] is required. ');

        expect(() => {
            controllerUtil.checkRequiredParams(parameters, ['three', 'four']);
        }).toThrow('Parameter [three] is required. Parameter [four] is required. ');
    });
});
