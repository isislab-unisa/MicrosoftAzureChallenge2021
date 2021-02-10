"use strict";

const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios')

const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });


class TextAnalytics {
    constructor(key, endpoint) {
        this._key = key || process.env.TextAnalyticsKey;
        this._endpoint = endpoint || process.env.TextAnalyticsEndpoint;

        if (!this._key) throw ("You must specify a key for the TextAnalytics service")
        if (!this._endpoint) throw ("You must specify an endpoint for the TextAnalytics service")
    }

    checkPII(id, text) {
        const options = {
            baseURL: this._endpoint,
            url: 'text/analytics/v3.1-preview.3/entities/recognition/pii',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 
                'Ocp-Apim-Subscription-Key': this._key
            },
            params: { 
            },
            data: {
                documents : [
                    {
                        id,
                        text
                    }
                ]
            } 
        };

        return axios.request(options);
    }
}

module.exports.TextAnalytics = TextAnalytics;
