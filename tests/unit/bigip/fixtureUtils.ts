/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

import { ManagementClient } from '../../../src/bigip';
import { Token } from '../../../src/models';

export const defaultHost = '192.0.2.1';
export const defaultPort = 443;
export const defaultUser = 'admin';
export const defaultPassword = 'admin';

export const ipv6Host = '[2607:f0d0:1002:51::5]'

export function getManagementClient(): ManagementClient {
    return new ManagementClient(
        defaultHost,
        defaultUser,
        defaultPassword
    );
};


export function getManagementClientIpv6(): ManagementClient {
    return new ManagementClient(
        ipv6Host,
        defaultUser,
        defaultPassword
    );
};


/**
 * inclusive random number generator
 * 
 * @param min 
 * @param max 
 */
export function getRandomInt(min: number, max: number): number {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random

    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive 
}


/**
 * builds a short randon uuid - just for some randomness during testing
 * 
 * @param length
 * @example 
 * getRandomUUID(8) // returns 8pSJP15R
 * 
 */
export function getRandomUUID(length: number): string {
    // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript

    // was using the last part of a uuidv4 string, but that required an external dep to generate the uuid
    const result = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result.push(chars.charAt(Math.floor(Math.random() * chars.length)));
    }
    return result.join('');
}



/**
 * generates a fake auth token with random value
 */
export function getFakeToken(): { token: Token } {

    return {
        token: {
            token: getRandomUUID(8),
            timeout: getRandomInt(300, 600)

        }
    }
}
