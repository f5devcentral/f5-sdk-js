

import http from 'http';
import https, { Agent } from 'https';




// https://nodejs.org/docs/latest-v12.x/api/http.html#http_http_request_url_options_callback

// outgoing headers allows numbers (as they are converted internally to strings)
export type OutgoingHttpHeaders = {
    [header: string]: number | string | string[] | undefined;
}

export type HttpRequest = {
    protocol?: string | null;
    host?: string | null;
    hostname?: string | null;
    family?: number;
    port?: number | string | null;
    defaultPort?: number | string;
    localAddress?: string;
    socketPath?: string;
    /**
     * @default 8192
     */
    maxHeaderSize?: number;
    method?: string;
    path?: string | null;
    headers?: OutgoingHttpHeaders;
    auth?: string | null;
    agent?: Agent | boolean;
    _defaultAgent?: Agent;
    timeout?: number;
    setHost?: boolean;
    // https://github.com/nodejs/node/blob/master/lib/_http_client.js#L278
    // createConnection?: (options: ClientRequestArgs, oncreate: (err: Error, socket: Socket) => void) => Socket;
} 