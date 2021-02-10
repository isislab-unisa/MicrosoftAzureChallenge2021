import sys
import traceback
from datetime import datetime
from http import HTTPStatus

from aiohttp import web
from aiohttp.web import Request, Response, json_response
from botbuilder.core import (
    BotFrameworkAdapter,
    BotFrameworkAdapterSettings,
    ConversationState,
    MemoryStorage,
    TurnContext,
    UserState
)
from botbuilder.core.integration import aiohttp_error_middleware
from botbuilder.schema import Activity, ActivityTypes, ConversationReference, ChannelAccount

from bot import WellcomeHomeBot

from config import DefaultConfig
from dialogs import MainDialog

from typing import Any, Dict

from helpers import parse_proactive_message


CONFIG = DefaultConfig()

# Create adapter.
SETTINGS = BotFrameworkAdapterSettings(CONFIG.APP_ID, CONFIG.APP_PASSWORD)
ADAPTER = BotFrameworkAdapter(SETTINGS)


# Catch-all for errors.
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
    await context.send_activity(
        "To continue to run this bot, please fix the bot source code."
    )

    # Send a trace activity if we're talking to the Bot Framework Emulator
    if context.activity.channel_id == "emulator":
        # Create a trace activity that contains the error object
        trace_activity = Activity(
            label="TurnError",
            name="on_turn_error Trace",
            timestamp=datetime.utcnow(),
            type=ActivityTypes.trace,
            value=f"{error}",
            value_type="https://www.botframework.com/schemas/error",
        )
        # Send a trace activity, which will be displayed in Bot Framework Emulator
        await context.send_activity(trace_activity)


ADAPTER.on_turn_error = on_error

# Create MemoryStorage and state
MEMORY = MemoryStorage()
USER_STATE = UserState(MEMORY)
CONVERSATION_STATE = ConversationState(MEMORY)

# Create the logged users dict
LOGGED_USERS: Dict[str, str] = dict()

# Create dialog
MAIN_DIALOG = MainDialog(CONFIG.CONNECTION_NAME, USER_STATE, LOGGED_USERS)

# Create a conversation references
CONVERSATION_REFERENCES: Dict[str, ConversationReference] = dict()

# Create Bot
BOT = WellcomeHomeBot(
    conversation_state=CONVERSATION_STATE, 
    user_state=USER_STATE, 
    dialog=MAIN_DIALOG,
    coversation_references=CONVERSATION_REFERENCES
)


# Listen for incoming requests on /api/messages.
async def messages(req: Request) -> Response:
    # Main bot message handler.
    if "application/json" in req.headers["Content-Type"]:
        body = await req.json()
    else:
        return Response(status=HTTPStatus.UNSUPPORTED_MEDIA_TYPE)

    activity = Activity().deserialize(body)
    auth_header = req.headers["Authorization"] if "Authorization" in req.headers else ""

    response = await ADAPTER.process_activity(activity, auth_header, BOT.on_turn)
    if response:
        return json_response(data=response.body, status=response.status)
    return Response(status=HTTPStatus.OK)

# Listen for requests on /api/notify, and send a messages to all conversation members.
async def notify(req: Request) -> Response:
    if "application/json" in req.headers["Content-Type"]:
        body = await req.json()
        auth_headers = req.headers["Authorization"] if "Authorization" in req.headers else ""
        if auth_headers != CONFIG.TRUST_TOKEN:
            return Response(status=HTTPStatus.FORBIDDEN, text="You have not privileges to use this functionality")

        await _send_proactive_message(body)
        return Response(status=HTTPStatus.OK, text="Proactive messages have been sent")
    
    else:
        return Response(status=HTTPStatus.UNSUPPORTED_MEDIA_TYPE)

async def _send_proactive_message(body: Any):
    for conversation_reference in CONVERSATION_REFERENCES.values():
        usr: ChannelAccount = conversation_reference.user
        
        if usr.id in LOGGED_USERS and 'id' in body and body['id'] == LOGGED_USERS[usr.id]:
            callback = parse_proactive_message(
                user_id=LOGGED_USERS[usr.id], 
                body=body
            )

            await ADAPTER.continue_conversation(
                conversation_reference,
                callback,
                CONFIG.APP_ID,
            )


APP = web.Application(middlewares=[aiohttp_error_middleware])
APP.router.add_post("/api/messages", messages)
APP.router.add_post("/api/notify", notify)

if __name__ == "__main__":
    try:
        web.run_app(APP, host="0.0.0.0", port=CONFIG.PORT)
    except Exception as error:
        raise error
