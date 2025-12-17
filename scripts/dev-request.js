// SPDX-FileCopyrightText: 2012-2026 Open Assessment Technologies S.A.
//
// SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License

/* eslint-disable no-console */

/**
 * This script makes predefined requests to the content-service API.
 * It can be used as an alternative to Postman or Swagger web interface.
 */

if (typeof fetch === 'undefined') {
    const fetch = require('node-fetch');
    global.fetch = fetch;
}

const storageBaseUrl =
    process.env.STORAGE_BASE_URL || 'http://nextgen-tao-content-be.nextgen-stack.orb.local:3000/storage';
const apiBaseUrl = process.env.API_BASE_URL || 'http://nextgen-tao-content-be.nextgen-stack.orb.local:3000/api/v1';
const tenantId = process.env.TENANT_ID || 'local-dev-acc.nextgen-stack-local';
const driverId = 'file'; // private|public|file

function printUsage() {
    console.log('Usage: node dev-request.js [command_key]');
}

async function callApi(method, path, params, body, headers) {
    try {
        const url = new URL(`${apiBaseUrl}/${path}`);
        const opts = {
            method
        };
        url.search = new URLSearchParams({ driverId, ...params });

        if (body) {
            opts.body = body instanceof FormData ? body : JSON.stringify(body);
        }
        if (headers) {
            opts.headers = headers;
        }
        console.log('Calling API:', method, url.href, body, headers);
        const response = await fetch(url.href, opts);
        console.log('Response:', response.status);
        if (path.includes('/stream/')) {
            for await (const chunk of response.body) {
                console.log(chunk);
            }
            return;
        }
        console.dir(await response.json(), { depth: null });
    } catch (err) {
        console.error(err);
    }
}

async function getStatic() {
    const path = `${tenantId}/import-csv/pending/123.csv?filename=foo.csv`;
    const res = await fetch(`${storageBaseUrl}/${path}`);
    console.log('Response:', res.status);
    console.log('Headers:', res.headers);
}

async function getAsset() {
    const assetId = 'aaa';
    const path = `tenants/${tenantId}/assets/${assetId}`;
    await callApi('GET', path);
}

async function getAssets() {
    const path = `tenants/${tenantId}/assets/?id[]=aaa&id[]=bbb`;
    await callApi('GET', path);
}

async function getDownloadUrl() {
    const virtualPath = 'import-csv/pending/123.csv';
    const path = `download/${tenantId}/${virtualPath}`;
    await callApi('GET', path);
}

async function getFolderFiles() {
    const virtualFolder = 'import-csv/processed';
    const path = `files/${virtualFolder}`;
    const params = {
        // maxResults: 1
    };
    await callApi('GET', path, params, void 0);
}

async function getFileStream() {
    const storagePath = 'import-csv/pending/123.csv';
    const path = `files/stream/${tenantId}/${storagePath}`;
    await callApi('GET', path);
}

async function postUpload() {
    const ts = Date.now();
    const filename = `${ts}.csv`;
    const virtualPath = `import-csv/pending/${filename}`;
    const path = `upload/${tenantId}/${virtualPath}`;
    const params = {
        assetId: ts,
        filePath: virtualPath
    };
    const body = 'this,is,a,csv,row';
    const headers = {
        'Content-Type': 'text/csv',
        'X-UserId': 'cli'
    };
    await callApi('POST', path, params, body, headers);
}

async function postUploadMultipart() {
    const ts = Date.now();
    const filename = `${ts}-multipart.csv`;
    const virtualPath = `import-csv/pending/${filename}`;
    const path = `upload/multipart/${tenantId}/${virtualPath}`;
    const params = {
        assetId: ts,
        filePath: virtualPath
    };
    const fileContents = 'this,is,a,csv,row';
    const metadata = {
        foo: 'bar'
    };
    const file = new File([fileContents], 'cli-file.csv');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    const headers = {
        'X-UserId': 'cli'
    };
    await callApi('POST', path, params, formData, headers);
}

async function postMoveFile() {
    const virtualPath = 'import-csv/pending/123.csv';
    const newVirtualPath = 'import-csv/processed/123.csv';
    const newStoragePath = `${tenantId}/import-csv/processed/123.csv`;
    const path = `files/move/${tenantId}`;
    const body = { virtualPath, newVirtualPath, newStoragePath };
    const headers = {
        'Content-Type': 'application/json'
    };
    await callApi('POST', path, {}, body, headers);
}

switch (process.argv[2]) {
    case 'ga':
        getAsset();
        break;
    case 'gas':
        getAssets();
        break;
    case 'gd':
        getDownloadUrl();
        break;
    case 'gs':
        getStatic();
        break;
    case 'pu':
        postUpload();
        break;
    case 'gff':
        getFolderFiles();
        break;
    case 'gfs':
        getFileStream();
        break;
    case 'pum':
        postUploadMultipart();
        break;
    case 'pmv':
        postMoveFile();
        break;
    default:
        console.log('Unknown argument');
        printUsage();
        process.exit(1);
}
