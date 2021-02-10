class Book:
    def __init__(self, name=None, author=None, genre=None):
        self.name=name
        self.author=author
        self.genre=genre


class BookInfo(Book):
    def __init__(self, name=None, author=None, price=None, genre=None, site=None, availability=None, link=None):
        super().__init__(name=name, author=author, genre=genre)
        self.site=site
        self.price=price
        self.availability=availability
        self.link=link