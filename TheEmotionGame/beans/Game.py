from beans.Giocatore import Giocatore


class Game:

    def __init__(self, giocatore1_chatid, giocatore2_chatid, maximum_score=3):
        self.giocatore1 = Giocatore(giocatore1_chatid)
        self.giocatore2 = Giocatore(giocatore2_chatid)
        self.foto = None
        self.__maximum_score = maximum_score

    @property
    def maximum_score(self):
        return self.__maximum_score

    @maximum_score.setter
    def maximum_score(self, maximum_score):
        self.__maximum_score = maximum_score

    def get_vincitore(self):
        if self.giocatore1.punteggio == self.__maximum_score:
            if self.giocatore2.punteggio == self.__maximum_score:
                return None, None
            else:
                return self.giocatore1, self.giocatore2
        elif self.giocatore2.punteggio == self.__maximum_score:
            if self.giocatore1.punteggio == self.__maximum_score:
                return None, None
            else:
                return self.giocatore2, self.giocatore1
        else:
            return None, None
