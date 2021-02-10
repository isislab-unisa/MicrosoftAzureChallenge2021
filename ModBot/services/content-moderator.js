"use strict";

const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios')

const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

class ContentModerator {
    constructor(key, endpoint) {
        this._key = key || process.env.ContentModeratorKey;
        this._endpoint = endpoint || process.env.ContentModeratorEndpoint

        if (!this._key) throw ("You must specify a key for the ContentModerator service")
        if (!this._endpoint) throw ("You must specify an endpoint for the ContentModerator service")
    }

    checkText(text, autocorrect = true, pii = true, listId, classify = true, language) {
        const options = {
            baseURL: this._endpoint,
            url: 'contentmoderator/moderate/v1.0/ProcessText/Screen',
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'Ocp-Apim-Subscription-Key': this._key
            },
            params: {
                autocorrect,
                PII: pii,
                listId,
                classify,
                language
            },
            data: text
        };

        return axios.request(options);
    }

    checkImage(url, cacheImage = false) {
        const options = {
            baseURL: this._endpoint,
            url: 'contentmoderator/moderate/v1.0/ProcessImage/Evaluate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': this._key
            },
            params: {
                CacheImage: cacheImage
            },
            data: {
                DataRepresentation: "URL",
                Value: url
            }
        };

        return axios.request(options);
    }

}

module.exports.ContentModerator = ContentModerator;