/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import * as constants from '../../constants';
import * as miscUtils from '../../utils/misc';

import { ManagementClient } from '../index';
import { MetadataClient } from './metadata';

const SELF_LINK_HOST = 'https://localhost';

export class ServiceClient {
    protected _mgmtClient: ManagementClient;
    protected _metadataClient: MetadataClient;
    protected _component: string;
    protected _componentVersion: string;

    /**
     *
     * @param mgmtClient     management client
     * @param metadataClient metadata client
     *
     * @returns void
     */
    constructor(mgmtClient: ManagementClient, metadataClient: MetadataClient) {
        this._mgmtClient = mgmtClient;
        this._metadataClient = metadataClient;

        this._component = this._metadataClient.getComponentName();
        this._componentVersion = this._metadataClient.getComponentVersion();
    }

    /**
     * Check if service is available
     *
     * @returns availability status
     */
    async isAvailable(): Promise<boolean> {
        const response = await this._mgmtClient.makeRequest(
            this._metadataClient.getConfigurationEndpoint().endpoint,
            {
                advancedReturn: true
            }
        );

        if (!response['statusCode'].toString().startsWith('2')) {
            return false;
        }
        return true;
    }

    /**
     * Perform 'create' operation
     *
     * @param options function options
     *
     * @returns service API response
     */
    async create(options: { config?: object }): Promise<object> {
        options = options || {};

        const response = await this._mgmtClient.makeRequest(
            this._metadataClient.getConfigurationEndpoint().endpoint,
            {
                method: 'POST',
                body: options.config,
                advancedReturn: true
            }
        );

        if (response['statusCode'] === constants.HTTP_STATUS_CODES.ACCEPTED) {
            return await this._waitForTask(response['body']['selfLink'].split(SELF_LINK_HOST)[1]);
        }
        return response['body'];
    }

    /**
     * Perform 'show' operation
     *
     * @returns service API response
     */
    async show(): Promise<object> {
        return await this._mgmtClient.makeRequest(
            this._metadataClient.getConfigurationEndpoint().endpoint
        );
    }

    /**
     * Show service information
     *
     * @returns service information
     */
    async showInfo(): Promise<object> {
        return await this._mgmtClient.makeRequest(
            this._metadataClient.getInfoEndpoint().endpoint
        );
    }

    /**
     * Check if task state passed
     *
     * @param taskUri task URI
     *
     * @returns service API response
     */
    protected async _checkTaskState(taskUri: string): Promise<object> {
        const taskResponse = await this._mgmtClient.makeRequest(taskUri, { advancedReturn: true });

        if (taskResponse['statusCode'] !== constants.HTTP_STATUS_CODES.OK) {
            return Promise.reject(
                new Error(`Task state has not passed: ${taskResponse['statusCode']}`)
            );
        }
        return taskResponse['body'];
    }

    /**
     * Perform 'delete' operation
     *
     * @returns service API response
     */
    protected async _delete(): Promise<object> {
        return await this._mgmtClient.makeRequest(
            this._metadataClient.getConfigurationEndpoint().endpoint,
            {
                method: 'DELETE'
            }
        );
    }

    /**
     * Perform 'reset' operation
     * 
     * @param options function options
     *
     * @returns service API response
     */
    protected async _reset(options?: { config?: object }): Promise<object> {
        options = options || {};

        return await this._mgmtClient.makeRequest(
            this._metadataClient.getResetEndpoint().endpoint,
            {
                method: 'POST',
                body: options.config
            }
        );
    }

    /**
     * Perform 'show inspect' operation
     *
     * @returns service API response
     */
    protected async _showInspect(): Promise<object> {
        return await this._mgmtClient.makeRequest(
            this._metadataClient.getInspectEndpoint().endpoint
        );
    }

    /**
     * Perform 'show trigger' operation
     * 
     * @returns service API response
     */
    protected async _showTrigger(): Promise<object> {
        return await this._mgmtClient.makeRequest(
            this._metadataClient.getTriggerEndpoint().endpoint
        );
    }

    /**
     * Perform 'trigger' operation
     * 
     * @param options function options
     *
     * @returns service API response
     */
    protected async _trigger(options?: { config?: object }): Promise<object> {
        options = options || {};

        return await this._mgmtClient.makeRequest(
            this._metadataClient.getTriggerEndpoint().endpoint,
            {
                method: 'POST',
                body: options.config
            }
        );
    }

    /**
     * Wait for task
     *
     * Note: Certain toolchain components support async task behavior,
     * where a 202 response on the initial POST is returned along
     * with a self link to query.  The self link will return 202 until
     * the task is complete, at which time it will return 200.
     *
     * @param taskUri task URI
     *
     * @returns service API response
     */
    protected async _waitForTask(taskUri: string): Promise<object> {
        return await miscUtils.retrier(this._checkTaskState, [taskUri], { thisContext: this });
    }
}