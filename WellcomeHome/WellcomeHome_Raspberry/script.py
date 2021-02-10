import re
import cv2
import sys
import uuid
import time
import imutils
import logging

from azure.storage.blob import BlobClient


logging.basicConfig(format='%(asctime)s %(message)s', level=logging.NOTSET)

SLEEPING_TIME = 15 # in secs


def retrive_db_key() -> str:
	key = ''
	with open('./key', 'r') as f:
		key = f.read()
	logging.debug(f'{key=}')
	return key


def init_client():
	global blob_service_client
	logging.info('Trying to connect to storage account')
	blob_service_client = BlobServiceClient.from_connection_string(retrive_db_key())
	logging.info('Connected to storage account')
	

def load_to_azure(fname, github_id):
	with open(f'images/{fname}', 'rb') as f:
		image = f.read()
	logging.info(f'[*] Loading image to Azure, {github_id=}')

	url = f"https://wellcomehomestorage.blob.core.windows.net/img/{github_id}/{fname}?sv=2019-12-12&ss=b&srt=o&sp=cx&se=2022-01-19T01:36:57Z&st=2021-01-18T17:36:57Z&spr=https&sig=ZcC1jgebmJ06pbsnVPthTDUC2b%2Bs8DdCtS%2BuyCyZ3Hk%3D"
	blob_client = BlobClient.from_blob_url(url)
	#blob_client = blob_service_client.get_blob_client('img', f'{github_id}/{fname}')
	blob_client.upload_blob(image)
	logging.info('[*] Blob uploaded')


def validate_id(id) -> bool:
	return re.match(r'^([0-9]+)$', id) is not None


def zoom(frame, zoom_factor):
	# TODO
	return frame	


def main(casc_path, github_id):	
	faceCascade = cv2.CascadeClassifier(casc_path)

	# creating the video capture object	
	video_capture = cv2.VideoCapture(0)
	
	# setting resolution (1280 x 720)
	video_capture.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
	video_capture.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
	
	detecting = False
	detected_frames = {}
	
	logging.info('[*] Started')
	while True:
		try:
			# capture the frame
			ret, frame = video_capture.read()
			
			# zoom the frame
			frame = zoom(frame, 2)			

			# getting the gray!
			gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
			
			# get the blurring informations
			blur = cv2.Laplacian(gray, cv2.CV_64F).var()
			
			# find faces
			faces = faceCascade.detectMultiScale(
				gray,
				scaleFactor=1.1,
				minNeighbors=5,
				minSize=(30, 30),
				flags=cv2.CASCADE_SCALE_IMAGE
			)
			
			# if faces are being detected, then add them to the array with rispective blur ratio
			if len(faces):
				detecting = True
				detected_frames.update({blur: frame})
				if not detecting:
					logging.info('[*] Detected Face')
				logging.debug(f'{blur=}')
	
			# if there are no more faces 
			if not len(faces) and detecting and detected_frames:
				detecting = False

				# retrive the image with the highest number of faces
				best_blur = max(detected_frames)
				logging.debug(f'The best frame has blur: {best_blur}')
				image = detected_frames[best_blur]
				detected_frames = {}

				# saving the image
				fname = str(uuid.uuid4()) + '.jpg'
				logging.info(f'[*] Saving image into {fname}')
				cv2.imwrite('images/' + fname, image)
				
				# load the image on the azure storage
				load_to_azure(fname, github_id)
				
				# sleep for 15 seconds
				logging.debug(f"Waiting {SLEEPING_TIME} seconds...")
				time.sleep(SLEEPING_TIME)
				logging.info('Ready')
				
		except KeyboardInterrupt:
			break		
	
	video_capture.release()
	logging.info('[*] Stopped.') 
	

if __name__ == "__main__":
	if len(sys.argv) != 3:
		logging.error("Usage: python ./script.py <github_id> <cascade_path>")
		sys.exit(0)
	github_id = sys.argv[1]
	if not validate_id(github_id):
		logging.error("Invalid GitHub ID")
		sys.exit(0)
	cascade_path = sys.argv[2]

	#init_client()	
	main(cascade_path, github_id)
