// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
// Copyright (C) 2026 (original work) Open Assessment Technologies SA;
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

const OWNER_APP = 'content-service';

const STATUSES = {
    REMOVED: 'removed',
    FAILED: 'failed'
};

const ADMIN_USER_ID = process.env.DATA_POLICY_REASSIGN_USER_ID || 'admin';

module.exports = { OWNER_APP, STATUSES, ADMIN_USER_ID };
