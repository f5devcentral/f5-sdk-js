/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import assert from 'assert';
import * as fs from 'fs';
import * as url from 'url';

import http from 'http';
import https, { Agent } from 'https';
// import { RequestOptions } from 'https';

import { HttpRequest } from '../models'

import axios from 'axios';
import Logger from '../logger';
import * as miscUtils from './misc';

const TIMEOUT_IN_MILLISECONDS = 30 * 1000
const NS_PER_SEC = 1e9
const MS_PER_NS = 1e6

const logger = Logger.getLogger();


// https://nodejs.org/docs/latest-v12.x/api/http.html#http_http_request_url_options_callback

export async function requestNew(options: HttpRequest) {
    // options = options || {};

    // const defaultOpts = {
    //     // protocol: 'https:',
    //     // port: 443,
    //     // method: 'GET',
    //     // or make 'undefined'
    //     // body: options.body || '{}',
    //     // rejectUnauthorized: false,
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // };



    // const combOpts = Object.assign({}, defaultOpts, options);

    // options.hostname = host;

    // Validation
    assert(options.protocol, 'options.protocol is required')
    assert(['http:', 'https:'].includes(options.protocol), 'options.protocol must be one of: "http:", "https:"')
    assert(options.host, 'options.hostname is required')
    // assert(callback, 'callback is required')

    // Initialization
    const eventTimes = {
        // use process.hrtime() as it's not a subject of clock drift
        startAt: process.hrtime(),
        dnsLookupAt: undefined,
        tcpConnectionAt: undefined,
        tlsHandshakeAt: undefined,
        firstByteAt: undefined,
        endAt: undefined
    }

    // Making request
    // const req = (combOpts.protocol.startsWith('https') ? https : http).request({
    return new Promise((resolve, reject) => {
        const req =  https.request(options, (res) => {
            let responseBody = ''

            req.setTimeout(TIMEOUT_IN_MILLISECONDS)

            // Response events
            res.once('readable', () => {
                eventTimes.firstByteAt = process.hrtime()
            })
            res.on('data', (chunk) => { responseBody += chunk })

            // End event is not emitted when stream is not consumed fully
            // in our case we consume it see: res.on('data')
            res.on('end', () => {
                eventTimes.endAt = process.hrtime()

                return resolve({
                    headers: res.headers,
                    timings: getTimings(eventTimes),
                    body: responseBody
                })
            })
        })

        // Request events
        req.on('socket', (socket) => {
            socket.on('lookup', () => {
                eventTimes.dnsLookupAt = process.hrtime()
            })
            socket.on('connect', () => {
                eventTimes.tcpConnectionAt = process.hrtime()
            })
            socket.on('secureConnect', () => {
                eventTimes.tlsHandshakeAt = process.hrtime()
            })
            socket.on('timeout', () => {
                req.abort()

                // const err = new Error('ETIMEDOUT')
                // err.code = 'ETIMEDOUT'
                // callback(err)
            })
        })
        req.on('error', (e) => {
            console.error('http error something', e);
        })

        // // Sending body
        // if (combOpts.body) {
        //     req.write(combOpts.body)
        // }

        req.end()
        return req;
    });
}

/**
* Calculates HTTP timings
* @function getTimings
* @param {Object} eventTimes
* @param {Number} eventTimes.startAt
* @param {Number|undefined} eventTimes.dnsLookupAt
* @param {Number} eventTimes.tcpConnectionAt
* @param {Number|undefined} eventTimes.tlsHandshakeAt
* @param {Number} eventTimes.firstByteAt
* @param {Number} eventTimes.endAt
* @return {Object} timings - { dnsLookup, tcpConnection, tlsHandshake, firstByte, contentTransfer, total }
*/
function getTimings(eventTimes) {
    return {
        // There is no DNS lookup with IP address
        dnsLookup: eventTimes.dnsLookupAt !== undefined ?
            getHrTimeDurationInMs(eventTimes.startAt, eventTimes.dnsLookupAt) : undefined,
        tcpConnection: getHrTimeDurationInMs(eventTimes.dnsLookupAt || eventTimes.startAt, eventTimes.tcpConnectionAt),
        // There is no TLS handshake without https
        tlsHandshake: eventTimes.tlsHandshakeAt !== undefined ?
            (getHrTimeDurationInMs(eventTimes.tcpConnectionAt, eventTimes.tlsHandshakeAt)) : undefined,
        firstByte: getHrTimeDurationInMs((eventTimes.tlsHandshakeAt || eventTimes.tcpConnectionAt), eventTimes.firstByteAt),
        contentTransfer: getHrTimeDurationInMs(eventTimes.firstByteAt, eventTimes.endAt),
        total: getHrTimeDurationInMs(eventTimes.startAt, eventTimes.endAt)
    }
}

/**
* Get duration in milliseconds from process.hrtime()
* @function getHrTimeDurationInMs
* @param {Array} startTime - [seconds, nanoseconds]
* @param {Array} endTime - [seconds, nanoseconds]
* @return {Number} durationInMs
*/
function getHrTimeDurationInMs(startTime, endTime) {
    const secondDiff = endTime[0] - startTime[0]
    const nanoSecondDiff = endTime[1] - startTime[1]
    const diffInNanoSecond = secondDiff * NS_PER_SEC + nanoSecondDiff

    return diffInNanoSecond / MS_PER_NS
}

// // Getting timings
// requestNew('https://api.chucknorris.io', '/jokes/random', {
//     headers: {
//         'User-Agent': 'Example'
//     }
// }), (err, res) => {
//     console.log(err || res.timings)
// };