import azure.cognitiveservices.speech as speechsdk


class AzureSpeechService:
    def __init__(self, token):
        self.__token = token
        self.__speech_config = speechsdk.SpeechConfig(subscription=self.__token, region="northeurope")

    def speechToText(self, file: str = None):
        speech_recognizer = self.__from_mic() if file is None else self.__from_file(file)
        result = speech_recognizer.recognize_once_async().get()
        return result.text

    def __from_file(self, file: str):
        audio_input = speechsdk.AudioConfig(filename=file)
        speech_recognizer = speechsdk.SpeechRecognizer(speech_config=self.__speech_config, audio_config=audio_input,
                                                           language="it-IT")
        return speech_recognizer

    def __from_mic(self):
        speech_recognizer = speechsdk.SpeechRecognizer(speech_config=self.__speech_config, language="it-IT")
        return speech_recognizer
