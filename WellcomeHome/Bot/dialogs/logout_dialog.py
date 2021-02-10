from typing import Dict
from model import UserProfile
from botbuilder.dialogs import DialogTurnResult, ComponentDialog, DialogContext
from botbuilder.core import BotFrameworkAdapter, UserState
from botbuilder.schema import ActivityTypes


class LogoutDialog(ComponentDialog):
    def __init__(self, dialog_id: str, connection_name: str, user_state: UserState, logged_users: Dict[str, str]):
        super(LogoutDialog, self).__init__(dialog_id)

        self.connection_name = connection_name
        self.user_profile_accessor = user_state.create_property("UserProfile")
        self.logged_users = logged_users


    async def on_begin_dialog(self, inner_dc: DialogContext, options: object) -> DialogTurnResult:
        result = await self._interrupt(inner_dc)
        if result:
            return result
        return await super().on_begin_dialog(inner_dc, options)

    async def on_continue_dialog(self, inner_dc: DialogContext) -> DialogTurnResult:
        result = await self._interrupt(inner_dc)
        if result:
            return result
        return await super().on_continue_dialog(inner_dc)

    async def _interrupt(self, inner_dc: DialogContext):
        if inner_dc.context.activity.type == ActivityTypes.message and inner_dc.context.activity.text:
            text = inner_dc.context.activity.text.lower()
            if text == "logout":
                return await self._logout(inner_dc)
            if text == "cancel":
                return await self._cancel(inner_dc)
    
    async def _logout(self, inner_dc: DialogContext):
        user_profile: UserProfile = await self.user_profile_accessor.get(inner_dc.context, UserProfile)
        user_profile.is_auth = False

        bot_adapter: BotFrameworkAdapter = inner_dc.context.adapter
        await bot_adapter.sign_out_user(inner_dc.context, self.connection_name)
        await inner_dc.context.send_activity("Sei stato correttamente disconnesso.")
        return await inner_dc.cancel_all_dialogs()

    async def _cancel(self, inner_dc: DialogContext):
        await inner_dc.context.send_activity("Tutte le operazioni sono state cancellate.")
        return await inner_dc.cancel_all_dialogs()