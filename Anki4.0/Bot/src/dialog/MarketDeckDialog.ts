import { StatePropertyAccessor, TurnContext, UserState } from 'botbuilder';
import {
	ChoiceFactory,
	ChoicePrompt,
	ComponentDialog,
	DialogSet,
	DialogState,
	DialogTurnStatus,
	ListStyle,
	WaterfallDialog,
	WaterfallStepContext,
} from 'botbuilder-dialogs';
import { DeckModel } from '../model/Deck';

export const MARKET_DECK_DIALOG = 'MARKET_DECK_DIALOG';

const MAIN_WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';
const CHOICE_PROMPT2 = 'CHOICE_PROMPT2';

export class MarketDeckDialog extends ComponentDialog {
	userState: UserState;
	userProfileAccessor: StatePropertyAccessor<any>;
	questions: string[];
	index: number;
	constructor(userState: UserState) {
		super(MARKET_DECK_DIALOG);

		this.userState = userState;
		this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

		this.addDialog(new ChoicePrompt(CHOICE_PROMPT2)).addDialog(
			new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
				this.firstStep.bind(this),
				this.deckNameStep.bind(this),
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

	private async firstStep(step: WaterfallStepContext) {
		const decks = await DeckModel.find({
			userId: { $ne: step.context.activity.from.id },
			market: { $eq: true },
		});
		if (decks.length == 0) {
			await step.context.sendActivity('There are no decks to import');

			return await step.endDialog();
		}
		return await step.prompt(CHOICE_PROMPT2, {
			prompt: 'Select the deck you want to import',
			choices: ChoiceFactory.toChoices([
				'Return to menu',
				...decks.map(
					(deck) =>
						`${new Array(Math.floor((deck.deckLikes! * 100) / deck.deckUsers! / 33.3))
							.fill('⭐️')
							.join('')} - ${deck.deckName} by ${deck.userName} ${
							deck.deckPrice != 0 ? `- $${deck.deckPrice}` : ''
						}`,
				),
			]),
			style: ListStyle.suggestedAction,
		});
	}

	private async deckNameStep(step: WaterfallStepContext) {
		if (step.result.index === 0) return await step.endDialog();
		// @ts-ignore
		step.values.deckName = step.result.value;
		const deck = await DeckModel.findOne({ deckname: step.result });
		if (deck) {
			await step.context.sendActivity(
				'Attention, the deck name must be unique, try again with a new name!',
			);
			return await step.replaceDialog(MARKET_DECK_DIALOG);
		}
		return await step.prompt(TEXT_PROMPT, {
			prompt: 'What is the name of the new deck?',
		});
	}

	private async finalStep(step: WaterfallStepContext) {
		// @ts-ignore
		let { deckName } = step.values;
		const { result: newDeckName } = step;
		deckName = deckName.substring(deckName.indexOf('-') + 2).split(' by ')[0];
		const deck = await DeckModel.findOne({ deckName });
		await step.context.sendActivity(
			`Visit the following link and make the payment: ${
				process.env.SERVER_URL
			}/checkout?userId=${
				step.context.activity.from.id
			}&deckId=${deck?.id!}&newDeckName=${newDeckName}`,
		);

		await step.context.sendActivity(
			'The deck will be available in the main menu once payment is confirmed!',
		);

		return await step.endDialog();
	}
}
