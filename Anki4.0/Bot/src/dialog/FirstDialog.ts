import {
	ActionTypes,
	CardFactory,
	InputHints,
	MessageFactory,
	StatePropertyAccessor,
	TurnContext,
	UserState,
} from 'botbuilder';
import {
	ChoiceFactory,
	ChoicePrompt,
	ComponentDialog,
	DialogSet,
	DialogState,
	DialogTurnStatus,
	ListStyle,
	TextPrompt,
	WaterfallDialog,
	WaterfallStepContext,
} from 'botbuilder-dialogs';
import { DeckModel } from '../model/Deck';
import { AddQuestionDialog } from './AddQuestionsDialog';
import { MainDialog, MAIN_DIALOG } from './MainDialog';
import { MarketDeckDialog, MARKET_DECK_DIALOG } from './MarketDeckDialog';
import { NewDeckDialog, NEW_DECK_DIALOG } from './NewDeckDialog';

import { StudyDialog } from './StudyDialog';

export const FIRST_DIALOG = 'FIRST_DIALOG';

const MAIN_WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

export class FirstDialog extends ComponentDialog {
	userState: UserState;
	userProfileAccessor: StatePropertyAccessor<any>;
	constructor(userState: UserState) {
		super(FIRST_DIALOG);

		this.userState = userState;
		this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

		this.addDialog(new ChoicePrompt(CHOICE_PROMPT))
			.addDialog(new TextPrompt(TEXT_PROMPT))
			.addDialog(new AddQuestionDialog(userState))
			.addDialog(new StudyDialog(userState))
			.addDialog(new NewDeckDialog(userState))
			.addDialog(new MainDialog(userState))
			.addDialog(new MarketDeckDialog(userState))
			.addDialog(
				new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
					this.welcomeStep.bind(this),
					this.initialStep.bind(this),
					this.visitMarketStep.bind(this),
					this.newDeckStep.bind(this),
					this.openDeckStep.bind(this),
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

	private async welcomeStep(step: WaterfallStepContext) {
		const user = await this.userProfileAccessor.get(step.context);
		if (user) return await step.next();
		const messageText =
			"It seems to me this is the first time we meet, what's your name?";

		const promptMessage = MessageFactory.text(
			messageText,
			messageText,
			InputHints.ExpectingInput,
		);

		return await step.prompt(TEXT_PROMPT, {
			prompt: promptMessage,
		});
	}

	private async initialStep(step: WaterfallStepContext) {
		const user = await this.userProfileAccessor.get(step.context);
		if (!user) {
			await this.userProfileAccessor.set(step.context, step.result);
		}
		const userName = user || step.result;

		const messageText = `Hi ${userName}! Which deck do you want to use?`;

		const promptMessage = MessageFactory.text(
			messageText,
			messageText,
			InputHints.ExpectingInput,
		);

		const decks = await DeckModel.find({
			userId: step.context.activity.from.id,
		});

		return await step.prompt(CHOICE_PROMPT, {
			prompt: promptMessage,
			choices: ChoiceFactory.toChoices([
				'Refresh Deck List',
				'Visit the market',
				'Create new deck',
				...decks.map((deck) => deck.deckName),
			]),
			style: ListStyle.suggestedAction,
		});
	}

	private async visitMarketStep(step: WaterfallStepContext) {
		const { index: scelta } = step.result;
		if (scelta === 0) return await step.replaceDialog(FIRST_DIALOG);
		if (scelta !== 1) return await step.next(step.result);
		return await step.beginDialog(MARKET_DECK_DIALOG);
	}

	private async newDeckStep(step: WaterfallStepContext) {
		if (!step.result) return await step.replaceDialog(FIRST_DIALOG);
		const { index: scelta } = step.result;
		if (scelta !== 2) return await step.next(step.result);
		return await step.beginDialog(NEW_DECK_DIALOG);
	}

	private async openDeckStep(step: WaterfallStepContext) {
		if (!step.result) return await step.replaceDialog(FIRST_DIALOG);
		const { value } = step.result;

		return await step.beginDialog(MAIN_DIALOG, { deckName: value });
	}
	private async finalStep(step: WaterfallStepContext) {
		return await step.replaceDialog(FIRST_DIALOG);
	}
}
