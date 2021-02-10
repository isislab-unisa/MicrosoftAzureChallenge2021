from helpers.dao.DAO import DAO
from typing import Any, List
from collections import namedtuple

Person = namedtuple('Person', 'id name surname person_group_id person_id')


class PeopleDAO(DAO):
    """
    Questa classe gestisce l'accesso alle risorse di tipo Person
    """
    def __init__(self, config: Any) -> None:
        super().__init__(config)

        # setting up the container informations
        self.container = self.database.get_container_client(config.PEOPLE_CONTAINER)

    def retrive_people(self, person_group_id: str) -> List[Person]:
        """
        Restituisce tutte le persone di un dato PersonGroup
        """
        people = []
        for item in self.container.read_all_items():
            if item['person_group_id'] == person_group_id:
                person = Person(
                    id=item['id'],
                    name=item['name'],
                    surname=item['surname'],
                    person_group_id=item['person_group_id'],
                    person_id=item['person_id']
                )
                people.append(person)
        return people
    
    def retrive_by_id(self, person_group_id: str, id: str) -> Person:
        for person in self.retrive_people(person_group_id):
            if person.id == id:
                return person
    
    def delete_by_id(self, person_id: str, person_group_id: str) -> None:
        self.container.delete_item(item=person_id, partition_key=person_group_id)
