import datetime
import logging
from .databaseManager import DatabaseManager
from .book import BookInfo
from .user import User
import azure.functions as func
import requests

ENDPOINT = ""

def main(mytimer: func.TimerRequest) -> None:
    utc_timestamp = datetime.datetime.utcnow().replace(
        tzinfo=datetime.timezone.utc).isoformat()

    users = DatabaseManager.get_all_users()
    for user in users: 
        add_messages(user)



def add_messages(user: User):
    wishlist = user.wishlist
    for book in wishlist:
        messagePrice=None
        messageAvailabilty =None
        new_book = find_book(book.name, book.site.lower())
        new_book.author = book.author
        new_book.name = book.name

        if new_book.price is not None and book.price is not None:
            if new_book.price!=book.price and new_book.price > book.price:
                messagePrice = "Il prezzo del libro {} sul sito {} è aumentato. Prezzo precedente {}�, nuovo prezzo {}�".format(
                    book.name, book.site, book.price, new_book.price)
            elif new_book.price!=book.price and new_book.price < book.price:
                messagePrice = "Il prezzo del libro {} sul sito {} è diminuito. Prezzo precedente {}�, nuovo prezzo {}�".format(
                    book.name, book.site, book.price, new_book.price)

        if new_book.availability is not None and book.availability is not None:
            if new_book.availability!=book.availability:
                messageAvailabilty = '''Ci sono aggiornamenti sulla disponibilità del libro {} sul sito {}: {}'''.format(
                    book.name, book.site, new_book.availability
                )

        if messagePrice is not None or messageAvailabilty is not None:
            if messagePrice is not None:
                DatabaseManager.add_message(user.idUser, messagePrice)
            if messageAvailabilty is not None:
                DatabaseManager.add_message(user.idUser, messageAvailabilty)
            DatabaseManager.update_wishlist(user.idUser, new_book)
        


def find_book(title: str, who: str):
    r= requests.get(""+ENDPOINT+"?name={}&who={}".format(title, who))      
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
    
