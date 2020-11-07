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
// const timer = require('@szmarczak/http-timer');
import timer from '../../node_modules/@szmarczak/http-timer/dist/source';
import Logger from '../logger';
import * as miscUtils from './misc';
import assert from 'assert';

const logger = Logger.getLogger();

/**
 * custom http response based on axios response
 */
export type HttpResponse = {
    data?: unknown;
    headers?: unknown;
    status: number;
    statusText?: string;
    request?: {
        url: string;
        method: string;
        headers: unknown;
        protocol: string;
        timings: unknown;
        // data?: unknown;
    };
};

/**
 * Used to inject http call timers
 * transport:request: httpsWithTimer
 */
const transport = {
    request: function httpsWithTimer(...args: any[]) {
        const request = https.request.apply(null, args)
        timer(request);
        return request;
    }
};

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
}): Promise<HttpResponse> {
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
        transport,
        validateStatus: null     // no need to set this if we aren't using it right now...
    });

    // not sure what the use case is for on the following "advanced return"
    // withProgress might be a better solution if we are just looking for feedback on long
    // running requests

    // check for advanced return
    if (options.advancedReturn) {
        return {
            data: httpResponse.data,
            status: httpResponse.status
        }
    }

    // check for unsuccessful request
    if (httpResponse.status > 300) {
        return Promise.reject(new Error(
            `HTTP request failed: ${httpResponse.status} ${miscUtils.stringify(httpResponse.data)}`
        ));
    }
    // return response body
    return {
        data: httpResponse.data,
        headers: httpResponse.headers,
        status: httpResponse.status,
        statusText: httpResponse.statusText,
        request: {
            url: httpResponse.config.url,
            method: httpResponse.request.method,
            headers: httpResponse.request.headers,
            protocol: httpResponse.config.httpsAgent.protocol,
            timings: httpResponse.request.timings,
            // data: httpResponse.data
        }
    };
}

/**
 * Download HTTP payload to file
 *
 * @param url  url
 * @param file local file location where the downloaded contents should go
 *
 * @returns void
 */
export async function downloadToFile(url: string, file: string): Promise<HttpResponse> {
    return new Promise(((resolve, reject) => {
        axios({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            }),
            method: 'GET',
            url,
            transport,
            responseType: 'stream'
        })
        .then(function (response) {
            response.data.pipe(fs.createWriteStream(file))
                .on('finish', () => {
                    return resolve({
                        data: response.data,
                        headers: response.headers,
                        status: response.status,
                        statusText: response.statusText,
                        request: {
                            url: response.config.url,
                            method: response.request.method,
                            headers: response.request.headers,
                            protocol: response.config.httpsAgent.protocol,
                            timings: response.request.timings
                        }
                    })
                });
        })
        .catch( err => {
            // look at adding more failure details, like,
            // was it tcp, dns, dest url problem, write file problem, ...
            return reject(err)
        })
    }));
}



/////// the following doesn't seem to be used
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
    // const a = url;
    const b = new URL(url);
    const c = {
        host: b.host,
        path: b.pathname
    }

    const x = {
        host: url.split('://')[1].split('/')[0],
        path: `/${url.split('://')[1].split('/').slice(1).join('/')}`
    }

    assert.deepStrictEqual(x, c, 'should be equal');
    return x;
}