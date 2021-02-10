import {
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
import { AddQuestionDialog, ADD_QUESTION_DIALOG } from './AddQuestionsDialog';

import { StudyDialog, STUDY_DIALOG } from './StudyDialog';

export const MAIN_DIALOG = 'MAIN_DIALOG';

const MAIN_WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

export class MainDialog extends ComponentDialog {
	userState: UserState;
	userProfileAccessor: StatePropertyAccessor<any>;
	constructor(userState: UserState) {
		super(MAIN_DIALOG);

		this.userState = userState;
		this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

		this.addDialog(new ChoicePrompt(CHOICE_PROMPT))
			.addDialog(new TextPrompt(TEXT_PROMPT))
			.addDialog(new AddQuestionDialog(userState))
			.addDialog(new StudyDialog(userState))
			.addDialog(
				new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
					this.initialStep.bind(this),
					this.addQuestionStep.bind(this),
					this.studyStep.bind(this),
					this.likeStep.bind(this),
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

	private async initialStep(step: WaterfallStepContext) {
		// @ts-ignore
		const deckName = step.options.deckName;
		// @ts-ignore
		step.values.deckName = deckName;
		const userName = await this.userProfileAccessor.get(step.context);

		const deck = await DeckModel.findOne({
			userId: step.context.activity.from.id,
			deckName,
		});

		const messageText = `Hi ${userName}! I remind you that you are in the ${deckName} deck. What do you want to do?`;

		const promptMessage = MessageFactory.text(
			messageText,
			messageText,
			InputHints.ExpectingInput,
		);

		return await step.prompt(CHOICE_PROMPT, {
			prompt: promptMessage,
			choices: ChoiceFactory.toChoices([
				'I want to add new questions',
				"I think it's time to study",
				...(deck?.deckName != deck?.realDeckName && !deck?.liked
					? ['I like this deck!']
					: []),
				'I want to select another deck',
			]),
			style: ListStyle.suggestedAction,
		});
	}

	private async addQuestionStep(step: WaterfallStepContext) {
		// @ts-ignore
		const deckName = step.values.deckName;
		const { index: scelta } = step.result;
		if (scelta !== 0) return await step.next(step.result);
		return await step.beginDialog(ADD_QUESTION_DIALOG, { deckName });
	}

	private async studyStep(step: WaterfallStepContext) {
		if (!step.result)
			return await step.replaceDialog(MAIN_DIALOG, {
				//@ts-ignore
				deckName: step.values.deckName,
			});
		const { index: scelta } = step.result;
		if (scelta !== 1) return await step.next(step.result);
		// @ts-ignore
		const deckName = step.values.deckName;
		return await step.beginDialog(STUDY_DIALOG, { deckName });
	}

	private async likeStep(step: WaterfallStepContext) {
		if (!step.result)
			return await step.replaceDialog(MAIN_DIALOG, {
				//@ts-ignore
				deckName: step.values.deckname,
			});
		if ('decision' in step.result) return await step.next(step.result);
		const { index: scelta } = step.result;
		if (scelta !== 2 || !step.result.value.split(' ').includes('like'))
			return await step.endDialog();
		// @ts-ignore
		const deckName = step.values.deckName;
		const deck = await DeckModel.findOne({ deckName });
		const realDeck = await DeckModel.findOne({
			realDeckName: deck!.realDeckName,
		});
		realDeck!.deckLikes!++;
		await realDeck!.save();
		deck!.liked = true;
		await deck!.save();
		return await step.replaceDialog(MAIN_DIALOG, {
			deckName,
		});
	}

	private async finalStep(step: WaterfallStepContext) {
		const { result } = step;
		const user = await this.userProfileAccessor.get(step.context);
		if (result.decision) {
			await step.context.sendActivity(
				`Looks like you're done for today, congratulations ${user}! See you tomorrow to study!`,
			);
		} else
			await step.context.sendActivity(
				`Are you tired? I'm sure you will recover tomorrow!`,
			);
		return await step.replaceDialog(MAIN_DIALOG, {
			//@ts-ignore
			deckName: step.values.deckName,
		});
	}
}
