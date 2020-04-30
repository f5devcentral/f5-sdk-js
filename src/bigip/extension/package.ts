/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import * as fs from 'fs';

import * as constants from '../../constants';
import * as httpUtils from '../../utils/http';
import * as miscUtils from '../../utils/misc';

import { ManagementClient } from '../index';
import { MetadataClient } from './metadata';

const PKG_MGMT_URI = '/mgmt/shared/iapp/package-management-tasks';

export class PackageClient {
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
     * Is Installed
     *
     * @returns information about component installation state
     */
    async isInstalled(): Promise<{
        installed: boolean;
        installedVersion: string;
        latestVersion: string;
    }> {
        const installedRpmInfo = await this._getInstalledRpmInfo();
        return {
            installed: installedRpmInfo.installed,
            installedVersion: installedRpmInfo.installedVersion,
            latestVersion: this._metadataClient.getLatestVersion()
        };
    }

    /**
     * Install
     * 
     * @param options function options
     * 
     * @returns installed component information
     */
    async install(options?: { hash?: string }): Promise<{
        component: string;
        version: string;
    }> {
        options = options || {};

        const downloadUrl = this._metadataClient.getDownloadUrl();
        const downloadPackageName = this._metadataClient.getDownloadPackageName();

        // download locally
        const tmpFile = `${constants.TMP_DIR}/${downloadPackageName}`;
        await httpUtils.downloadToFile(downloadUrl, tmpFile);

        // verify hash (optional)
        if (options.hash && miscUtils.verifyHash(tmpFile, options.hash) === false) {
            throw new Error('Downloaded file does not match the provided hash!');
        }

        // upload to target
        await this._uploadRpm(tmpFile, { deleteFile: true });

        // install on target
        await this._installRpm(`/var/config/rest/downloads/${downloadPackageName}`);

        return {
            component: this._component,
            version: this._componentVersion
        };
    }

    /**
     * Uninstall
     *
     * @returns uninstalled component information
     */
    async uninstall(): Promise<{
        component: string;
        version: string;
    }> {
        const installedComponentInfo = await this._getInstalledRpmInfo();

        if (installedComponentInfo.installed) {
            await this._uninstallRpm(installedComponentInfo.packageName);
        }
        return {
            component: this._component,
            version: installedComponentInfo.installedVersion
        };
    }

    /**
     * List all the component versions available
     *
     * @returns list of component versions
     */
    async getVersionsList(): Promise<Array<string>> {
        return this._metadataClient.getComponentVersionsList();
    }

    protected async _checkRpmExists(componentPackageName: string): Promise<{
        exists: boolean;
        installedVersion: string;
        packageName: string;
    }> {
        const queryResponse = await this._mgmtClient.makeRequest(PKG_MGMT_URI, {
            method: 'POST',
            body: {
                operation: 'QUERY'
            }
        });
        const response = await this._checkRpmTaskStatus(queryResponse['id']);
        // find matching packages
        const matchingPackages = response['queryResponse'].filter(
            (i: object) => componentPackageName == i['name']);
        // now grab the matched package name, typically only one match
        let packageName = null;
        if (matchingPackages.length === 1) {
            packageName = matchingPackages[0]['packageName'];
        } else if (matchingPackages.length > 1) {
            // TODO: add warning log message here...
        }

        return {
            exists: packageName !== null ? true : false,
            installedVersion: this._getVersionNumberFromPackageName(packageName),
            packageName: packageName
        }
    }

    protected async _checkRpmTaskStatus(taskId: string): Promise<object> {
        let i = 0;
        const maxCount = constants.RETRY.DEFAULT_COUNT;
        while (i < maxCount) {
            const response = await this._mgmtClient.makeRequest(`${PKG_MGMT_URI}/${taskId}`);

            if (response['status'] === 'FINISHED') {
                return response;
            } else if (response['status'] === 'FAILED') {
                return Promise.reject(new Error(`RPM installation failed: ${response['errorMessage']}`));
            } else if (i > maxCount) {
                return Promise.reject(new Error(`Max count exceeded, last response: ${response['errorMessage']}`));
            }

            i += 1;
            await new Promise(resolve => setTimeout(resolve, constants.RETRY.DELAY_IN_MS));
        }
        return {};
    }

    protected async _getInstalledRpmInfo(): Promise<{
        installed: boolean;
        installedVersion: string;
        packageName: string;
    }> {
        const installedRpmInfo = await this._checkRpmExists(this._metadataClient.getComponentPackageName());
        return {
            installed: installedRpmInfo.exists,
            installedVersion: installedRpmInfo.installedVersion,
            packageName: installedRpmInfo.packageName
        }
    }

    protected _getVersionNumberFromPackageName(packageName: string): string {
        if (packageName === null) {
            return '';
        }

        return packageName.match(/[0-9]+.[0-9]+.[0-9]+/)[0];
    }

    protected async _installRpm(packagePath: string): Promise<void> {
        const response = await this._mgmtClient.makeRequest(
            PKG_MGMT_URI,
            {
                method: 'POST',
                body: {
                    operation: 'INSTALL',
                    packageFilePath: packagePath
                }
            }
        );
        await this._checkRpmTaskStatus(response['id']);
    }

    protected async _uninstallRpm(packageName: string): Promise<void> {
        const response = await this._mgmtClient.makeRequest(
            PKG_MGMT_URI,
            {
                method: 'POST',
                body: {
                    operation: 'UNINSTALL',
                    packageName
                }
            }
        );
        await this._checkRpmTaskStatus(response['id']);
    }

    protected async _uploadRpm(file: string, options?: {
        deleteFile?: boolean;
    }): Promise<void> {
        /* eslint-disable no-await-in-loop, no-loop-func */
        options = options || {};
        const deleteFile = options.deleteFile || true;

        const fileStats = fs.statSync(file);
        const chunkSize = 1024 * 1024;
        let start = 0;
        let end = Math.min(chunkSize, fileStats.size-1);
        while (end <= fileStats.size - 1 && start < end) {
            await this._mgmtClient.makeRequest(
                `/mgmt/shared/file-transfer/uploads/${file.split('/')[file.split('/').length - 1]}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Content-Range': `${start}-${end}/${fileStats.size}`,
                        'Content-Length': end - start + 1
                    },
                    body: fs.createReadStream(file, { start, end }),
                    contentType: 'raw'
                }
            );

            start += chunkSize;
            if (end + chunkSize < fileStats.size - 1) { // more to go
                end += chunkSize;
            } else if (end + chunkSize > fileStats.size - 1) { // last chunk
                end = fileStats.size - 1;
            } else { // done - could use do..while loop instead of this
                end = fileStats.size;
            }
        }

        if (deleteFile === true) {
            fs.unlinkSync(file);
        }
    }
}