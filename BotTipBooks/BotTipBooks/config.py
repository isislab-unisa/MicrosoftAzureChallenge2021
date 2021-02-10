#!/usr/bin/env python3
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import os

""" Bot Configuration """


class DefaultConfig:
    """ Bot Configuration """

    PORT = 3978
    APP_ID = os.environ.get("MicrosoftAppId", "")
    APP_PASSWORD = os.environ.get("MicrosoftAppPassword", "")
    CONNECTION_NAME = os.environ.get("ConnectionName", "")
    LUIS_APP_ID = os.environ.get("LuisAppId", "")
    LUIS_API_KEY = os.environ.get("LuisAPIKey", "")
    LUIS_API_HOST_NAME = os.environ.get("LuisAPIHostName", "")
    KEY_AMAZON_API = os.environ.get("KeyAmazonApi", "")
    ENDPOINT_FIND_FUNCTION = os.environ.get("EndpointFindFunction", "")
    ENDPOINT_TEXT_ANALYSIS = os.environ.get("EndpointTextAnalysis", "")
    TEXT_KEY = os.environ.get("TextKey", "")
