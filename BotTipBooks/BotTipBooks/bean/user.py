from typing import List
from bean import BookInfo


class User:
    def __init__(self, id:str =None, categories: List = None, wishlist: List =None):
        self.idUser=id
        self.categories=[] if categories is None else categories
        self.wishlist=[] if wishlist is None else wishlist
    
    def add_category(self, category: str):
        self.categories.append(category)
    
    def add_book(self, book: BookInfo):
        self.wishlist.append(book)
    


        