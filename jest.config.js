// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2023 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

module.exports = {
    verbose: true,
    coveragePathIgnorePatterns: ['<rootDir>/src/configs/', 'node_modules'],
    coverageReporters: ['lcov', 'html'],
    testTimeout: 100000
};

require('dotenv-flow').config();
