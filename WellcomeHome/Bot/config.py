import os
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

kv_uri = os.environ.get('KEYVAULT_URI', '')


credential = DefaultAzureCredential()
client = SecretClient(vault_url=kv_uri, credential=credential) 

""" Bot Configuration """


class DefaultConfig:
    """ Bot Configuration """

    PORT = 3978
    APP_ID = os.environ('AZURE_CLIENT_ID', '')
    APP_PASSWORD = client.get_secret('bot-password').value
    CONNECTION_NAME = 'github-auth-conn'

    TRUST_TOKEN = client.get_secret('Trust-Token-ProactiveMessages').value

    # functions
    FUNCTION_ENDPOINT = os.environ.get('AZURE_FUNCTION_ENDPOINT', '') 
    FUNCTION_KEY = client.get_secret('insert-people-function-key').value

    # Cosmos DB infos
    COSMOSDB_ENDPOINT = os.environ.get('AZURE_COSMOSDB_ENDPOINT', '') 
    COSMOSDB_KEY = client.get_secret('wellcomehome-db-key').value
    
    DATABASE_NAME = "WellcomeHomeDB"
    PEOPLE_CONTAINER = "People"
    USERS_CONTAINER = "Users"

    BOT_DATABASE_NAME = "WellcomeHomeBotDB"
    BOT_CONTAINER = "Items"

    # Blob Storage
    STORAGE_CONNECTION = os.environ.get('AZURE_STORAGE_CONNECTION', '')