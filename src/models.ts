import { Timings } from "@szmarczak/http-timer/dist/source";

/**
 * F5 TMOS token framework 
 */
export type Token = {
    token: string;
    timeout: number;
}

/**
 * custom http response with timings, based on axios response
 */
export type HttpResponse = {
    data?: unknown;
    headers?: unknown;
    status: number;
    statusText?: string;
    request?: {
        url: string;
        method: string;
        headers: unknown;
        protocol: string;
        timings: Timings;
        // data?: unknown;
    };
};

// https://nodejs.org/docs/latest-v12.x/api/http.html#http_http_request_url_options_callback

// outgoing headers allows numbers (as they are converted internally to strings)
export type OutgoingHttpHeaders = {
    [header: string]: number | string | string[] | undefined;
}