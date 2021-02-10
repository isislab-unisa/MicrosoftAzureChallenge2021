from PIL import Image
from azure.cognitiveservices.vision.face import FaceClient
from msrest.authentication import CognitiveServicesCredentials
from math import ceil, floor
from io import BytesIO


class AzureVision:

    __ENDPOINT = "https://theemotiongame.cognitiveservices.azure.com/"

    def __init__(self, token):
        self.__TOKEN = token
        self.__face_client = FaceClient(self.__ENDPOINT, CognitiveServicesCredentials(self.__TOKEN))

    def get_emotion(self, img_byte):

        face = self.__get_face(img_byte)
        if face is not None:
            emozione, score = self.__get_emotion(face.face_attributes.emotion)

            if face.face_attributes.gender[0] == 'm':
                genere = 'maschio'
            else:
                genere = 'femmina'

            result = f'Emozione: {emozione}, score: {score}\nEtà: {face.face_attributes.age}\nGenere: {genere}'
            return result, emozione
        else:
            return "Errore", None

    def __get_emotion(self, emoObject):
        emoDict = dict()
        emoDict['rabbia'] = emoObject.anger
        emoDict['disprezzo'] = emoObject.contempt
        emoDict['disgusto'] = emoObject.disgust
        emoDict['paura'] = emoObject.fear
        emoDict['felice'] = emoObject.happiness
        emoDict['neutro'] = emoObject.neutral
        emoDict['tristezza'] = emoObject.sadness
        emoDict['sorpreso'] = emoObject.surprise
        emo_name = max(emoDict, key=emoDict.get)
        emo_level = emoDict[emo_name]
        return emo_name, emo_level

    def __getRectangle(self, faceDictionary):
        rect = faceDictionary.face_rectangle
        left = rect.left
        top = rect.top
        right = left + rect.width
        bottom = top + rect.height
        return left, top, right, bottom

    def __get_image(self, im1, im2):
        offset = 50
        load_versus = Image.open("images/versus.png")
        width = im1.width + load_versus.width + im2.width + offset*2

        if im1.height > im2.height:
            height = im2.height
        else:
            height = im1.height

        dst = Image.new('RGB', (width, height), color='white')
        dst.paste(im1, (0, 0))

        mid = int((height - load_versus.height) / 2)
        dst.paste(load_versus, (im1.width + offset, mid))
        dst.paste(im2, (im1.width + load_versus.width + offset * 2, 0))
        return dst

    def __crop_image(self, img1_byte, img2_byte):

        face1 = self.__get_face(img1_byte)
        face2 = self.__get_face(img2_byte)

        if face1 is None or face2 is None:
            return face1, face2

        opened_image1 = Image.open(img1_byte)
        opened_image2 = Image.open(img2_byte)

        left1, top1, right1, bottom1 = self.__getRectangle(face1)
        left2, top2, right2, bottom2 = self.__getRectangle(face2)

        if (right1 - left1) > (right2 - left2):
            left2, top2, right2, bottom2 = self.__resizer(opened_image2, left2, top2, right2, bottom2, (right1 - left1))
        elif (right1 - left1) < (right2 - left2):
            left1, top1, right1, bottom1 = self.__resizer(opened_image1, left1, top1, right1, bottom1, (right2 - left2))

        cropped1 = opened_image1.crop((left1, top1, right1, bottom1))
        cropped2 = opened_image2.crop((left2, top2, right2, bottom2))

        return cropped1, cropped2

    def get_versus(self, img1_byte, img2_byte):
        cropped1, cropped2 = self.__crop_image(img1_byte, img2_byte)
        if cropped1 is None or cropped2 is None:
            return_value = {"image1": cropped1, "image2": cropped2, "status": "failed"}
        else:
            image = self.__get_image(cropped1, cropped2)
            img_byte_arr = BytesIO()
            image.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)
            return_value = {"image": img_byte_arr.getvalue(), "status": "ok"}
            img_byte_arr.close()

        return return_value

    def __get_face(self, img_byte):
        face_attributes = ['emotion', 'age', 'gender']
        detected_faces = self.__face_client.face.detect_with_stream(img_byte, return_face_attributes=face_attributes)
        if not detected_faces:
            return None
        elif len(detected_faces) > 1:
            return None

        return detected_faces[0]

    def __resizer(self, image, left, top, right, bottom, dim):
        diff = dim - (right - left)
        diff_1 = int(floor(diff / 2))
        diff_2 = int(ceil(diff / 2))

        left -= diff_1
        right += diff_2
        if left < 0 and right <= image.width + left:
            right -= left
            left = 0

        if right > image.width and left - (right - image.width) > 0:
            left -= (right - image.width)
            right = image.width

        top -= diff_1
        bottom += diff_2

        if top < 0 and bottom <= image.height + top:
            bottom -= top
            top = 0

        if bottom > image.height and top - (bottom - image.height) > 0:
            top -= (bottom - image.height)
            bottom = image.height

        return left, top, right, bottom
