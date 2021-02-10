from typing import List

class Category:
    def __init__(self, name: str, synonyms: List = None):
        self.name=name
        self.synonyms=[] if synonyms==None else synonyms
    