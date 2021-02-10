import { StatePropertyAccessor, TurnContext, UserState } from 'botbuilder';
import {
	ComponentDialog,
	ConfirmPrompt,
	DialogSet,
	DialogState,
	DialogTurnStatus,
	NumberPrompt,
	TextPrompt,
	WaterfallDialog,
	WaterfallStepContext,
} from 'botbuilder-dialogs';
import { DeckModel } from '../model/Deck';

export const NEW_DECK_DIALOG = 'NEW_DECK_DIALOG';

const MAIN_WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

interface StepValues {
	deckName?: String;
}

export class NewDeckDialog extends ComponentDialog {
	userState: UserState;
	userProfileAccessor: StatePropertyAccessor<any>;
	questions: string[];
	index: number;
	constructor(userState: UserState) {
		super(NEW_DECK_DIALOG);

		this.userState = userState;
		this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

		this.addDialog(new TextPrompt(TEXT_PROMPT))
			.addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
			.addDialog(new NumberPrompt(NUMBER_PROMPT))
			.addDialog(
				new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
					this.deckNameStep.bind(this),
					this.deckMarketStep.bind(this),
					this.deckPriceStep.bind(this),
					this.finalStep.bind(this),
				]),
			);

		this.initialDialogId = MAIN_WATERFALL_DIALOG;
	}

	public async run(
		context: TurnContext,
		accessor: StatePropertyAccessor<DialogState>,
	) {
		const dialogSet = new DialogSet(accessor);
		dialogSet.add(this);

		const dialogContext = await dialogSet.createContext(context);
		const results = await dialogContext.continueDialog();
		if (results.status === DialogTurnStatus.empty) {
			await dialogContext.beginDialog(this.id);
		}
	}

	private async deckNameStep(step: WaterfallStepContext) {
		return await step.prompt(TEXT_PROMPT, {
			prompt: 'What is the name of the new deck?',
		});
	}

	private async deckMarketStep(step: WaterfallStepContext) {
		// @ts-ignore
		step.values.deckName = step.result;
		const deck = await DeckModel.findOne({ deckname: step.result });
		if (deck) {
			await step.context.sendActivity(
				'Attention, the deck name must be unique, try again with a new name!',
			);
			return await step.replaceDialog(NEW_DECK_DIALOG);
		}
		return await step.prompt(CONFIRM_PROMPT, {
			prompt: 'Do you want to make it available on the market?',
		});
	}

	private async deckPriceStep(step: WaterfallStepContext) {
		//@ts-ignore
		step.values.market = step.result;
		if (!step.result) return await step.next(0);
		return await step.prompt(NUMBER_PROMPT, {
			prompt: 'At what price do you want to sell it?',
		});
	}

	private async finalStep(step: WaterfallStepContext) {
		if (step.result < 0) {
			await step.context.sendActivity(
				'Attention, the price must be >= 0, repeat operations',
			);
			return await step.replaceDialog(NEW_DECK_DIALOG);
		}
		//@ts-ignore
		step.values.deckPrice = step.result;
		let { values: deckInfo } = step;
		await DeckModel.create({
			userId: step.context.activity.from.id,
			userName: step.context.activity.from.name,
			//@ts-ignore
			deckName: deckInfo.deckName,
			//@ts-ignore
			realDeckName: deckInfo.deckName,
			//@ts-ignore
			market: deckInfo.market,
			//@ts-ignore
			deckPrice: deckInfo.deckPrice,
		});
		await step.context.sendActivity(
			'The new deck has been created, it will now be selectable from the main menu!',
		);

		return await step.endDialog();
	}
}
