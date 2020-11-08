/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

import { v4 as uuidv4 } from 'uuid';
import { ManagementClient } from '../../../src/bigip';
import { Token } from '../../../src/models';

export const defaultHost = '192.0.2.1';
export const defaultPort = 443;
export const defaultUser = 'admin';
export const defaultPassword = 'admin';

export function getManagementClient(): ManagementClient {
    return new ManagementClient({
        host: defaultHost,
        port: defaultPort,
        user: defaultUser,
        password: defaultPassword
    });
};


/**
 * inclusive random number generator
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 * @param min 
 * @param max 
 */
export function getRandomInt(min, max): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive 
}



/**
 * generates a fake auth token with random value
 */
export function getFakeToken(): { token: Token } {
    return {
        token: {
            token: uuidv4().split('-').pop(),
            timeout: getRandomInt(300, 600)

        }
    }
}
