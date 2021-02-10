from abc import ABCMeta, abstractmethod


class DatabaseConnector:
    __metaclass__ = ABCMeta

    @abstractmethod
    def get_data(self, chat_id):
        raise NotImplementedError

    @abstractmethod
    def top(self):
        raise NotImplementedError

    @abstractmethod
    def register(self, chat_id, nickname):
        raise NotImplementedError

    @abstractmethod
    def add_partita_giocata(self, chat_id, vinta=False):
        raise NotImplementedError
