# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

import json
from urllib.parse import urlparse, urljoin

from requests_oauthlib import OAuth2Session


RESOURCE = "https://api.github.com/user"


class GitHubClient:
    def __init__(self, token: str):
        self.token = token
        self.client = OAuth2Session(token={"access_token": token, "token_type": "Bearer"})

    async def get_id(self) -> str:
        response = self.client.get(RESOURCE)
        response = json.loads(response.text)
        if 'id' in response:
            return str(response['id'])
        else:
            raise Exception('Bad Credentials')

    def api_endpoint(self, url):
        if urlparse(url).scheme in ["http", "https"]:
            return url  # url is already complete
        return urljoin(f"{RESOURCE}/", url.lstrip("/"))
