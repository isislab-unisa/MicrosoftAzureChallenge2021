# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

from botbuilder.dialogs import ComponentDialog, DialogContext, DialogTurnResult, DialogTurnStatus, WaterfallDialog, WaterfallStepContext
from botbuilder.schema import (
    ChannelAccount,
    HeroCard,
    CardImage,
    CardAction,
    ActionTypes,
)
from botbuilder.dialogs.prompts import TextPrompt, PromptOptions, ChoicePrompt
from botbuilder.core import MessageFactory, TurnContext, CardFactory, UserState
from botbuilder.schema import Attachment, InputHints, SuggestedActions
from botbuilder.dialogs.choices import Choice
from bot_recognizer import BotRecognizer
from .findbook_dialog import FindBookDialog
from bean import Book, User
from botbuilder.dialogs.prompts.oauth_prompt_settings import OAuthPromptSettings
from botbuilder.dialogs.prompts.oauth_prompt import OAuthPrompt
from botbuilder.dialogs.prompts.confirm_prompt import ConfirmPrompt
from botbuilder.dialogs.choices.channel import Channel
from .registration_dialog import RegistrationDialog
from databaseManager import DatabaseManager
from botbuilder.schema._connector_client_enums import ActivityTypes
from botbuilder.dialogs.dialog import Dialog
from helpers.luis_helper import LuisHelper,Intent
from .wishlist_dialog import WishlistDialog
from .suggest_dialog import SuggestBooksDialog

import os
import json
from typing import Dict

registration_dialog=RegistrationDialog()
findbook=FindBookDialog()
wishlist_dialog=WishlistDialog()
suggest_dialog=SuggestBooksDialog()

