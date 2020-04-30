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

class AS3ServiceClient extends ServiceClient {
    constructor(mgmtClient: ManagementClient, metadataClient: MetadataClient) {
        super(mgmtClient, metadataClient);
    }

    /**
     * Perform 'delete' operation
     *
     * @returns service API response
     */
    async delete(): Promise<object> {
        return await this._delete();
    }
}

/**
 *
 * Basic Example:
 * 
 * ```
 * const extensionClient = AS3Client(mgmtClient);
 * 
 * await extensionClient.package.install();
 * ```
 */
export class AS3Client {
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
        this._metadataClient = new MetadataClient('as3', { componentVersion: this._version });
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

    get service(): AS3ServiceClient {
        return new AS3ServiceClient(this._mgmtClient, this._metadataClient);
    }
}