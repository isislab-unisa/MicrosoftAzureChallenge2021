from botbuilder.dialogs import ComponentDialog, ConfirmPrompt, DialogContext, DialogTurnResult, DialogTurnStatus, PromptOptions, TextPrompt, WaterfallDialog, WaterfallStepContext
from .cancel_and_help_dialog import CancelAndHelpDialog
from botbuilder.core import CardFactory, MessageFactory
from databaseManager import DatabaseManager
from typing import List
from bean import BookInfo
from botbuilder.schema import HeroCard, InputHints
from bot_recognizer import BotRecognizer
from helpers.luis_helper import Intent, LuisHelper
from botbuilder.dialogs.prompts import PromptValidatorContext
import time
from typing import Dict

dic = dict()

class WishlistDialog(CancelAndHelpDialog):
    def __init__(self, dialog_id: str = None):
        super(WishlistDialog, self).__init__(dialog_id or WishlistDialog.__name__)
        self.add_dialog(TextPrompt(TextPrompt.__name__))
        self.add_dialog(TextPrompt("TitoloLibro", WishlistDialog.validateTitle))
        self.add_dialog(ConfirmPrompt(ConfirmPrompt.__name__, WishlistDialog.yes_noValidator))
        self.add_dialog(
            WaterfallDialog(
                "WFDialog", [self.first_step,
                self.input_step,
                self.confirm_step,
                self.cancel_step,
                self.final_step
                ]
            )
        )

        self.initial_dialog_id = "WFDialog"
        self._luis_recognizer=None

    
    async def first_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        iduser = step_context.context.activity.from_property.id
        user=DatabaseManager.find_user_info(iduser)
        step_context.values["user"] = user
        dic[iduser] = user.wishlist
        card, flag=self.create_wishlist_card(user.wishlist)
        await step_context.context.send_activity(card)
        if flag:
            message_text="Puoi cancellare un libro dalla tua wishlist oppure tornare al menu principale. Cosa desideri fare?"
            prompt_message = MessageFactory.text(message_text, message_text, InputHints.expecting_input)
            return await step_context.prompt(
                TextPrompt.__name__, PromptOptions(prompt=prompt_message)
            )
        return await step_context.end_dialog()
    

    async def input_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        intent = await LuisHelper.execute_luis_query(self._luis_recognizer,step_context.context)
        if intent == Intent.MENU_INTENT.value:
            return await step_context.end_dialog()
        if intent == Intent.CANCELLA_WISHLIST.value:
            message_text="Inserisci il titolo del libro che vuoi cancellare"
            prompt_message = MessageFactory.text(message_text, message_text, InputHints.expecting_input)
            return await step_context.prompt(
                "TitoloLibro", PromptOptions(prompt=prompt_message,
                retry_prompt = MessageFactory.text("Inserisci un titolo valido."))
            )
        
        await step_context.context.send_activity(
            MessageFactory.text(
                "Input non valido"
            )
        )
        return await step_context.end_dialog()



    async def confirm_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        result=step_context.result
        user = step_context.values["user"]
        book_to_remove = None
        for book in user.wishlist:
            if book.name.replace(",","").lower()==result.replace(",","").lower():
                book_to_remove=book
                break
        
        step_context.values["book_to_remove"] =book_to_remove
        if book_to_remove is not None:
            message_text = "Sei sicuro di voler cancellare {}?".format(book_to_remove.name)
            prompt_message = MessageFactory.text(message_text, message_text, InputHints.expecting_input)
            return await step_context.prompt(
                ConfirmPrompt.__name__, PromptOptions(prompt=prompt_message,
                retry_prompt=MessageFactory.text('''Sei sicuro di voler cancellare? Scrivi yes o no'''))
            )
        return await step_context.end_dialog()
            

    
    async def cancel_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        result = step_context.result
        user = step_context.values["user"]
        book_to_remove = step_context.values["book_to_remove"]
        if result:
            user.wishlist.remove(book_to_remove)
            DatabaseManager.remove_wishlist(user.idUser, book_to_remove)
            step_context.values["user"] = user
            message_text="Il libro {} è stato rimosso correttamente.".format(book_to_remove.name)
            await step_context.context.send_activity(MessageFactory.text(message_text))
            return await step_context.next([])
        else:
            await step_context.context.send_activity(
                MessageFactory.text(
                    "Operazione annullata"
                )
            )
            return await step_context.end_dialog()

            

    async def final_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        user = step_context.values["user"]
        card, res = self.create_wishlist_card(user.wishlist)
        await step_context.context.send_activity(card)
        return await step_context.end_dialog()

                

    def create_wishlist_card(self, books: List):
        card=HeroCard(title="La tua wishlist")
        attachments = []
        attachments.append(CardFactory.hero_card(card))
        text=""
        flag=False
        for book in books:
            flag=True
            if book.author is not None:
                text+="{} di {}\n\n".format(book.name, book.author)
            else:
                text+="{}\n\n".format(book.name)
            text+="Genere: {}\n".format(book.genre)
            text+="Nome del sito: {} \n".format(book.site)
            if book.price is not None:
                text+="Prezzo: {}€ \n".format(book.price)
            else: 
                text+="Prezzo non disponibile.\n"
            text+="Disponibilità: {} \n".format(book.availability)
            text+="Link per l'acquisto: {} \n".format(book.link)
            attachments.append(CardFactory.hero_card(HeroCard(text=text)))
            text=""

        if flag:
            activity = MessageFactory.carousel(attachments) 
            return (activity, True)
        else:
            new_card = HeroCard(title ="La tua wishlist è vuota", subtitle= '''Non puoi eseguire nessuna operazione. Puoi cercare un libro ed aggiungerlo. Ti riporto al menù principale. ''')
            attachments.append(CardFactory.hero_card(new_card))
            activity = MessageFactory.carousel(attachments) 
            return (activity, False)
        

    
    def set_recognizer(self, luis_recognizer: BotRecognizer):
        self._luis_recognizer=luis_recognizer


    @staticmethod
    async def yes_noValidator(prompt_context: PromptValidatorContext) -> bool:
        return (
            prompt_context.recognized.succeeded
            and isinstance(prompt_context.recognized.value, bool)
        )

    
    @staticmethod
    async def validateTitle(prompt_context: PromptValidatorContext) -> bool:
        title=prompt_context.recognized.value
        iduser = prompt_context.context.activity.from_property.id
        books = dic[iduser]
        book_to_add=None
        for book in books:
            if book.name.replace(",","").lower()==title.replace(",","").lower():
                book_to_add=book
                break
        return (
            prompt_context.recognized.succeeded
            and book_to_add is not None
        )
