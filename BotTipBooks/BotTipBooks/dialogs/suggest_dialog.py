from botbuilder.dialogs import ConfirmPrompt, DialogTurnResult, PromptOptions, TextPrompt, WaterfallDialog, WaterfallStepContext
from botbuilder.core import CardFactory, MessageFactory
from typing import List
from databaseManager import DatabaseManager
from dialogs import CancelAndHelpDialog
import requests
import json
from bean import BookInfo
from botbuilder.dialogs.prompts import PromptValidatorContext
from botbuilder.schema import HeroCard, InputHints
import random
from typing import Dict
from config import DefaultConfig

cat_and_code = {"Adolescenti e ragazzi": "13077484031",
    "Arte cinema e fotografia": "13077485031",
    "Biografie": "13077512031",
    "Cucina": "508822031",
    "Fantascienza e fantasy": "508773031",
    "Fumetti e manga": "508784031",
    "Gialli e thriller": "508771031",
    "Letteratura": "508770031",
    "Romanzi rosa": "508775031",
    "Scienze e tecnologia": "508867031",
    "Storia": "508796031"
}

dic = dict()
CONFIG = DefaultConfig()

class SuggestBooksDialog(CancelAndHelpDialog):
    def __init__(self, dialog_id: str = None):
        super(SuggestBooksDialog, self).__init__(dialog_id or SuggestBooksDialog.__name__)

        self.add_dialog(TextPrompt(TextPrompt.__name__))
        self.add_dialog(TextPrompt("TextPromptTitle", SuggestBooksDialog.titleValidator))
        self.add_dialog(ConfirmPrompt(ConfirmPrompt.__name__, SuggestBooksDialog.yes_noValidator))
        self.add_dialog(
            WaterfallDialog(
                "WFDialog", [self.showBooks_step, self.confirm_step, self.add_step]
            )
        )

        self.initial_dialog_id = "WFDialog"
    
        
    
    async def showBooks_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        iduser=step_context.context.activity.from_property.id
        genres_user = []
        user_with_info = DatabaseManager.find_user_info(iduser)
        genres_user = user_with_info.categories
        
        index=random.randint(0,len(genres_user)-1)
        category = genres_user[index]
        code = cat_and_code[category.name]
        books = SuggestBooksDialog.call_amazon(code)
        card=SuggestBooksDialog.create_card(books, category.name)
        step_context.values["books"] = books
        dic[iduser] = books
        await step_context.context.send_activity(card)

        message_text="Vuoi aggiungere un libro alla tua wishlist?"
        prompt_message = MessageFactory.text(message_text, message_text, InputHints.expecting_input)
        return await step_context.prompt(
                ConfirmPrompt.__name__, PromptOptions(prompt=prompt_message,
                retry_prompt=MessageFactory.text('''Vuoi aggiungere un libro alla tua wishlist? 
                Scrivi yes o no'''))
        )
    

    async def confirm_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        result=step_context.result
        message_text="Inserisci il titolo del libro che vuoi aggiungere alla wishlist"
        prompt_message = MessageFactory.text(message_text, message_text, InputHints.expecting_input)
        if result:
            return await step_context.prompt(
                "TextPromptTitle", PromptOptions(prompt=prompt_message,
                retry_prompt=MessageFactory.text('''Inserisci un titolo valido'''))
            )
        else:
            return await step_context.end_dialog()
        

    async def add_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        title=step_context.result
        book_to_add=self.find_book(title)
        iduser=step_context.context.activity.from_property.id
        if book_to_add is not None:
            if DatabaseManager.add_book_wishlist(iduser, book_to_add, [book_to_add.genre]):
                message_text="Il libro {} è stato aggiunto alla tua wishlist.".format(book_to_add.name)
                await step_context.context.send_activity(MessageFactory.text(message_text))
            else:
                message_text="Il libro {} non è stato aggiunto alla tua wishlist.".format(book_to_add.name)
                await step_context.context.send_activity(MessageFactory.text(message_text))
        return await step_context.end_dialog()
        
    

    @staticmethod
    def call_amazon(code: str):
        params = {
            'api_key': CONFIG.KEY_AMAZON_API,
            'type': 'bestsellers',
            'url': 'https://www.amazon.it/gp/bestsellers/books/'+ code,
            'page': '1'
        }

        api_result = requests.get('https://api.rainforestapi.com/request', params)
        jsonStringResult = json.dumps(api_result.json())
        jsonResult = json.loads(jsonStringResult)
        lista_bestseller = jsonResult['bestsellers']
        book = BookInfo()
        booksTemp = []
        books_cat = []
        for i, libro in enumerate(lista_bestseller):
            title = libro['title']
            try:
                price = libro['price']['value']
            except KeyError:
                price = None
            category = libro['current_category']['name']
            link = libro['link']
            book.name = title
            book.price = price
            book.genre = category
            book.link = link
            booksTemp.append(book)
            book=BookInfo()

        for i in range(3):
            index = random.randint(0, len(booksTemp)-1)
            book=booksTemp[index]
            books_cat.append(book)
            booksTemp.remove(book)
        return books_cat

        
    
    @staticmethod
    def create_card(books, categoria):
        card=HeroCard(title="Ecco i miei suggerimenti per te per la categoria: {}".format(categoria))
        attachments = []
        attachments.append(CardFactory.hero_card(card))
        text=""
        for book in books:
            text+="Titolo: {}\n".format(book.name)
            text+="Nome del sito: Amazon\n"
            if book.price is not None:
                text+="Prezzo: {}€ \n".format(book.price)
            else: 
                text+="Prezzo non disponibile.\n"
            text+="Link per l'acquisto: {} \n".format(book.link)
            attachments.append(CardFactory.hero_card(HeroCard(text=text)))
            text=""

        activity = MessageFactory.carousel(attachments) 
        return activity
    

    @staticmethod
    async def yes_noValidator(prompt_context: PromptValidatorContext) -> bool:
        return (
            prompt_context.recognized.succeeded
            and isinstance(prompt_context.recognized.value, bool)
        )


    @staticmethod
    async def titleValidator(prompt_context: PromptValidatorContext) -> bool:
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



    def find_book(self, title: str):
        r = requests.get(""+CONFIG.ENDPOINT_FIND_FUNCTION+"?name={}&who=amazon".format(title))      
        string_result=r.text.split("\n")
        book=BookInfo()
        for i, s in enumerate(string_result):
            if i==0:
                book.site=s 
            elif i==1:
                book.name=s if s!="None" or s!='' else None
            elif i==2:
                book.author=s if s!="None" or s!='' else None
            elif i==3:
                book.availability=s if s!="None" else "Non disponibile"
            elif i==4:
                if s!="None":
                    s=s.replace(",", ".")
                    try:
                        book.price=float(s)
                    except ValueError:
                        book.price=None
                else:
                    book.price=None
            elif i==5:
                book.genre=s  if s!="None" or s!='' else None
            elif i==6:
                book.link=s
            elif i==7:
                break
        return book
