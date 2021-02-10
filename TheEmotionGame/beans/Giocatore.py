class Giocatore:

    def __init__(self, chat_id):
        self.__chatid = chat_id
        self.__punteggio = 0

        #STATO = 0 -> INVIO FOTO INIZIALE
        #STATO = 1 -> ATTESA
        self.__stato = 0
        self.__data = None

        # TURNO = 0 -> DEVE INDOVINARE
        # TURNO = 1 -> DEVE INVIARE LA FOTO DELL'EMOZIONE DA INDOVINARE
        self.__turno = None

        # BING_SEARCH = TRUE -> VUOLE USARE BING SEARCH
        self.__bing_search = False

        # QUERY_SEARCH -> VALORE DA CERCARE SU BING
        self.__query_search = None

        self.__images_urls = []

    @property
    def chatid(self): return self.__chatid

    @chatid.setter
    def chatid(self, chatid: str): self.__chatid = chatid

    @property
    def stato(self): return self.__stato

    @stato.setter
    def stato(self, stato: str): self.__stato = stato

    @property
    def turno(self):
        return self.__turno

    @turno.setter
    def turno(self, turno):
        self.__turno = turno

    @property
    def punteggio(self): return self.__punteggio

    @punteggio.setter
    def punteggio(self, punteggio: str): self.__punteggio = punteggio

    @property
    def data(self): return self.__data

    @data.setter
    def data(self, data: str): self.__data = data

    @property
    def bing_search(self):
        return self.__bing_search

    @bing_search.setter
    def bing_search(self, bing_search):
        self.__bing_search = bing_search

    @property
    def query_search(self):
        return self.__query_search

    @query_search.setter
    def query_search(self, query_search):
        self.__query_search = query_search

    @property
    def images(self):
        return self.__images_urls

    @images.setter
    def images(self, images):
        self.__images_urls = images