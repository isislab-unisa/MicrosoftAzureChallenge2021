from dao.people_dao import Person
from dao.user_dao import User
import datetime
import logging

import azure.functions as func

from typing import List

from azure.cognitiveservices.vision.face import FaceClient
from msrest.authentication import CognitiveServicesCredentials

from config import DefaultConfig
from dao import PeopleDAO, UserDAO

CONFIG = DefaultConfig()

face_client = FaceClient(CONFIG.COGNITIVE_SERVICES_ENDPOINT, CognitiveServicesCredentials(CONFIG.COGNITIVE_SERVICES_KEY))
people_dao = PeopleDAO(face_client=face_client, config=CONFIG)
user_dao = UserDAO(config=CONFIG)

def main(mytimer: func.TimerRequest) -> None: # should be called once a week ("0 30 9 * * 1")
    utc_timestamp = datetime.datetime.utcnow().replace(
        tzinfo=datetime.timezone.utc).isoformat()

    clean_data()

    logging.info('Python timer trigger function ran at %s', utc_timestamp)


def clean_data():
    users = user_dao.get_all_users()
    people = people_dao.get_all_people()

    clean_groups(users)
    for user in users:
        clean_people(user.person_group_id, people)


def clean_groups(users: List[User]):
    logging.info("Cleaning person groups")
    deleted = False
    for pg in face_client.person_group.list():
        if not is_into_users(pg.person_group_id, users):
            deleted = True
            logging.info(f'Deleting Person: person_group_id={pg.person_group_id}, name={pg.name}')
            
    
    if not deleted:
        logging.info('No person group has been deleted.')
    


def clean_people(person_group_id: str, people: List[Person]):
    logging.info(f"Cleaning people into {person_group_id}")
    deleted = False
    for person in face_client.person_group_person.list(person_group_id=person_group_id):
        if not is_into_people(person.person_id, person_group_id, people):
            deleted = True
            logging.info(f'Deleting Person: person_group_id={person_group_id}, person_id={person.person_id}, name={person.name}')
    
    if not deleted:
        logging.info(f'No person has been deleted into {person_group_id}.')


def is_into_users(person_group_id: str, users: List[User]) -> bool:
    for user in users:
        if user.person_group_id == person_group_id:
            return True
    return False

def is_into_people(person_id: str, person_group_id: str, people: List[Person]) -> bool:
    for person in people:
        if person.person_id == person_id and person.person_group_id == person_group_id:
            return True
    return False