from FaceDetection.detection import detect
import logging

import azure.functions as func

from .detection import detect

def main(myblob: func.InputStream):
    logging.info(f"Python blob trigger function processed blob \n"
                 f"Name: {myblob.name}\n"
                 f"Blob Size: {myblob.length} bytes")
    
    try:
        detect(myblob)
    except Exception as e:
        logging.exception(e)
   
