# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

from botbuilder.dialogs import (
    ComponentDialog,
    DialogContext,
    DialogTurnResult,
    DialogTurnStatus,
)
from botbuilder.schema import ActivityTypes, InputHints
from botbuilder.core import MessageFactory


class CancelAndHelpDialog(ComponentDialog):
    def __init__(self, dialog_id: str):
        super(CancelAndHelpDialog, self).__init__(dialog_id)

    async def on_continue_dialog(self, inner_dc: DialogContext) -> DialogTurnResult:
        result = await self.interrupt(inner_dc)
        if result is not None:
            return result

        return await super(CancelAndHelpDialog, self).on_continue_dialog(inner_dc)

    async def interrupt(self, inner_dc: DialogContext) -> DialogTurnResult:
        if inner_dc.context.activity.type == ActivityTypes.message:
            text = inner_dc.context.activity.text.lower()

            help_message_text = "Sono un bot dotato di intelligenza artificiale che ti permette di:\n\n- Ricercare libri e mostrarti i prezzi migliori sul mercato.\n- Creare una wishlist dove poter inserire tutti i libri che ti interessano.\n- Mantenere sott'occhio i libri della tua wishlist e avvisarti se cambiano di prezzo, o ritornano disponibili.\n- Posso offrirti suggerimenti su nuovi libri da leggere in base alle tue preferenze.\n- Posso guidarti all'acquisto di nuovi libri, confrontando le varie recensioni per un particolare libro che ti interessa.\n\nPuoi utilizzarmi come preferisci, puoi impartirmi comandi, oppure utilizzare i bottoni del menu. "
            help_message = MessageFactory.text(
                help_message_text, help_message_text, InputHints.expecting_input
            )

            if text.lower() in ("help", "?"):
                await inner_dc.context.send_activity(help_message)
                return DialogTurnResult(DialogTurnStatus.Waiting)

            cancel_message_text = "Cancelling"
            cancel_message = MessageFactory.text(
                cancel_message_text, cancel_message_text, InputHints.ignoring_input
            )

            if text.lower() in ("cancel", "quit"):
                await inner_dc.context.send_activity(cancel_message)
                return await inner_dc.cancel_all_dialogs()

        return None
