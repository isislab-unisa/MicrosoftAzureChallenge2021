from dialogs.delete_person_dialog import DeletePersonDialog
from typing import Dict

from botbuilder.core import UserState, MessageFactory, TurnContext
from botbuilder.schema import CardAction, SuggestedActions, ActionTypes
from botbuilder.dialogs import (
    WaterfallDialog, 
    WaterfallStepContext, 
    DialogTurnResult,
    OAuthPrompt,
    OAuthPromptSettings,
    TextPrompt,
)

from dialogs.add_person_dialog import AddPersonDialog
from dialogs.logout_dialog import LogoutDialog
from dialogs.test_dialog import TestDialog

from model import UserProfile

from github_client import GitHubClient

import uuid


class MainDialog(LogoutDialog):
    def __init__(self, connection_name: str, 
        user_state: UserState, 
        logged_users: Dict[str, str], 
    ):
        super(MainDialog, self).__init__(MainDialog.__name__, connection_name, user_state, logged_users)

        self.add_dialog(
            OAuthPrompt(
                OAuthPrompt.__name__,
                OAuthPromptSettings(
                    connection_name=connection_name,
                    text="Per favore effettua l'accesso a GitHub",
                    title="Sign In",
                    timeout=300000,
                ),
            )
        )
        
        self.add_dialog(TextPrompt(TextPrompt.__name__))

        self.add_dialog(AddPersonDialog(
            user_profile_accessor=self.user_profile_accessor, 
            logged_users=logged_users,
        ))

        self.add_dialog(DeletePersonDialog(
            user_profile_accessor=self.user_profile_accessor,
            logged_users=logged_users,
        ))

        self.add_dialog(TestDialog(
            user_profile_accessor=self.user_profile_accessor,
            logged_users=logged_users,
        ))

        self.add_dialog(
            WaterfallDialog(
                "Main",
                [
                    self._init_step,
                    self._login_step,
                    self._command_step,
                ],
            )
        )

        self.initial_dialog_id = "Main"

    async def _init_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        user_profile: UserProfile = await self.user_profile_accessor.get(step_context.context, UserProfile)

        if not user_profile.is_auth:
            return await step_context.begin_dialog(OAuthPrompt.__name__)

        return await step_context.continue_dialog()

    async def _login_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        user_profile: UserProfile = await self.user_profile_accessor.get(step_context.context, UserProfile)
        user_bot_id = TurnContext.get_conversation_reference(step_context.context.activity).user.id

        if user_profile.is_auth:
            self.logged_users[user_bot_id] = user_profile.id
            return await step_context.continue_dialog()

        if step_context.result:
            if isinstance(step_context.result, dict):
                result_token = step_context.result['token']
            else:
                result_token = step_context.result.token
            
            try:
                id = await GitHubClient(token=result_token).get_id()
            except:
                return await self._logout(step_context)
            
            self.logged_users[user_bot_id] = id
            user_profile.id = id
            user_profile.is_auth = True
            user_profile.random = str(uuid.uuid4())
            await step_context.context.send_activity(f"Accesso effettuato correttamente.")
            return await step_context.end_dialog()

        else:
            await step_context.context.send_activity("Non è stato possibile effettuare l'accesso.")
            return await step_context.cancel_all_dialogs()
            

    async def _command_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        user_profile: UserProfile = await self.user_profile_accessor.get(step_context.context, UserProfile)

        if step_context.result:
            command = step_context.result.lower()

            if command == 'id':
                await step_context.context.send_activity(f'Ecco il tuo ID: {user_profile.id}')
            elif command == 'aggiungi persona':
                return await step_context.begin_dialog(AddPersonDialog.__name__)
            elif command == 'cancella persona':
                return await step_context.begin_dialog(DeletePersonDialog.__name__)
            elif command == 'test':
                return await step_context.begin_dialog(TestDialog.__name__)
            elif command == 'aiuto':
                await step_context.context.send_activity(
                    'I comandi disponibili sono visualizzati in basso. '
                    'Puoi digitare in qualsiasi momento \'cancel\' per annullare l\'operazione corrente.'
                )
            
        #await self._show_commands(step_context.context)
        return await step_context.end_dialog()
    

    async def on_end_dialog(self, context: TurnContext, instance, reason) -> None:
        result = await super().on_end_dialog(context, instance, reason)
        await self._show_commands(context)
        return result


    async def _show_commands(self, context: TurnContext) -> None:
        reply = MessageFactory.text("Seleziona uno dei seguenti comandi")
        reply.suggested_actions = SuggestedActions(
            actions=[
                CardAction(
                    title="ID",
                    type=ActionTypes.im_back,
                    value="id"
                ),
                CardAction(
                    title="Aggiungi Persona",
                    type=ActionTypes.im_back,
                    value="Aggiungi Persona"
                ),
                CardAction(
                    title="Cancella Persona",
                    type=ActionTypes.im_back,
                    value="Cancella Persona"
                ),
                CardAction(
                    title="Aiuto",
                    type=ActionTypes.im_back,
                    value="Aiuto"
                ),
                CardAction(
                    title="Test",
                    type=ActionTypes.im_back,
                    value="Test"
                ),
                CardAction(
                    title="Logout",
                    type=ActionTypes.im_back,
                    value="Logout"
                )
            ]
        )

        await context.send_activity(reply)
