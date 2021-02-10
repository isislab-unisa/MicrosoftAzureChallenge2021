from dao.DAO import DAO
from typing import Any, List
from collections import namedtuple
from urllib.parse import uses_query

from azure.cognitiveservices.vision.face import FaceClient
from azure.cognitiveservices.vision.face.models import PersonGroup

Person = namedtuple('Person', 'id name surname person_id person_group_id')


class PeopleDAO(DAO):
    """
    Questa classe gestisce l'accesso alle risorse di tipo Person
    """
    def __init__(self, face_client: FaceClient, config: Any) -> None:
        super().__init__(config)

        self.face_client = face_client

        # setting up the container informations
        self.container = self.database.get_container_client(config.PEOPLE_CONTAINER)


    def retrive_person_group(self, person_group_id: str) -> PersonGroup:
        """
        Restituisce un PersonGroup dato un id.
        Il PersonGroup viene creato nel caso non esista.
        """
        try:
            person_group = self.face_client.person_group.get(person_group_id=person_group_id)
        except:
            person_group = self.face_client.person_group.create(person_group_id=person_group_id)

        return person_group

    def get_all_people(self) -> List[Person]:
        people = []
        for item in self.container.read_all_items():
            person = Person(
                id = item['id'],
                name = item['name'],
                surname = item['surname'],
                person_id = item['person_id'],
                person_group_id = item['person_group_id'],
            )
            people.append(person)
        return people


    def retrive_people(self, person_group_id: str) -> List[Person]:
        """
        Restituisce tutte le persone di un dato PersonGroup
        """
        people = []
        for item in self.container.read_all_items():
            if item['person_group_id'] == person_group_id:
                person = Person(
                    id = item['id'],
                    name = item['name'],
                    surname = item['surname'],
                    person_id = item['person_id'],
                    person_group_id = item['person_group_id'],
                )
                people.append(person)
        return people
    
    def insert_person(self, name: str, surname: str, person_id: str, person_group_id: str):
        new_id = -1
        for person in self.retrive_people(person_group_id):
            if int(person.id) > new_id:
                new_id = int(person.id)
        new_id += 1

        item = {
            'id': f'{new_id}',
            'name': f'{name}',
            'surname': f'{surname}',
            'person_group_id': f'{person_group_id}',
            'person_id': f'{person_id}'
        }

        self.container.create_item(body=item)
