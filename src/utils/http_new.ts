import https from 'https';
import axios, { AxiosRequestConfig } from 'axios';
import timer from '@szmarczak/http-timer';



const transport = {
    request: function httpsWithTimer(...args) {
        const request = https.request.apply(null, args)
        timer(request);
        return request;
    }
};

// find timings in response.request.timings
const response = axios('http://httpbin.org/anything', {method: 'get', transport});
// return response;