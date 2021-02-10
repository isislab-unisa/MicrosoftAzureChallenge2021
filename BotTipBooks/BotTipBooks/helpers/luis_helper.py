# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
from enum import Enum
from typing import Dict
from botbuilder.ai.luis import LuisRecognizer
from botbuilder.core import IntentScore, TopIntent, TurnContext

class Intent(Enum):
    CANCELLA_WISHLIST = "CancellaWishlist"
    INFO = "Informazioni"
    FIND_BOOK = "RicercaLibri"
    SHOW_WISHLIST = "ShowWishlist"
    TIP_BOOK = "SuggerisciLibro"
    NONE_INTENT = "None"
    MENU_INTENT = "TornaAlMenu"


def top_intent(intents: Dict[Intent, dict]) -> TopIntent:
    max_intent = Intent.NONE_INTENT
    max_value = 0.0
    
    for intent, value in intents:
        intent_score = IntentScore(value)
        if intent_score.score > max_value:
            max_intent, max_value = intent, intent_score.score

    return TopIntent(max_intent, max_value) 


class LuisHelper:
    @staticmethod
    async def execute_luis_query(
        luis_recognizer: LuisRecognizer, turn_context: TurnContext) -> (Intent):
        result = None
        intent = None

        try:
            recognizer_result = await luis_recognizer.recognize(turn_context)

            intent = (
                sorted(
                    recognizer_result.intents,
                    key=recognizer_result.intents.get,
                    reverse=True,
                )[:1][0]
                if recognizer_result.intents
                else None
            )

            if intent == Intent.CANCELLA_WISHLIST.value:
                return Intent.CANCELLA_WISHLIST.value
            if intent == Intent.INFO.value:
                return Intent.INFO.value
            if intent == Intent.FIND_BOOK.value:
                return Intent.FIND_BOOK.value
            if intent == Intent.SHOW_WISHLIST:
                return Intent.SHOW_WISHLIST.value
            if intent == Intent.TIP_BOOK.value:
                return Intent.TIP_BOOK.value
            if intent == Intent.MENU_INTENT.value:
                return Intent.MENU_INTENT.value

        except Exception as exception:
            print(exception)

        return intent
