from collections import namedtuple
from typing import List

from config import DefaultConfig
from dao.DAO import DAO

User = namedtuple('User', 'id user_id person_group_id')

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

    def create_user(self, user_id: str, person_group_id: str) -> User:
        new_id = -1
        for user in self.get_all_users():
            if int(user.id) > new_id:
                new_id = int(user.id)
        new_id += 1

        item = {
            'id': f'{new_id}',
            'pkey': 'A',
            'user_id': user_id,
            'person_group_id': person_group_id
        }

        self.container.create_item(body=item)
        return self.get_user_by_id(user_id)

    def _build_user(self, item: dict) -> User:
        return User(item['id'], item['user_id'], item['person_group_id'])
