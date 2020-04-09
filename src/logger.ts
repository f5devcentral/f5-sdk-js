/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

const CURRENT_LOG_LEVEL = process.env.F5_SDK_LOG_LEVEL || 'INFO';

export default class Logger {
    private static instance: Logger;

    /**
     * Get logger instance (singleton)
     * 
     * @returns logger instance
     */
    static getLogger(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Log informational message
     */
    info(msg: string): void {
        console.log(msg);
    }

    /**
     * Log debug message
     */
    debug(msg: string): void {
        if (CURRENT_LOG_LEVEL === 'DEBUG') {
            console.log(msg);
        }
    }
}