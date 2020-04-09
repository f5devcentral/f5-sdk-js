/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import * as httpUtils from '../utils/http';

/**
 *
 * Basic Example:
 * 
 * ```
 * import { ManagementClient } from 'f5-sdk-js'.bigip;
 * 
 * const mgmtClient = new ManagementClient({
 *      host: '192.0.2.1',
 *      port: 443,
 *      user: 'admin',
 *      password: 'admin'
 * });
 * await mgmtClient.login();
 * await mgmtClient.makeRequest('/mgmt/tm/sys/version');
 * ```
 */
export class ManagementClient {
    host: string;
    port: number;
    protected _user: string;
    protected _password: string;
    protected _token: string;

    /**
     * @param options function options
     */
    constructor(options: {
        host?: string;
        port?: 443;
        user?: string;
        password?: string;
    }) {
        this.host = options['host'];
        this.port = options['port'];
        this._user = options['user'];
        this._password = options['password'];
    }

    /**
     * Login (using credentials provided during instantiation)
     * 
     * @returns void
     */
    async login(): Promise<void> {
        const response = await httpUtils.makeRequest(
            this.host,
            '/mgmt/shared/authn/login',
            {
                method: 'POST',
                body: {
                    username: this._user,
                    password: this._password,
                    loginProviderName: 'tmos'
                },
                basicAuth: {
                    user: this._user,
                    password: this._password
                }
            }
        );
        this._token = response['token']['token'];
    }

    /**
     * Make HTTP request
     * 
     * @param uri     request URI
     * @param options function options
     * 
     * @returns request response
     */
    async makeRequest(uri: string, options?: {
        method?: string;
        headers?: object;
    }): Promise<object>  {
        options = options || {};

        return await httpUtils.makeRequest(
            this.host,
            uri,
            {
                method: 'GET',
                port: this.port,
                headers: Object.assign(options['headers'] || {}, {
                    'X-F5-Auth-Token': this._token
                })
            }
        );
    }
}