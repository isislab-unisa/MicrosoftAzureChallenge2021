import time
import uuid
import logging

import azure.functions as func

from typing import Any

from azure.cognitiveservices.vision.face import FaceClient
from azure.cognitiveservices.vision.face.models import Person, TrainingStatusType
from msrest.authentication import CognitiveServicesCredentials

from config import DefaultConfig
from dao import PeopleDAO, UserDAO


CONFIG = DefaultConfig()

face_client = FaceClient(CONFIG.COGNITIVE_SERVICES_ENDPOINT, CognitiveServicesCredentials(CONFIG.COGNITIVE_SERVICES_KEY))
people_dao = PeopleDAO(face_client=face_client, config=CONFIG)
user_dao = UserDAO(config=CONFIG)

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    
    try:
        data = req.get_json()
    except ValueError as e:
        logging.exception(e)
        return func.HttpResponse(f'No input', status_code=400)
    
    if parse_data(data):
        return func.HttpResponse(f'Operation completed', status_code=200)
    else:
        return func.HttpResponse(f'Bad data', status_code=400)


def parse_data(data: Any) -> bool:
    if data['operation'] == 'insert':
        return insert(data['data'])
    elif data['operation'] == 'update':
        return update(data['data'])


def insert(data: Any) -> bool:
    try:
        user_id = data['user_id']
        name = data['name']
        surname = data['surname']
        image_url = data['image_url']

        user = user_dao.get_user_by_id(user_id)
        if not user:
            # create a new user
            person_group_id = str(uuid.uuid4())
            face_client.person_group.create(person_group_id, name=user_id)
            user = user_dao.create_user(user_id, person_group_id)
        
        person_group_id = user.person_group_id

        face_client.person_group.get(person_group_id=person_group_id)
        
        # create a person
        person: Person = face_client.person_group_person.create(
            person_group_id=person_group_id,
            name=f'{name} {surname} {uuid.uuid1()}'
        )

        # add a face to that person
        face_client.person_group_person.add_face_from_url(
            person_group_id=person_group_id,
            person_id=person.person_id,
            url=image_url,
            detection_model='detection_02'
        )
        
        # retrain the person group
        face_client.person_group.train(person_group_id=person_group_id)
        while True:
            training_status = face_client.person_group.get_training_status(person_group_id)
            logging.debug(f"Training status: {training_status.status}.")
            if (training_status.status is TrainingStatusType.succeeded):
                break
            elif (training_status.status is TrainingStatusType.failed):
                # delete the person from the person group
                face_client.person_group_person.delete(person_group_id=person_group_id, person_id=person.person_id)
                raise Exception('Training the person group has failed.')
            time.sleep(3)
        
        # add the person to db
        try:
            people_dao.insert_person(name, surname, person.person_id, person_group_id)
        except Exception as e:
            logging.exception(e)
            face_client.person_group_person.delete(person_group_id=person_group_id, person_id=person.person_id)
            return False

    except Exception as e:
        logging.exception(e)
        return False
    return True


def update(data: Any) -> bool:
    try:
        person_id = data['person_id']
        image_url = data['image_url']
        person_group_id = data['person_group_id']

        face_client.person_group.get(person_group_id=person_group_id)
        
        # retrive the person
        person: Person = face_client.person_group_person.get(
            person_group_id=person_group_id,
            person_id=person_id
        )

        # add the face to the person
        face_client.person_group_person.add_face_from_url(
            person_group_id=person_group_id,
            person_id=person.person_id,
            url=image_url,
            detection_model='detection_02'
        )
        
        # retrain the person group
        face_client.person_group.train(person_group_id=person_group_id)
        while True:
            training_status = face_client.person_group.get_training_status(person_group_id)
            logging.debug(f"Training status: {training_status.status}.")
            if (training_status.status is TrainingStatusType.succeeded):
                break
            elif (training_status.status is TrainingStatusType.failed):
                # delete the person from the person group
                face_client.person_group_person.delete(person_group_id=person_group_id, person_id=person.person_id)
                raise Exception('Training the person group has failed.')
            time.sleep(3)

    except Exception as e:
        logging.exception(e)
        return False
    return True
