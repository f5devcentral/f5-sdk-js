/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

import { ManagementClient } from '../../../src/bigip';

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