class MainDialog(ComponentDialog):
    
    def __init__(self, connection_name: str,  luis_recognizer: BotRecognizer, conversation_state):
        super(MainDialog, self).__init__(MainDialog.__name__)
        self.connection_name=connection_name
        
        self._luis_recognizer = luis_recognizer
        self.findbook_dialog_id=findbook.id
        self.registration_dialog_id=registration_dialog.id
        self.wishlist_dialog_id=wishlist_dialog.id
        self.suggest_dialog_id=suggest_dialog.id
    
        wishlist_dialog.set_recognizer(luis_recognizer)

        self.add_dialog(
            OAuthPrompt(
                OAuthPrompt.__name__,
                OAuthPromptSettings(
                    connection_name=connection_name,
                    text="Accedi",
                    title="Sign In",
                    timeout=300000,
                ),
            )
        )

        self.add_dialog(TextPrompt(TextPrompt.__name__))
        self.add_dialog(ConfirmPrompt(ConfirmPrompt.__name__))
        self.add_dialog(
            WaterfallDialog(
                "WFDialog", 
                [
                 self.menu_step, 
                 self.options_step,
                 self.final_step, 
                 self.loop_step]
            )
        )
        self.add_dialog(findbook)
        self.add_dialog(registration_dialog)
        self.add_dialog(wishlist_dialog)
        self.add_dialog(suggest_dialog)
        

        self.add_dialog(
            WaterfallDialog(
                "WFDialogLogin",
                [
                    self.prompt_step,
                    self.login_step,
                    self.continue_step
                ]
            )
        )

        self.initial_dialog_id = "WFDialogLogin"
        self.conversation_state=conversation_state

        
        

    async def prompt_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        welcome_card = self.create_welcome_card()
        await step_context.context.send_activity(welcome_card)
        return await step_context.begin_dialog(OAuthPrompt.__name__)
        

    async def login_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        step_context.values["skip"] = False
        if step_context.result:
            iduser=step_context.context.activity.from_property.id
            
            if not DatabaseManager.user_is_registered(iduser):
                await step_context.context.send_activity(MessageFactory.text('''Non sei registrato, ti farò selezionare tre categorie di interesse per effettuare la registrazione'''))
                return await step_context.begin_dialog(self.registration_dialog_id) 
            else:
                messages = DatabaseManager.search_messages_user(iduser)
                if len(messages)>0:
                    message_text = "Dal tuo ultimo accesso ci sono novità sui tuoi libri nella wishlist.\n"
                    for message in messages:
                        message_text+=message+"\n"
                    message = MessageFactory.text(message_text, message_text, InputHints.ignoring_input)
                    await step_context.context.send_activity(message)
                return await step_context.next([])
        else:
            await step_context.context.send_activity("Il login non è andato a buon fine. Riprova.")
            return await step_context.end_dialog()
    

    async def continue_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        return await step_context.begin_dialog("WFDialog")
        

    async def menu_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        if not self._luis_recognizer.is_configured:
            await step_context.context.send_activity(
                MessageFactory.text(
                    "NOTE: LUIS is not configured. To enable all capabilities, add 'LuisAppId', 'LuisAPIKey' and "
                    "'LuisAPIHostName' to the appsettings.json file.",
                    input_hint=InputHints.ignoring_input,
                )
            )

            return await step_context.next(None)

        card = HeroCard(
        text ="Ciao, come posso aiutarti? Per uscire digita quit o esci.",
        buttons = [
            CardAction(
                type=ActionTypes.im_back,
                title ="Info",
                value="info"
            ),
            CardAction(
                type=ActionTypes.im_back,
                title ="Visualizza wishlist",
                value="wishlist"
            ),
            CardAction(
                type=ActionTypes.im_back,
                title ="Cerca libro",
                value="cerca"
            ),
            CardAction(
                type=ActionTypes.im_back,
                title ="Suggerisci libri",
                value="suggerisci"
            ),
            CardAction(
                type=ActionTypes.im_back,
                title ="Logout",
                value="logout"
            )
        ],   
        )
        return await step_context.prompt(
            TextPrompt.__name__,
            PromptOptions(
                MessageFactory.attachment(CardFactory.hero_card(card))
            ),
        )
        


    async def options_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        option=step_context.result
        intent = await LuisHelper.execute_luis_query(self._luis_recognizer,step_context.context)

        if option.lower()=="quit" or option.lower()=="esci":
            await step_context.context.send_activity("Cancelling")
            return await step_context.cancel_all_dialogs() 
        if option=="info" or intent==Intent.INFO.value:
            info_card = self.create_adaptive_card_attachment()
            resp = MessageFactory.attachment(info_card)
            await step_context.context.send_activity(resp)
            return await step_context.next([])
        if option=="cerca" or intent==Intent.FIND_BOOK.value:
            return await step_context.begin_dialog(self.findbook_dialog_id)
        if option=="wishlist" or intent==Intent.SHOW_WISHLIST.value:
            step_context.values["skip"] = True
            return await step_context.begin_dialog(self.wishlist_dialog_id)
        if option=="suggerisci" or intent==Intent.TIP_BOOK.value:
            return await step_context.begin_dialog(self.suggest_dialog_id)
        if option=="logout": 
            bot_adapter: BotFrameworkAdapter = step_context.context.adapter
            await bot_adapter.sign_out_user(step_context.context, self.connection_name)
            await step_context.context.send_activity("Sei stato disconnesso.")
            return await step_context.cancel_all_dialogs()
        

        
    async def final_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        try:
            skip = step_context.values["skip"]
        except KeyError:
            skip = False
            step_context.values["skip"] =False
        if not skip:
            message_text = "Posso fare qualcos'altro per te?"
            prompt_message = MessageFactory.text(message_text, message_text, InputHints.expecting_input)
            return await step_context.prompt(
                ConfirmPrompt.__name__, PromptOptions(prompt=prompt_message)
            )
        else:
            step_context.values["skip"] = False
            return await step_context.next(True)


    async def loop_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        result=step_context.result
        if result:
            return await step_context.replace_dialog("WFDialog")
        return await step_context.cancel_all_dialogs()

    

    def create_adaptive_card_attachment(self):
        title = "Ciao sono BotTipBooks"
        subtitle = "Ecco cosa posso fare per te..."
        text = '''Sono un bot dotato di intelligenza artificiale che ti permette di:\n\n- Ricercare libri e mostrarti i prezzi migliori sul mercato.\n- Creare una wishlist dove poter inserire tutti i libri che ti interessano.\n- Mantenere sott'occhio i libri della tua wishlist e avvisarti se cambiano di prezzo, o ritornano disponibili.\n- Posso offrirti suggerimenti su nuovi libri da leggere in base alle tue preferenze.\n- Posso guidarti all'acquisto di nuovi libri, confrontando le varie recensioni per un particolare libro che ti interessa.\n\nPuoi utilizzarmi come preferisci, puoi impartirmi comandi, oppure utilizzare i bottoni del menu'. Iniziamo? :)'''
        card = CardFactory.hero_card(HeroCard(title=title, subtitle=subtitle, text=text))
        return card


    def create_welcome_card(self):
        title = "Benvenuto in BotTipBooks"
        subtitle = "Per iniziare ad utilizzare il bot effettuare il login oppure utilizzare il menu"
        image = CardImage(url="https://www.lineaedp.it/files/2017/01/bot.jpg")
        card = HeroCard(title=title, subtitle=subtitle, images=[image])
        activity = MessageFactory.attachment(CardFactory.hero_card(card))
        return activity
    




        
