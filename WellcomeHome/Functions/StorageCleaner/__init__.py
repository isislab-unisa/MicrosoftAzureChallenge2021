import azure.functions as func
import datetime
import logging
import datetime

from typing import List

from azure.storage.blob import BlobServiceClient, BlobProperties

from config import DefaultConfig


CONFIG = DefaultConfig()

blob_service_client = None
try:
    blob_service_client = BlobServiceClient.from_connection_string(CONFIG.STORAGE_CONNECTION)
except Exception as e:
    logging.exception(e)


def main(mytimer: func.TimerRequest) -> None: # sould be executed once at hour (0 0 */1 * * *)
    utc_timestamp = datetime.datetime.utcnow().replace(
        tzinfo=datetime.timezone.utc).isoformat()

    if mytimer.past_due:
        logging.info('The timer is past due!')

    delete()
    logging.info('Python timer trigger function ran at %s', utc_timestamp)


def delete():
    if blob_service_client:
        logging.info('Deleting blobs from storage')

        container_client = blob_service_client.get_container_client('img')

        blob_list: List[BlobProperties] = []
        for blob in container_client.list_blobs():
            blob_list.append(blob)
        
        for blob in blob_list:
            now = datetime.datetime.now(tz=datetime.timezone.utc)
            offset = datetime.timedelta(minutes=15) # goes 15 minutes earlier
            to_compare = blob.last_modified if blob.last_accessed_on is None else blob.last_accessed_on

            if (now - offset) > to_compare:
                logging.info(f"Deleting blob: {blob.name}, last modified time: {blob.last_modified}, last accessed time: {blob.last_accessed_on}")
                container_client.delete_blob(blob.name)


    else:
        logging.error('Cannot delete the blobs.')