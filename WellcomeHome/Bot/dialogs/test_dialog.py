from model.user_profile import UserProfile
from typing import Dict

from botbuilder.dialogs import (
    ComponentDialog,
    WaterfallDialog,
    WaterfallStepContext,
    DialogTurnResult,
    AttachmentPrompt,
    PromptOptions,
)
from botbuilder.core import StatePropertyAccessor, MessageFactory

from azure.storage.blob import BlobServiceClient

from config import DefaultConfig

import requests
import uuid
import io


CONFIG = DefaultConfig()

blob_service_client = BlobServiceClient.from_connection_string(CONFIG.STORAGE_CONNECTION)


class TestDialog(ComponentDialog):
    def __init__(self, user_profile_accessor: StatePropertyAccessor, logged_users: Dict[str, str]):
        super().__init__(TestDialog.__name__)
        
        self.user_profile_accessor = user_profile_accessor
        self.logged_users = logged_users

        self.add_dialog(AttachmentPrompt(AttachmentPrompt.__name__))

        self.add_dialog(WaterfallDialog(
            "TestWF",
            [
                self._get_pic,
                self._parse_pic,
            ]
        ))

        self.initial_dialog_id = "TestWF"
    
    async def _get_pic(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        return await step_context.prompt(
            AttachmentPrompt.__name__,
            PromptOptions(
                prompt=MessageFactory.text("Per favore inviami l'immagine che devo testare"),
                retry_prompt=MessageFactory.text('Devi inviarmi una foto. Per cancellare l\'operazione digita "cancel".')
            )
        )
    
    async def _parse_pic(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        user_profile = await self.user_profile_accessor.get(step_context.context, UserProfile)

        if step_context.result:
            if 'image' not in step_context.result[0].content_type: # check if there is an image
                await step_context.context.send_activity("Tipo di file non valido. Cancello tutte le operazioni in corso.")
                return await step_context.cancel_all_dialogs()

            url = step_context.result[0].content_url
            response = requests.get(url)
            
            if response:
                file = io.BytesIO(response.content)
                blob_client = blob_service_client.get_blob_client('img', f'{user_profile.id}/{uuid.uuid4()}')
                blob_client.upload_blob(file)
                await step_context.context.send_activity('Upload effettuato correttamente.')

            else:
                await step_context.context.send_activity('Non sono riuscito ad effettuare il download dell\'immagine.')
            return await step_context.cancel_all_dialogs()
            
        await step_context.context.send_activity('Operazione annullata.')
        return await step_context.cancel_all_dialogs()