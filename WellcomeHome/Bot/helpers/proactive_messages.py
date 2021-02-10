from botbuilder.core import TurnContext, ConversationState
from botbuilder.schema import Activity, ActivityTypes, Attachment
from botbuilder.dialogs import Dialog

from typing import Any, Callable


IDENTIFIED = 'identified'
UNIDENTIFIED = 'unidentified'
NEW_USER = 'new_user'

class ProactiveRequest:
    def __init__(self, body: dict) -> None:
        if 'id' not in body or 'status' not in body:
            raise Exception('Bad Format Data') 

        self.id = body['id']
        self.status = body['status']
        self.image = body['image'] if 'image' in body else None
        self.name = body['name'] if 'name' in body else None
        self.surname = body['surname'] if 'surname' in body else None


def parse_proactive_message(user_id: str, body: Any) -> Callable:
    body = ProactiveRequest(body)
    if body.status == IDENTIFIED:
        return identified(body)
    elif body.status == UNIDENTIFIED:
        return unidentified(body)
    elif body.status == NEW_USER:
        return new_user()
    else:
        raise Exception('Bad Data')
    

def identified(body: ProactiveRequest):
    async def func(turn_context: TurnContext):
        await turn_context.send_activity(f'\U0001F3E0 {body.name} {body.surname} è tornato a casa.')
    
    return func


def unidentified(body: ProactiveRequest):
    async def func(turn_context: TurnContext):
        reply = Activity(type=ActivityTypes.message)
        
        if body.image:
            attachment = Attachment(
                name="person.png",
                content_type="image/png",
                content_url=f"data:image/png;base64,{body.image}",
            )
            reply.attachments = [attachment]

        reply.text = '\U0001F3E0 Qualcuno è tornato a casa ma non so chi sia.'

        await turn_context.send_activity(reply)
    
    return func

def new_user():
    async def func(turn_context: TurnContext):
        await turn_context.send_activity(f'Devi inizializzare il tuo profilo caricando almeno un volto.')
    return func
