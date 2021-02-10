# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

from botbuilder.core import ActivityHandler, CardFactory, ConversationState, MessageFactory, TurnContext, UserState
from botbuilder.dialogs import Dialog, DialogTurnResult, DialogTurnStatus
from helpers.dialog_helper import DialogHelper
import os
import json
from typing import List, Dict
from botbuilder.schema import Activity, ActivityTypes, Attachment, CardImage, ChannelAccount, HeroCard, InputHints
from bean import User
from botbuilder.dialogs.dialog_set import DialogSet
import time



class DialogBot(ActivityHandler):
    def __init__(self, conversation_state: ConversationState,user_state: UserState, dialog: Dialog):
        if conversation_state is None:
            raise Exception("[DialogBot]: Missing parameter. conversation_state is required")
        if user_state is None:
            raise Exception("[DialogBot]: Missing parameter. user_state is required")
        if dialog is None:
            raise Exception("[DialogBot]: Missing parameter. dialog is required")
        
        self.conversation_state = conversation_state
        self.dialog_state_property = conversation_state.create_property("DialogState")
        self.user_state = user_state
        self.dialog = dialog
    



    async def on_members_added_activity(self, members_added: List[ChannelAccount], turn_context: TurnContext):
        for member in members_added:
            if member.id != turn_context.activity.recipient.id:
                await DialogHelper.run_dialog(self.dialog,turn_context, self.dialog_state_property)


    async def on_turn(self, turn_context: TurnContext):
        await super().on_turn(turn_context)
     
        await self.conversation_state.save_changes(turn_context, False)
        await self.user_state.save_changes(turn_context, False)


    async def on_message_activity(self, turn_context: TurnContext):
        await DialogHelper.run_dialog(
            self.dialog,
            turn_context,
            self.dialog_state_property,
        )

    
    

    