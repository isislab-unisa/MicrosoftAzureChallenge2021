from collections import namedtuple
from typing import List

from config import DefaultConfig
from helpers.dao.DAO import DAO

User = namedtuple('User', 'user_id person_group_id')

class UserDAO(DAO):
    def __init__(self, config: DefaultConfig) -> None:
        super().__init__(config)

        self.container = self.database.get_container_client(config.USERS_CONTAINER)
    
    def get_all_users(self) -> List[User]:
        return [self._build_user(item) for item in self.container.read_all_items()]

    def get_user_by_id(self, id: str) -> User:
        for user in self.container.read_all_items():
            if user['user_id'] == id:
                return self._build_user(user)
    
    def get_user_by_pg(self, person_group_id: str) -> User:
        for user in self.container.read_all_items():
            if user['person_group_id'] == person_group_id:
                return self._build_user(user)

    def _build_user(self, item: dict) -> User:
        return User(item['user_id'], item['person_group_id'])
