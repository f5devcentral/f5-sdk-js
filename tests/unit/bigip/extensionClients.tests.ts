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

import { getManagementClient, defaultHost, getFakeToken } from './fixtureUtils';

import { ManagementClient } from '../../../src/bigip';
import { AS3Client, DOClient, TSClient, CFClient } from '../../../src/bigip/extension';

const FIXED_INFO = {
    'as3': {
        name: 'f5-appsvcs',
        packageName: 'f5-appsvcs-3.10.0-5.noarch',
        version: '3.10.0',
        endpoints: {
            info: '/mgmt/shared/appsvcs/info',
            primary: '/mgmt/shared/appsvcs/declare'
        }
    },
    'do': {
        name: 'f5-declarative-onboarding',
        packageName: 'f5-declarative-onboarding-1.10.0-2.noarch',
        version: '1.10.0',
        endpoints: {
            info: '/mgmt/shared/declarative-onboarding/info',
            primary: '/mgmt/shared/declarative-onboarding',
            inspect: '/mgmt/shared/declarative-onboarding/inspect'
        }
    },
    'ts': {
        name: 'f5-telemetry',
        packageName: 'f5-telemetry-1.10.0-2.noarch',
        version: '1.10.0',
        endpoints: {
            info: '/mgmt/shared/telemetry/info',
            primary: '/mgmt/shared/telemetry/declare'
        }
    },
    'cf': {
        name: 'f5-cloud-failover',
        packageName: 'f5-cloud-failover-1.1.0-0.noarch',
        version: '1.1.0',
        endpoints: {
            info: '/mgmt/shared/cloud-failover/info',
            primary: '/mgmt/shared/cloud-failover/declare',
            inspect: '/mgmt/shared/cloud-failover/inspect',
            trigger: '/mgmt/shared/cloud-failover/trigger',
            reset: '/mgmt/shared/cloud-failover/reset'
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getExtensionClient(component: string, mgmtClient: ManagementClient): any {
    if (component === 'as3') return new AS3Client(mgmtClient);
    if (component === 'do') return new DOClient(mgmtClient);
    if (component === 'ts') return new TSClient(mgmtClient);
    if (component === 'cf') return new CFClient(mgmtClient);
    throw new Error (`Unknown component: ${component}`)
}

['as3', 'do', 'ts', 'cf'].forEach((component) => {
    describe(`BIG-IP extension client generic tests: ${component}`, function() {
        let extensionClient;
        let mgmtClient: ManagementClient;

        beforeEach(async function() {
            // nock(`https://${defaultHost}`)
            //     .post('/mgmt/shared/authn/login')
            //     .reply(200, getFakeToken());

            mgmtClient = getManagementClient();
            // await mgmtClient.login();

            // clear any existing tokens, just to be safe
            // await mgmtClient.clearToken();

            extensionClient = getExtensionClient(component, mgmtClient);
        });
        afterEach(async function() {
            if(!nock.isDone()) {
                throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
            }
            nock.cleanAll();
            // clear token since we are done with this test
        });

        it('should get latest metadata', async function() {
            nock(`https://cdn.f5.com`)
                .get('/product/cloudsolutions/f5-extension-metadata/latest/metadata.json')
                .reply(200, {});

            await extensionClient.getLatestMetadata();
        });

        describe('Package Operations', async function() {
            it(`should validate package is installed`, async function() {
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .post('/mgmt/shared/iapp/package-management-tasks')
                    .reply(200, { id: '1234' })
                    .get('/mgmt/shared/iapp/package-management-tasks/1234')
                    .reply(200, {
                        id: '1234',
                        status: 'FINISHED',
                        queryResponse: [
                            {
                                name: FIXED_INFO[component]['name'],
                                packageName: FIXED_INFO[component]['packageName']
                            }
                        ]
                    });
                
                const response = await extensionClient.package.isInstalled();
                assert.strictEqual(response.installed, true);
                assert.strictEqual(response.installedVersion, FIXED_INFO[component]['version']);
                assert.notStrictEqual(response.latestVersion, '');
                await mgmtClient.clearToken();
            });
        
            it(`should validate package is not installed`, async function() {
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .post('/mgmt/shared/iapp/package-management-tasks')
                    .reply(200, { id: '1234' })
                    .get('/mgmt/shared/iapp/package-management-tasks/1234')
                    .reply(200, {
                        id: '1234',
                        status: 'FINISHED',
                        queryResponse: [
                            {
                                name: '',
                                packageName: ''
                            }
                        ]
                    });
                
                const response = await extensionClient.package.isInstalled();
                assert.strictEqual(response.installed, false);
                assert.strictEqual(response.installedVersion, '');
                assert.notStrictEqual(response.latestVersion, '');
                await mgmtClient.clearToken();
            });
        
            it(`should install package`, async function() {
                nock(`https://github.com`)
                    .get(uri => uri.includes('/'))
                    .reply(200, 'raw');
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .post(uri => uri.includes('/mgmt/shared/file-transfer/uploads/'))
                    .reply(200, { id: '1234' })
                    .post('/mgmt/shared/iapp/package-management-tasks')
                    .reply(200, { id: '1234' })
                    .get('/mgmt/shared/iapp/package-management-tasks/1234')
                    .reply(200, { id: '1234', status: 'FINISHED' });
                
                const response = await extensionClient.package.install();
                assert.strictEqual(response['component'], component);
                await mgmtClient.clearToken();
            });
        
            it(`should install package (+ wait for package management task completion)`, async function() {
                nock(`https://github.com`)
                    .get(uri => uri.includes('/'))
                    .reply(200, 'raw');
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .post(uri => uri.includes('/mgmt/shared/file-transfer/uploads/'))
                    .reply(200, { id: '1234' })
                    .post('/mgmt/shared/iapp/package-management-tasks')
                    .reply(200, { id: '1234' })
                    .get('/mgmt/shared/iapp/package-management-tasks/1234')
                    .reply(200, { id: '1234', status: 'INSTALLING' })
                    .get('/mgmt/shared/iapp/package-management-tasks/1234')
                    .reply(200, { id: '1234', status: 'FINISHED' });
                
                const response = await extensionClient.package.install();
                assert.strictEqual(response['component'], component);
                await mgmtClient.clearToken();
            });

            it(`should install package and perform file hash verification`, async function() {
                nock(`https://github.com`)
                    .get(uri => uri.includes('/'))
                    .reply(200, 'raw');
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .post(uri => uri.includes('/mgmt/shared/file-transfer/uploads/'))
                    .reply(200, { id: '1234' })
                    .post('/mgmt/shared/iapp/package-management-tasks')
                    .reply(200, { id: '1234' })
                    .get('/mgmt/shared/iapp/package-management-tasks/1234')
                    .reply(200, { id: '1234', status: 'FINISHED' });

                const response = await extensionClient.package.install({
                    hash: 'd7439bee24773bcbfa2d0a97947ee36227b10d1022b1a55847e928965bb6bfde'
                });
                assert.strictEqual(response['component'], component);
                await mgmtClient.clearToken();
            });
        
            it(`should uninstall package`, async function() {
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .post('/mgmt/shared/iapp/package-management-tasks')
                    .reply(200, { id: '1234' })
                    .get('/mgmt/shared/iapp/package-management-tasks/1234')
                    .reply(200, {
                        id: '1234',
                        status: 'FINISHED',
                        queryResponse: [
                            {
                                name: FIXED_INFO[component]['name'],
                                packageName: FIXED_INFO[component]['packageName']
                            }
                        ]
                    })
                    .post('/mgmt/shared/iapp/package-management-tasks')
                    .reply(200, { id: '1234' })
                    .get('/mgmt/shared/iapp/package-management-tasks/1234')
                    .reply(200, { id: '1234', status: 'FINISHED' });
                
                const response = await extensionClient.package.uninstall();
                assert.strictEqual(response['component'], component);
                assert.strictEqual(response['version'], FIXED_INFO[component]['version']);
                await mgmtClient.clearToken();
            });
        
            it(`should uninstall package (when package is not installed)`, async function() {
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .post('/mgmt/shared/iapp/package-management-tasks')
                    .reply(200, { id: '1234' })
                    .get('/mgmt/shared/iapp/package-management-tasks/1234')
                    .reply(200, {
                        id: '1234',
                        status: 'FINISHED',
                        queryResponse: [
                            {
                                name: '',
                                packageName: ''
                            }
                        ]
                    });
                
                const response = await extensionClient.package.uninstall();
                assert.strictEqual(response['component'], component);
                assert.strictEqual(response['version'], '');
                await mgmtClient.clearToken();
            });

            it(`should list available component versions`, async function() {
                const response = await extensionClient.package.getVersionsList();
                assert.strictEqual(response.includes(FIXED_INFO[component]['version']), true);
            });
        });

        describe('Service Operations', async function() {
            it(`should validate service is available`, async function() {
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .get(FIXED_INFO[component]['endpoints']['primary'])
                    .reply(200, {});

                const response = await extensionClient.service.isAvailable();
                assert.strictEqual(response, true);
                await mgmtClient.clearToken();
            });

            it(`should validate service is not available`, async function() {
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .get(FIXED_INFO[component]['endpoints']['primary'])
                    .reply(500, {});

                const response = await extensionClient.service.isAvailable();
                assert.strictEqual(response, false);
                await mgmtClient.clearToken();
            });

            it(`should show service info`, async function() {
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .get(FIXED_INFO[component]['endpoints']['info'])
                    .reply(200, {});

                const response = await extensionClient.service.showInfo();
                assert.deepStrictEqual(response.data, {});
                await mgmtClient.clearToken();
            });

            it(`should perform create operation`, async function() {
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .post(FIXED_INFO[component]['endpoints']['primary'])
                    .reply(200, {});

                const response = await extensionClient.service.create({ config: {} });
                assert.deepStrictEqual(response, {});
                await mgmtClient.clearToken();
            });

            it(`should perform create operation (async task response)`, async function() {
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .post(FIXED_INFO[component]['endpoints']['primary'])
                    .reply(202, { selfLink: 'https://localhost/task/1234'})
                    .get('/task/1234')
                    .reply(202, {})
                    .get('/task/1234')
                    .reply(200, {});

                const response = await extensionClient.service.create({ config: {} });
                assert.deepStrictEqual(response, {});
                await mgmtClient.clearToken();
            });

            it(`should perform show operation`, async function() {
                nock(`https://${defaultHost}`)
                    .post('/mgmt/shared/authn/login')
                    .reply(200, getFakeToken())
                    .get(FIXED_INFO[component]['endpoints']['primary'])
                    .reply(200, {});

                const response = await extensionClient.service.show();
                assert.deepStrictEqual(response.data, {});
                await mgmtClient.clearToken();
            });
        });
    });
});

describe('BIG-IP extension client specific tests: as3', function() {
    let extensionClient;
    let mgmtClient: ManagementClient;
    const component = 'as3';

    beforeEach(async function() {
        nock(`https://${defaultHost}`)
            .post('/mgmt/shared/authn/login')
            .reply(200, getFakeToken());

        
        mgmtClient = getManagementClient();
        // await mgmtClient.login();
        await mgmtClient.clearToken();

        extensionClient = getExtensionClient(component, mgmtClient);
    });
    afterEach(async function() {
        if(!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
        }
        nock.cleanAll();
        await mgmtClient.clearToken();
    });

    describe('Service Operations', function() {
        it(`should perform delete operation`, async function() {
            nock(`https://${defaultHost}`)
                .delete(FIXED_INFO[component]['endpoints']['primary'])
                .reply(200, {});

            const response = await extensionClient.service.delete();
            assert.deepStrictEqual(response.data, {});
        });
    });
});

describe('BIG-IP extension client specific tests: do', function() {
    let extensionClient;
    let mgmtClient: ManagementClient;
    const component = 'do';

    beforeEach(async function() {
        nock(`https://${defaultHost}`)
            .post('/mgmt/shared/authn/login')
            .reply(200, getFakeToken);

        mgmtClient = getManagementClient();
        // await mgmtClient.login();
        await mgmtClient.clearToken();

        extensionClient = getExtensionClient(component, mgmtClient);
    });
    afterEach(async function() {
        if(!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
        }
        nock.cleanAll();
        await mgmtClient.clearToken();
    });

    describe('Service Operations', function() {
        it(`should perform show inspect operation`, async function() {
            nock(`https://${defaultHost}`)
                .get(FIXED_INFO[component]['endpoints']['inspect'])
                .reply(200, {});

            const response = await extensionClient.service.showInspect();
            assert.deepStrictEqual(response.data, {});
        });
    });
});

describe('BIG-IP extension client specific tests: cf', function() {
    let extensionClient;
    let mgmtClient: ManagementClient;
    const component = 'cf';

    beforeEach(async function() {
        nock(`https://${defaultHost}`)
            .post('/mgmt/shared/authn/login')
            .reply(200, getFakeToken);

        mgmtClient = getManagementClient();
        // await mgmtClient.login();
        await mgmtClient.clearToken();
        
        extensionClient = getExtensionClient(component, mgmtClient);
    });
    afterEach(async function() {
        if(!nock.isDone()) {
            throw new Error(`Not all nock interceptors were used: ${nock.pendingMocks()}`)
        }
        nock.cleanAll();
        await mgmtClient.clearToken();
    });

    describe('Service Operations', function() {
        it(`should perform show inspect operation`, async function() {
            nock(`https://${defaultHost}`)
                .get(FIXED_INFO[component]['endpoints']['inspect'])
                .reply(200, {});

            const response = await extensionClient.service.showInspect();
            assert.deepStrictEqual(response.data, {});
        });

        it(`should perform show trigger operation`, async function() {
            nock(`https://${defaultHost}`)
                .get(FIXED_INFO[component]['endpoints']['trigger'])
                .reply(200, {});

            const response = await extensionClient.service.showTrigger();
            assert.deepStrictEqual(response.data, {});
        });

        it(`should perform show trigger operation`, async function() {
            nock(`https://${defaultHost}`)
                .post(FIXED_INFO[component]['endpoints']['trigger'])
                .reply(200, {});

            const response = await extensionClient.service.trigger({ config: {} });
            assert.deepStrictEqual(response.data, {});
        });

        it(`should perform show reset operation`, async function() {
            nock(`https://${defaultHost}`)
                .post(FIXED_INFO[component]['endpoints']['reset'])
                .reply(200, {});

            const response = await extensionClient.service.reset({ config: {} });
            assert.deepStrictEqual(response.data, {});
        });
    });
});