from botbuilder.core.message_factory import MessageFactory
from config import DefaultConfig
from typing import Dict

from botbuilder.core import StatePropertyAccessor
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
    ListStyle
)

from model import UserProfile

from helpers.dao import UserDAO, PeopleDAO

CONFIG = DefaultConfig()

user_dao = UserDAO(CONFIG)
people_dao = PeopleDAO(CONFIG)


class DeletePersonDialog(ComponentDialog):
    def __init__(self, user_profile_accessor: StatePropertyAccessor, logged_users: Dict[str, str]):
        super().__init__(DeletePersonDialog.__name__)

        self.add_dialog(AttachmentPrompt(AttachmentPrompt.__name__))
        self.add_dialog(ChoicePrompt(ChoicePrompt.__name__))
        self.add_dialog(TextPrompt(TextPrompt.__name__))
        self.add_dialog(WaterfallDialog(
                'DeletePersonMainWF',
                [
                    self._choose_person,
                    self._confirm_choice,
                    self._delete_person
                ]
            )
        )
        
        self.logged_users = logged_users
        self.user_profile_accessor = user_profile_accessor

        self.initial_dialog_id = 'DeletePersonMainWF'


    async def _choose_person(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        user_profile: UserProfile = await self.user_profile_accessor.get(step_context.context, UserProfile)
        
        user = user_dao.get_user_by_id(user_profile.id)
        if not user:
            await step_context.context.send_activity("Devi aggiungere almeno una persona nel Database per inizializzare il tuo account.")
            return await step_context.end_dialog()
        step_context.values['person_group_id'] = user.person_group_id

        people = people_dao.retrive_people(user.person_group_id)
        if not people:
            await step_context.context.send_activity("Non è presente alcuna persona nel Database.")
            return await step_context.end_dialog()
        
        people_list = [Choice(f'{person.id}) {person.name}  {person.surname}') for person in people]

        return await step_context.prompt(
            ChoicePrompt.__name__,
            PromptOptions(
                prompt=MessageFactory.text('Seleziona il profilo della persona da eliminare. '),
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
                        f'Desideri eliminare il profilo di {name} {surname} dal database? L\'operazione non è reversibile.'
                    ),
                    retry_prompt=MessageFactory.text("Per favore seleziona un'opzione dalla lista."),
                    choices=[Choice('Si'), Choice('No')]
                )
            )

        await step_context.context.send_activity("Operazione cancellata.")
        return await step_context.cancel_all_dialogs()
    
    async def _delete_person(self, step_context: WaterfallStepContext) -> DialogTurnResult:
        try:
            if step_context.result and step_context.result.value == 'Si':
                id = step_context.values['id']
                person_group_id = step_context.values['person_group_id']

                people_dao.delete_by_id(id, person_group_id)

                await step_context.context.send_activity("Profilo eliminato con successo.")
                return await step_context.end_dialog()
            
            elif step_context.result and step_context.result.value == 'No':
                await step_context.context.send_activity("Operazione annullata.")
                return await step_context.end_dialog()
        
        except Exception as e:
            print(e)
        
        await step_context.context.send_activity("Operazione cancellata.")
        return await step_context.cancel_all_dialogs()
