from typing import List, Dict

from botbuilder.core import ConversationState, UserState, TurnContext, ActivityHandler
from botbuilder.dialogs import Dialog
from botbuilder.schema import ChannelAccount, Activity, ConversationReference
from helpers.dialog_helper import DialogHelper


class WellcomeHomeBot(ActivityHandler):
    def __init__(self, 
            conversation_state: ConversationState,
            user_state: UserState, 
            dialog: Dialog,
            coversation_references: Dict[str, ConversationReference]
        ):
        if conversation_state is None:
            raise Exception(
                "[WellcomeHomeBot]: Missing parameter. conversation_state is required"
            )
        if user_state is None:
            raise Exception("[WellcomeHomeBot]: Missing parameter. user_state is required")
        if dialog is None:
            raise Exception("[WellcomeHomeBot]: Missing parameter. dialog is required")

        self.conversation_references = coversation_references

        self.conversation_state = conversation_state
        self.user_state = user_state

        self.dialog = dialog


    async def on_turn(self, turn_context: TurnContext):
        await super().on_turn(turn_context)

        # Save any state changes that might have occurred during the turn.
        await self.conversation_state.save_changes(turn_context, False)
        await self.user_state.save_changes(turn_context, False)

    async def on_message_activity(self, turn_context: TurnContext):
        self._add_conversation_reference(turn_context.activity)
        await DialogHelper.run_dialog(
            self.dialog,
            turn_context,
            self.conversation_state.create_property("DialogState"),
        )

    async def on_members_added_activity(self, members_added: List[ChannelAccount], turn_context: TurnContext):
        for member in members_added:
            if member.id != turn_context.activity.recipient.id:
                await turn_context.send_activity(
                    "Ciao, sono \"Wellcome Home\" Bot"
                )
                await DialogHelper.run_dialog(
                    self.dialog,
                    turn_context,
                    self.conversation_state.create_property("DialogState")
                )

    async def on_token_response_event(self, turn_context: TurnContext):
        # Run the Dialog with the new Token Response Event Activity.
        await DialogHelper.run_dialog(
            self.dialog,
            turn_context,
            self.conversation_state.create_property("DialogState"),
        )

    async def on_conversation_update_activity(self, turn_context: TurnContext):
        self._add_conversation_reference(turn_context.activity)
        return await super().on_conversation_update_activity(turn_context)

   

    def _add_conversation_reference(self, activity: Activity):
        """
        This populates the shared Dictionary that holds conversation references. In this sample,
        this dictionary is used to send a message to members when /api/notify is hit.
        :param activity:
        :return:
        """
        conversation_reference = TurnContext.get_conversation_reference(activity)
        self.conversation_references[conversation_reference.user.id] = conversation_reference
