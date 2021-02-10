class UserProfile:
    def __init__(self) -> None:
        self._id = None
        self._is_auth = False
        self._random = None
    
    @property
    def id(self):
        return self._id
    @id.setter
    def id(self, new_val):
        self._id = new_val
    
    @property
    def is_auth(self):
        return self._is_auth
    @is_auth.setter
    def is_auth(self, new_val):
        self._is_auth = new_val
    
    @property
    def random(self):
        return self._random
    @random.setter
    def random(self, new_val):
        self._random = new_val
