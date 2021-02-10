from typing import Any
from copy import deepcopy

from PIL import ImageDraw, Image

from dao import PeopleDAO, UserDAO
from azure.cognitiveservices.vision.face import FaceClient
from azure.cognitiveservices.vision.face.models import DetectedFace, FaceAttributeType, TrainingStatusType
from msrest.authentication import CognitiveServicesCredentials

from config import DefaultConfig

from FaceDetection.exceptions import NotExistingUser

import io
import time
import json
import base64
import logging
import requests
import azure.functions as func


CONFIG = DefaultConfig()


face_client = FaceClient(CONFIG.COGNITIVE_SERVICES_ENDPOINT, CognitiveServicesCredentials(CONFIG.COGNITIVE_SERVICES_KEY))
people_dao = PeopleDAO(face_client=face_client, config=CONFIG)
user_dao = UserDAO(config=CONFIG)


def detect(image: func.InputStream) -> None:
    """
    Questa funzione rileva tutti i volti all'interno di un immagine.
    """
    logging.info(f'Detecting faces over {image.name}')
    start_time = time.time()
    image_copy = deepcopy(image)
    detected_faces = face_client.face.detect_with_stream(image, 
        return_face_landmarks=False, 
        detection_model='detection_02'
    )
    
    logging.debug(f"Detecting time: {time.time() - start_time}")

    if not detected_faces:
        raise Exception(f'No face detected in the image')

    try:
        for face in detected_faces:
            face: DetectedFace
            identify(face, deepcopy(image_copy))        
            logging.debug(f'{face.as_dict()=}')
    except NotExistingUser as e:
        logging.exception(e) 


def identify(face: DetectedFace, image: func.InputStream) -> None:
    """
    Questa funzione identifica la persona appartenente al volto ricevuto in input.
    """
    user_id = image.name.split('/')[-2]
    user = user_dao.get_user_by_id(user_id)
    if user is None:
        notify_new_user(user_id)
        raise NotExistingUser(f'The user id {user_id} not exists. Use the bot to initialize a new user.')
    person_group_id = user.person_group_id
    people_dao.retrive_person_group(person_group_id)

    for person in people_dao.retrive_people(person_group_id):
        result = face_client.face.verify_face_to_person(face_id=face.face_id, 
            person_id=person.person_id, 
            person_group_id=person_group_id
        )

        if result.is_identical:
            logging.debug(f"Identified {face.face_id} to person {person.person_id} with a confidence of {result.confidence}")
            try:
                retrain_person_group(person=person, result=result, image=image)
            except Exception as e:
                logging.error("Cannot retrain the person group.")
                logging.exception(e)
            identified_callback(person)
            break
    else:
        unidentified_callback(person_group_id, face, image)


def retrain_person_group(person: Any, result: Any, image: func.InputStream):
    """
    Riaddestra il person group se l'immagine ha una bassa confidence.
    """
    # if the confidence is low
    MIN_CONFIDENCE = 0.70
    if result.confidence < MIN_CONFIDENCE:
        logging.info(f"Retraining person group, confidence={result.confidence} < {MIN_CONFIDENCE}")
        face_client.person_group_person.add_face_from_stream(person_group_id=person.person_group_id, 
            person_id=person.person_id,
            detection_model='detection_02', 
            image=image
        )
        face_client.person_group.train(person_group_id=person.person_group_id)
        
        while True:
            training_status = face_client.person_group.get_training_status(person.person_group_id)
            logging.debug(f"Training status: {training_status.status}.")
            if (training_status.status is TrainingStatusType.succeeded):
                break
            elif (training_status.status is TrainingStatusType.failed):
                raise Exception('Training the person group has failed.')
            time.sleep(3)
        


def identified_callback(person: Any):
    """
    Questa funzione viene chiamata ogni volta che una persona viene identificata
    """
    user = user_dao.get_user_by_pg(person.person_group_id)
    logging.info(f'{user=}')

    logging.info(f'{person.name} it was identified')

    url = CONFIG.BOT_NOTIFY_CHANNEL
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"{CONFIG.BOT_TRUST_TOKEN}",
    }
    data = {
        "status": "identified",
        "id": f"{user.user_id}",
        "name": f"{person.name}",
        "surname": f"{person.surname}" 
    }

    logging.info('Making a post request to the bot')
    try:
        response = requests.post(url, data=json.dumps(data), headers=headers)
        logging.info(f'Reponse: {response}')
    except Exception as e:
        logging.error(str(e))


def unidentified_callback(person_group_id: str, face: DetectedFace, image: func.InputStream):
    """
    Questa funzione viene chiamata ogni volta che non viene identificata nessuna persona
    """
    user = user_dao.get_user_by_pg(person_group_id)

    image_pil = Image.open(image)
    draw = ImageDraw.Draw(image_pil)
    draw.rectangle(getRectangle(face), outline='red')
    output = io.BytesIO()
    image_pil.save(output, format='JPEG')

    base64_image = base64.b64encode(output.getvalue()).decode()

    url = CONFIG.BOT_NOTIFY_CHANNEL
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"{CONFIG.BOT_TRUST_TOKEN}",
    }
    data = {
        "status": "unidentified",
        "id": f"{user.user_id}",
        "image": f"{base64_image}"
    }

    logging.info('Making a post request to the bot')
    try:
        response = requests.post(url, data=json.dumps(data), headers=headers)
        logging.info(f'Reponse: {response}')
    except Exception as e:
        logging.error(str(e))

def notify_new_user(user_id: str):
    url = CONFIG.BOT_NOTIFY_CHANNEL
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"{CONFIG.BOT_TRUST_TOKEN}",
    }
    data = {
        "status": "new_user",
        "id": f"{user_id}"
    }

    logging.info('Making a post request to the bot')
    try:
        response = requests.post(url, data=json.dumps(data), headers=headers)
        logging.info(f'Reponse: {response}')
    except Exception as e:
        logging.error(str(e))

def getRectangle(face: DetectedFace):
    rect = face.face_rectangle
    left = rect.left
    top = rect.top
    right = left + rect.width
    bottom = top + rect.height
    
    return ((left, top), (right, bottom))
