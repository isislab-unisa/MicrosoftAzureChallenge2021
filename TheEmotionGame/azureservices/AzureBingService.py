import requests


class AzureBingService:
    def __init__(self, token):
        self.__token = token

    def bingSearch(self, search: str):
        search_url = "https://api.bing.microsoft.com/v7.0/images/search"

        headers = {"Ocp-Apim-Subscription-Key": self.__token}
        params = {"q": search, "license": "public", "imageType": "photo", "mkt": "it-IT", "setLang": "it"}

        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()
        search_results = response.json()

        lista_immagini = [elemento['thumbnailUrl'] for elemento in search_results['value']]

        return lista_immagini
