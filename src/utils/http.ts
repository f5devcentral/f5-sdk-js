/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import * as fs from 'fs';
import https from 'https';
import axios from 'axios';

import Logger from '../logger';
import * as miscUtils from './misc';

const logger = Logger.getLogger();

/**
 * Make generic HTTP request
 * 
 * @param host    host where request should be made
 * @param uri     request uri
 * @param options function options
 * 
 * @returns response data
 */
export async function makeRequest(host: string, uri: string, options?: {
    method?: any; /* eslint-disable-line @typescript-eslint/no-explicit-any */
    port?: number;
    body?: object;
    headers?: object;
    basicAuth?: object;
    advancedReturn?: boolean;
}): Promise<object> {
    options = options || {};

    logger.debug(`Making HTTP request: ${host} ${uri} ${miscUtils.stringify(options)}`);

    const httpResponse = await axios.request<Response>({
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
        method: options['method'] || 'GET',
        baseURL: `https://${host}:${options['port'] || 443}`,
        url: uri,
        headers: options['headers'] !== undefined ? options['headers'] : {},
        data: options['body'] || null,
        auth: options['basicAuth'] !== undefined ? {
            username: options['basicAuth']['user'],
            password: options['basicAuth']['password']
        } : null,
        validateStatus: null
    });

    // check for advanced return
    if (options.advancedReturn) {
        return {
            statusCode: httpResponse.status,
            body: httpResponse.data
        }
    }

    // check for unsuccessful request
    if (httpResponse.status > 300) {
        return Promise.reject(new Error(
            `HTTP request failed: ${httpResponse.status} ${miscUtils.stringify(httpResponse.data)}`
        ));
    }
    // return response body
    return httpResponse.data;
}

/**
 * Download HTTP payload to file
 *
 * @param url  url
 * @param file local file location where the downloaded contents should go
 *
 * @returns void
 */
export async function downloadToFile(url: string, file: string): Promise<void> {
    await new Promise(((resolve) => {
        axios({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
            method: 'GET',
            url,
            responseType: 'stream'
        })
        .then(function (response) {
            response.data.pipe(fs.createWriteStream(file))
                .on('finish', resolve);
        })
    }));
}

/**
 * Parse URL
 *
 * @param url  url
 *
 * @returns parsed url properties
 */
export function parseUrl(url: string): {
    host: string;
    path: string;
} {
    return {
        host: url.split('://')[1].split('/')[0],
        path: `/${url.split('://')[1].split('/').slice(1).join('/')}`
    };
}