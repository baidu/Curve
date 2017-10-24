/**
 * @file axios instance
 * @author mohaiyan
 */

import axios from 'axios';
import qs from 'qs';

function paramsSerializerFunc(params) {
    return qs.stringify(params);
}

export const axiosInstance = axios.create({
    paramsSerializer: paramsSerializerFunc,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    // Intercept processing request data
    transformRequest: [function (data) {
        data = qs.stringify(data);
        return data;
    }],
    transformResponse: [function (data) {
        const parseData = JSON.parse(data);
        if (parseData.success) {
            if (parseData.data.redirect) {
                if (parseData.data.redirect.indexOf('http') === -1) {
                    window.location.href = window.location.origin + parseData.data.redirect;
                }
                else {
                    window.location.href = parseData.data.redirect;
                }
            }
            return parseData.data;
        }
        else {
            return parseData;
        }
    }]
});

