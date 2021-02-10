from config import DefaultConfig
from typing import Dict

from botbuilder.core import StatePropertyAccessor, MessageFactory, CardFactory
from botbuilder.schema import Activity, ActivityTypes
from botbuilder.dialogs import (
    ComponentDialog, 
    WaterfallDialog, 
    WaterfallStepContext, 
    DialogTurnResult,
    AttachmentPrompt,
    TextPrompt,
    ChoicePrompt,
    Choice,
    PromptOptions,
    ListStyle,
    DialogTurnStatus
)

from model import UserProfile

from helpers.dao import UserDAO, PeopleDAO

import requests
import json

CONFIG = DefaultConfig()

user_dao = UserDAO(CONFIG)
people_dao = PeopleDAO(CONFIG)

with open("resources/insertPersonCard.json", 'rb') as f:
    INSERT_PERSON_CARD = CardFactory.adaptive_card(json.load(f))


class AddPersonDialog(ComponentDialog):
    def __init__(self, user_profile_accessor: StatePropertyAccessor, logged_users: Dict[str, str]):
        super().__init__(AddPersonDialog.__name__)

        self.add_dialog(AttachmentPrompt(AttachmentPrompt.__name__))
        self.add_dialog(ChoicePrompt(ChoicePrompt.__name__))
        self.add_dialog(TextPrompt(TextPrompt.__name__))
        self.add_dialog(WaterfallDialog(
                'AddPersonMainWF',
                [
                    self._init_step,
                    self._select_picture,
                    self._select_insert_mode,
                ]
            )
        )
        
        self.add_dialog(WaterfallDialog(
                'AddPersonFromScratchWF',
                [
                    self._insert_name,
                    self._insert_surname,
                    self._confirm_name_surname,
                    self._add_to_new_db
                ]
            )
        )
        
        self.add_dialog(WaterfallDialog(
                'AddPersonFromExistingWF',
                [
                    self._select_from_db,
                    self._confirm_choice,
                    self._add_to_existing_db
                ]
            )
        )

        self.logged_users = logged_users
        self.user_profile_accessor = user_profile_accessor

        self.initial_dialog_id = 'AddPersonMainWF'


    async def _init_step(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        return await step_context.prompt(
            AttachmentPrompt.__name__,
            PromptOptions(
                prompt=MessageFactory.text('Inviami la foto della persona che vuoi aggiungere.'),
                retry_prompt=MessageFactory.text('Devi inviarmi una foto. Per cancellare l\'operazione digita "cancel".'),
                validations=self._validate_picture
            )
        )


    async def _select_picture(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        if step_context.result:
            if 'image' not in step_context.result[0].content_type: # check if there is an image
                await step_context.context.send_activity("Tipo di file non valido. Cancello tutte le operazioni in corso.")
                return await step_context.cancel_all_dialogs()

            step_context.values['image_url'] = step_context.result[0].content_url
            return await step_context.prompt(
                ChoicePrompt.__name__,
                PromptOptions(
                    prompt=MessageFactory.text("Vuoi aggiungere un nuovo utente, o aggiornarne uno già presente?"),
                    retry_prompt=MessageFactory.text("Per favore seleziona un'opzione dalla lista."),
                    choices=[Choice('Nuovo'), Choice('Esistente')]
                )
            )
        
        await step_context.context.send_activity('Operazione annullata.')
        return await step_context.cancel_all_dialogs()
    
    async def _select_insert_mode(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        if step_context.result and step_context.result.value:
            if step_context.result.value == 'Esistente':
                return await step_context.replace_dialog('AddPersonFromExistingWF', options=step_context.values)

            elif step_context.result.value == 'Nuovo':
                return await step_context.replace_dialog('AddPersonFromScratchWF', options=step_context.values)

        return await step_context.cancel_all_dialogs()

    async def _select_from_db(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        step_context.values.update(step_context.options)
        user_info = await self.user_profile_accessor.get(step_context.context, UserProfile)
        try:
            user = user_dao.get_user_by_id(user_info.id)
            people = people_dao.retrive_people(user.person_group_id)
            people_list = [Choice(f'{person.id}) {person.name}  {person.surname}') for person in people]
            if not people_list:
                raise Exception('No people in Database')
        except:
            await step_context.context.send_activity(
                'Non sono riuscito ad ottenere le informazioni. '
                'Assicurati di aver aggiunto almeno una persona nel Database.')
            return await step_context.cancel_all_dialogs()

        return await step_context.prompt(
            ChoicePrompt.__name__,
            PromptOptions(
                prompt=MessageFactory.text('Seleziona la persona a cui associare la foto. '),
                retry_prompt=MessageFactory.text("Per favore seleziona un'opzione dalla lista."),
                style=ListStyle.hero_card,
                choices=people_list
            )
        )
    
    async def _confirm_choice(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        if step_context.result:
            string = step_context.result.value
            id, namesurname = string.split(') ')
            name, surname = namesurname.split('  ')

            step_context.values['id'] = id

            return await step_context.prompt(
                ChoicePrompt.__name__,
                PromptOptions(
                    prompt=MessageFactory.text(
                        f'Desideri aggiornare il profilo di {name} {surname} nel database?'
                    ),
                    retry_prompt=MessageFactory.text("Per favore seleziona un'opzione dalla lista."),
                    choices=[Choice('Si'), Choice('No')]
                )
            )

        await step_context.context.send_activity("Operazione cancellata.")
        return await step_context.cancel_all_dialogs()

    async def _add_to_existing_db(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        try:
            if step_context.result and step_context.result.value == 'Si':
                url = CONFIG.FUNCTION_ENDPOINT + f'?code={CONFIG.FUNCTION_KEY}'
                
                id = step_context.values['id']
                user_profile: UserProfile = await self.user_profile_accessor.get(step_context.context, UserProfile)
                user_info = user_dao.get_user_by_id(user_profile.id)

                person = people_dao.retrive_by_id(user_info.person_group_id, id)

                headers = {
                    'Content-Type': 'application/json'
                }
                body = {
                    'operation': 'update',
                    'data': {
                        'person_id': f'{person.person_id}',
                        'image_url': f'{step_context.values["image_url"]}',
                        'person_group_id': f'{user_info.person_group_id}'
                    }
                }
                response = requests.post(url=url, headers=headers, data=json.dumps(body))
                if response.status_code == 200:
                    await step_context.context.send_activity("Operazione effettuata correttamente.")
                    return await step_context.end_dialog()

                await step_context.context.send_activity("Operazione effettuata correttamente.")
                return await step_context.end_dialog()
            
            elif step_context.result and step_context.result.value == 'No':
                await step_context.context.send_activity("Operazione annullata.")
                return await step_context.end_dialog()
        except:
            pass

        await step_context.context.send_activity("Operazione cancellata.")
        return await step_context.cancel_all_dialogs()
    
    async def _insert_info(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        # uses adaptive cards to insert data
        step_context.values.update(step_context.options)

        message = Activity(
            text = "Compila la seguente scheda",
            type = ActivityTypes.message,
            attachments = [INSERT_PERSON_CARD],
        )

        await step_context.context.send_activity(message)
        return DialogTurnResult(status=DialogTurnStatus.Waiting, result={})

    async def _insert_name(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        step_context.values.update(step_context.options)
        
        return await step_context.prompt(
            TextPrompt.__name__,
            PromptOptions(
                prompt=MessageFactory.text('Per favore inserisci il nome'),
            )
        ) 
    
    async def _insert_surname(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        if step_context.result:
            step_context.values['name'] = step_context.result
            return await step_context.prompt(
                TextPrompt.__name__,
                PromptOptions(
                    prompt=MessageFactory.text('Per favore inserisci il cognome'),
                )
            ) 

        await step_context.context.send_activity("Operazione cancellata.")
        return await step_context.cancel_all_dialogs()

    async def _confirm_name_surname(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        if step_context.result:
            step_context.values['surname'] = step_context.result
            return await step_context.prompt(
                ChoicePrompt.__name__,
                PromptOptions(
                    prompt=MessageFactory.text(
                        f'Desideri inserire {step_context.values["name"]} {step_context.values["surname"]} nel database?'
                    ),
                    retry_prompt=MessageFactory.text("Per favore seleziona un'opzione dalla lista."),
                    choices=[Choice('Si'), Choice('No')]
                )
            ) 

        await step_context.context.send_activity("Operazione cancellata.")
        return await step_context.cancel_all_dialogs()
    
    async def _add_to_new_db(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        user_profile = await self.user_profile_accessor.get(step_context.context, UserProfile)
        try:
            if step_context.result and step_context.result.value == 'Si':
                
                url = CONFIG.FUNCTION_ENDPOINT + f'?code={CONFIG.FUNCTION_KEY}'
                headers = {
                    'Content-Type': 'application/json'
                }
                body = {
                    'operation': 'insert',
                    'data': {
                        'user_id': f'{user_profile.id}',
                        'name': f'{step_context.values["name"]}',
                        'surname': f'{step_context.values["surname"]}',
                        'image_url': f'{step_context.values["image_url"]}'
                    }
                }
                response = requests.post(url=url, headers=headers, data=json.dumps(body))
                if response.status_code == 200:
                    await step_context.context.send_activity("Operazione effettuata correttamente.")
                    return await step_context.end_dialog()
            
            elif step_context.result and step_context.result.value == 'No':
                await step_context.context.send_activity("Operazione annullata.")
                return await step_context.end_dialog()
        except Exception as e:
            print(e)

        await step_context.context.send_activity("Operazione cancellata.")
        return await step_context.cancel_all_dialogs()


    def _validate_picture(self, data) -> bool:
        if len(data) != 1:
            return False
        if 'image' not in data.content_type:
            return False

        return True
