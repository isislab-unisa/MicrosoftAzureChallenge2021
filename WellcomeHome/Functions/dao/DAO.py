from abc import ABC

from azure.cosmos import CosmosClient
from azure.cosmos.database import DatabaseProxy

from config import DefaultConfig



class DAO(ABC):
    def __init__(self, config: DefaultConfig) -> None:
        db_client = CosmosClient(config.COSMOSDB_ENDPOINT, config.COSMOSDB_KEY)
        self.database: DatabaseProxy = db_client.get_database_client(config.DATABASE_NAME)
        