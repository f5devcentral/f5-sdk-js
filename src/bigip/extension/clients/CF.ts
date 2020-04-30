/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { ManagementClient } from '../../managementClient';
import { MetadataClient } from '../metadata';
import { PackageClient } from '../package';
import { ServiceClient } from '../service';

class CFServiceClient extends ServiceClient {
    constructor(mgmtClient: ManagementClient, metadataClient: MetadataClient) {
        super(mgmtClient, metadataClient);
    }

    /**
     * Perform 'reset' operation
     *
     * @param options function options
     * 
     * @returns service API response
     */
    async reset(options?: { config?: object }): Promise<object> {
        return await this._reset(options);
    }

    /**
     * Perform 'show inspect' operation
     *
     * @returns service API response
     */
    async showInspect(): Promise<object> {
        return await this._showInspect();
    }

    /**
     * Perform 'show trigger' operation
     *
     * @returns service API response
     */
    async showTrigger(): Promise<object> {
        return await this._showTrigger();
    }

    /**
     * Perform 'trigger' operation
     *
     * @param options function options
     * 
     * @returns service API response
     */
    async trigger(options?: { config?: object }): Promise<object> {
        return await this._trigger(options);
    }
}

/**
 *
 * Basic Example:
 * 
 * ```
 * const extensionClient = CFClient(mgmtClient);
 * 
 * await extensionClient.package.install();
 * ```
 */
export class CFClient {
    protected _mgmtClient: ManagementClient;
    protected _version: string;
    protected _metadataClient: MetadataClient;

    /**
     *
     * @param mgmtClient management client
     * @param options    function options
     *
     * @returns void
     */
    constructor(mgmtClient: ManagementClient, options?: {
        version?: string;
    }) {
        options = options || {};

        this._mgmtClient = mgmtClient;
        this._version = options['version'];
        this._metadataClient = new MetadataClient('cf', { componentVersion: this._version });
    }

    /**
     * Get 'latest' metadata
     *
     * @returns void
     */
    async getLatestMetadata(): Promise<void> {
        return await this._metadataClient.getLatestMetadata();
    }

    get package(): PackageClient {
        return new PackageClient(this._mgmtClient, this._metadataClient);
    }

    get service(): CFServiceClient {
        return new CFServiceClient(this._mgmtClient, this._metadataClient);
    }
}