from botbuilder.dialogs import (ComponentDialog, DialogContext, DialogTurnResult, DialogTurnStatus, TextPrompt, 
    WaterfallDialog, WaterfallStepContext)
from botbuilder.schema import ActivityTypes, HeroCard, InputHints
from botbuilder.core import MessageFactory
from .cancel_and_help_dialog import CancelAndHelpDialog
from botbuilder.dialogs.prompts.prompt_options import PromptOptions
from botbuilder.dialogs.prompts import PromptValidatorContext
from botbuilder.dialogs.prompts import ConfirmPrompt
import requests
from bean import BookInfo
from databaseManager import DatabaseManager
from botbuilder.core.card_factory import CardFactory
from typing import List
import time
import json
import re
from text_analyzer import TextAnalyzer
from config import DefaultConfig

CONFIG = DefaultConfig()

class FindBookDialog(CancelAndHelpDialog):
    def __init__(self, dialog_id: str = None):
        super(FindBookDialog, self).__init__(dialog_id or FindBookDialog.__name__)
        self.add_dialog(TextPrompt("TextPromptLibro", FindBookDialog.validateName))
        self.add_dialog(TextPrompt("TextPromptSito", FindBookDialog.validateSite))
        self.add_dialog(ConfirmPrompt(ConfirmPrompt.__name__, FindBookDialog.yes_noValidator))
        self.add_dialog(
            WaterfallDialog(
                "WFDialog", [self.prompt_step, 
                self.search_step,
                self.confirmRec_step,
                self.prompt_to_wish,
                self.confirm_step, 
                self.add_to_wishlist
                ]
            )
        )

        self.initial_dialog_id = "WFDialog"


    async def prompt_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        message_text = "Quale libro vuoi cercare?"
        step_context.values["books"] = []
        step_context.values["amazonLink"] = None
        prompt_message = MessageFactory.text(
            message_text, message_text, InputHints.expecting_input
        )
        return await step_context.prompt(
            "TextPromptLibro", PromptOptions(prompt=prompt_message,
            retry_prompt=MessageFactory.text('''Quale libro vuoi cercare? Il nome del libro deve avere lunghezza compresa tra 3 e 50'''))
        )
    

    async def search_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        book_name=step_context.result
        card = self.find_book(book_name, step_context) 
        await step_context.context.send_activity(card)

        print(step_context.context.activity.from_property.id)
        books = step_context.values["books"]
        amazonLink = step_context.values["amazonLink"]
    
        if len(books)>0 and amazonLink is not None:
            message_text = "Vuoi conoscere le recensioni sul libro?"
            prompt_message = MessageFactory.text(message_text, message_text, InputHints.expecting_input)
            return await step_context.prompt(
                ConfirmPrompt.__name__, PromptOptions(prompt=prompt_message,
                    retry_prompt=MessageFactory.text('''Vuoi conoscere le recensioni sul libro? Scrivi yes o no'''))
                )
        
        return await step_context.end_dialog()



    async def confirmRec_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        result=step_context.result
        amazonLink = step_context.values["amazonLink"]
        link=None
        if result:
            if amazonLink is not None:
                print(amazonLink)
                results, mean = FindBookDialog.get_reviews(amazonLink)
                if results is not None:
                    max=results["positive"]
                    strMax = "Ti consiglio fortemente l'acquisto."
                    if results["negative"] > max:
                        max = results["negative"]
                        if mean<3:
                            strMax = "Non te lo consiglio affatto."
                        else:
                            strMax = "Ti consiglio di dargli un'occhiata."
                    elif results["neutral"] > max:
                        max = results["neutral"]
                        strMax = "Ti consiglio di dargli un'occhiata."
                    if strMax == "Ti consiglio fortemente l'acquisto." and mean<3:
                        strMax = "Non te lo consiglio affatto."
                    elif 3<= mean<4:
                        strMax = "Ti consiglio di dargli un'occhiata."

                    
                    message_text = ('''Ho analizzato le recensioni.\nI lettori hanno espresso {} opinioni positive, {} opinioni neutrali e {} opinioni negative.\nLa media del valore delle recensioni è {} stelle.\n'''.format(results["positive"], results["neutral"], results["negative"], mean))
                    message = MessageFactory.text(message_text, message_text, InputHints.ignoring_input)
                    await step_context.context.send_activity(message)
        
                    message_text = "\n" +strMax+"\n"
                    message = MessageFactory.text(message_text, message_text, InputHints.ignoring_input)
                    await step_context.context.send_activity(message)
                    return await step_context.next([])

            message_text = ('''Non ho trovato alcuna recensione.''')
            message = MessageFactory.text(message_text, message_text, InputHints.ignoring_input)
            await step_context.context.send_activity(message)
        return await step_context.next([])


    async def prompt_to_wish(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        message_text = "Desideri aggiungere il libro alla tua wishlist?"
        prompt_message = MessageFactory.text(message_text, message_text, InputHints.expecting_input)
        return await step_context.prompt(
            ConfirmPrompt.__name__, PromptOptions(prompt=prompt_message,
                retry_prompt=MessageFactory.text('''Desideri aggiungere il libro alla tua wishlist? Scrivi yes o no'''))
            )


    async def confirm_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        result=step_context.result
        if result:
            message_text="Su quale sito desideri acquistare il libro?"
            prompt_message = MessageFactory.text(message_text, message_text, InputHints.expecting_input)
            return await step_context.prompt(
                "TextPromptSito", PromptOptions(prompt=prompt_message,
                retry_prompt=MessageFactory.text('''Su quale sito desideri acquistare il libro? Inserisci un sito valido''')),
            )
        return await step_context.end_dialog()

    
    async def add_to_wishlist(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        result=step_context.result
        iduser=step_context.context.activity.from_property.id
        book_to_add=BookInfo()
        books = step_context.values["books"]
        for book in books:
            if book.site.lower()==result.lower():
                book_to_add=book
                break
        for book in books:
            if book.name is not None:
                book_to_add.name=book.name
                break
        for book in books:
            if book.author is not None:
                book_to_add.author=book.author
                break
                    
        genres=[]
        for book in books:
            if book.genre is not None:
                genres.append(book.genre)
        if book_to_add.site is not None:
            if DatabaseManager.add_book_wishlist(iduser, book_to_add, genres):
                message_text = ("Il libro {} è stato aggiunto alla tua wishlist".format(book_to_add.name))
                message = MessageFactory.text(message_text, message_text, InputHints.ignoring_input)
                await step_context.context.send_activity(message)
                return await step_context.end_dialog()
        message_text = ("Si è verificato un errore durante l'aggiunta del libro {} alla tua wishlist".format(book_to_add.name))
        message = MessageFactory.text(message_text, message_text, InputHints.ignoring_input)
        await step_context.context.send_activity(message)
        return await step_context.end_dialog()
    

    def create_result_card(self, books):
        title = None
        author = None
        genre = None
        for book in books:
            if book.name is not None:
                title=book.name
                break
        for book in books:
            if book.author is not None:
                author=book.author
                break
        for book in books:
            if book.genre is not None:
                genre=book.genre
                break
        
        attachments = []
        if title is not None and author is not None and genre is not None:
            subtitle="{} di {} \nGenere: {}".format(title, author, genre)
            card=HeroCard(title="RISULTATI", subtitle=subtitle)
            attachments.append(CardFactory.hero_card(card))
            text=""
            for book in books:
                text+="Nome del sito: {} \n".format(book.site)
                if book.price is not None:
                    text+="Prezzo: {}€ \n".format(book.price)
                else: 
                    text+="Prezzo non disponibile.\n"
                text+="Disponibilità: {} \n".format(book.availability)
                text+="Link per l'acquisto: {} \n".format(book.link)
                attachments.append(CardFactory.hero_card(HeroCard(text=text)))
                text=""
        else:
            text = "Errore durante la ricerca del libro"
            attachments.append(CardFactory.hero_card(HeroCard(text=text)))
        return MessageFactory.carousel(attachments)
        


    def find_book(self, title: str, step_context):
        r = requests.get(""+CONFIG.ENDPOINT_FIND_FUNCTION+"?name={}&who=all".format(title))      
        string_result=r.text.split("\n")
        amazonLink = string_result[0]
        step_context.values["amazonLink"] = amazonLink
        string_result = string_result[1:]
        book=BookInfo()
        books = []
        for i, s in enumerate(string_result):
            if i%7==0:
                book=BookInfo()
                book.site=s 
            elif i%7==1:
                book.name=s if s!="None" or s!='' else None
            elif i%7==2:
                book.author=s if s!="None" or s!='' else None
            elif i%7==3:
                book.availability=s if s!="None" else "Non disponibile"
            elif i%7==4:
                if s!="None":
                    s=s.replace(",", ".")
                    try:
                        book.price=float(s)
                    except ValueError:
                        book.price=None
                else:
                    book.price=None
            elif i%7==5:
                book.genre=s  if s!="None" or s!='' else None
            elif i%7==6:
                book.link=s
                books.append(book)
        step_context.values["books"] = books
        return self.create_result_card(books)
        
        

    @staticmethod
    async def validateName(prompt_context: PromptValidatorContext) -> bool:
        return (
            prompt_context.recognized.succeeded
            and 3 <= len(prompt_context.recognized.value) <= 50
        )
    
    @staticmethod
    async def yes_noValidator(prompt_context: PromptValidatorContext) -> bool:
        return (
            prompt_context.recognized.succeeded
            and isinstance(prompt_context.recognized.value, bool)
        )
    
    
    @staticmethod
    async def validateSite(prompt_context: PromptValidatorContext) -> bool:
        return (
            prompt_context.recognized.succeeded
            and str(prompt_context.recognized.value).lower() in ["mondadori", "feltrinelli", "ibs", "hoepli"]
        )
    

    @staticmethod
    def get_reviews(link: str):
        asin = link[link.rindex('/') + 1:]
        api_key = CONFIG.KEY_AMAZON_API
        params = {
            'api_key': api_key,
            'type': 'reviews',
            'amazon_domain': 'amazon.it',
            'asin': asin,
            'page': '3'
        }

        api_result = requests.get('https://api.rainforestapi.com/request', params)

        jsonStringResult = json.dumps(api_result.json())
        jsonResult = json.loads(jsonStringResult)
        reviews = jsonResult["reviews"]
        list_of_body=[]
        for review in reviews:
            list_of_body.append(review["body"])
        
        sum=0
        for review in reviews:
            sum+=float(review["rating"])
        
        if len(reviews)>0:
            mean=sum/len(reviews)
        else:
            mean=0
        
        text_analyzer=TextAnalyzer()
        if len(list_of_body)>0:
            results = text_analyzer.sentiment_analysis(list_of_body)
        else:
            results = None
        
        return (results, mean)

    

    
