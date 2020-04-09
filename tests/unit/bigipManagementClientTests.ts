/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import assert from 'assert';
import nock from 'nock';

import { ManagementClient } from '../../src/bigip';

describe('BIG-IP: Management Client', function() {
    let mgmtClient;
    const defaultHost = '192.0.2.1';
    const defaultPort = 443;
    const defaultUser = 'admin';
    const defaultPassword = 'admin';

    beforeEach(function() {
        mgmtClient = new ManagementClient({
            host: defaultHost,
            port: defaultPort,
            user: defaultUser,
            password: defaultPassword
        });
    });
    afterEach(function() {
        if(!nock.isDone()) {
            throw new Error('Not all nock interceptors were used!')
        }
        nock.cleanAll();
    })

    it('should init', function() {
        assert.strictEqual(mgmtClient.host, defaultHost);
        assert.strictEqual(mgmtClient.port, defaultPort);
    });

    it('should login', async function() {
        nock(`https://${defaultHost}`)
            .post('/mgmt/shared/authn/login')
            .reply(200, { token: { 'token': '1234' } });

        await mgmtClient.login();
    });

    it('should make request', async function() {
        nock(`https://${defaultHost}`)
            .post('/mgmt/shared/authn/login')
            .reply(200, { token: { 'token': '1234' } })
            .get('/foo')
            .reply(200, { foo: 'bar' });

        await mgmtClient.login();
        const response = await mgmtClient.makeRequest('/foo');
        assert.deepStrictEqual(response, { foo: 'bar' })
    });
});