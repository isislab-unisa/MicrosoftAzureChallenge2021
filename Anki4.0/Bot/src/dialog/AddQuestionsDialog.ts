import path from 'path';
import fs, { PathLike } from 'fs';
import axios from 'axios';

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
import { AttachmentTextPrompt } from './AttachmentTextPrompt';

export const ADD_QUESTION_DIALOG = 'ADD_QUESTION_DIALOG';

const MAIN_WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const ATT_PROMPT = 'TEXT_PROMPT';
const CHOICE_PROMPT = 'REPEAT_OR_NOT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

export class AddQuestionDialog extends ComponentDialog {
	userState: UserState;
	userProfileAccessor: StatePropertyAccessor<any>;
	questions: string[];
	index: number;
	constructor(userState: UserState) {
		super(ADD_QUESTION_DIALOG);

		this.userState = userState;
		this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

		this.addDialog(new ChoicePrompt(CHOICE_PROMPT))
			.addDialog(new AttachmentTextPrompt(ATT_PROMPT))
			.addDialog(
				new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
					this.firstStep.bind(this),
					this.secondStep.bind(this),
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
		// @ts-ignore
		const deckName = step.options.deckName;
		// @ts-ignore
		step.values.deckName = deckName;
		return await step.prompt(ATT_PROMPT, {
			prompt:
				'Send us the text from which to extract the questions as a message or txt attachment',
		});
	}

	private async secondStep(step: WaterfallStepContext) {
		// @ts-ignore
		const deckName = step.values.deckName;
		let { result: text } = step;
		if (Array.isArray(text)) {
			if (text[0].contentType === 'text/plain') {
				const file = await this.downloadAttachmentAndWrite(text[0]);
				text = fs.readFileSync(file?.localPath as string, 'utf8').toString();
				fs.unlink(file?.localPath as PathLike, () => {});
			}
		}

		axios.post(process.env.QNA_FUNCTION_ENDPOINT!, {
			text,
			userId: step.context.activity.from.id,
			deckName,
		});
		await step.context.sendActivity(
			'Questions will be correctly generated between which second, good luck!',
		);

		return await step.prompt(CHOICE_PROMPT, {
			prompt: 'Would you like to enter other questions?',
			choices: ChoiceFactory.toChoices(['Yes', 'No, thanks']),
			style: ListStyle.suggestedAction,
		});
	}

	private async finalStep(step: WaterfallStepContext) {
		// @ts-ignore
		const deckName = step.values.deckName;
		const { index: scelta } = step.result;
		if (scelta === 1) {
			await step.context.sendActivity("Let's go back to the main menu.");
			return await step.endDialog();
		}
		return await step.replaceDialog(ADD_QUESTION_DIALOG, { deckName });
	}

	private async downloadAttachmentAndWrite(attachment: any) {
		const url = attachment.contentUrl;

		// Local file path for the bot to save the attachment.
		const localFileName = path.join(__dirname, attachment.name);

		try {
			// arraybuffer is necessary for images
			const response = await axios.get(url, { responseType: 'arraybuffer' });

			fs.writeFileSync(localFileName, response.data);
		} catch (error) {
			console.error(error);
			return undefined;
		}
		// If no error was thrown while writing to disk, return the attachment's name
		// and localFilePath for the response back to the user.
		return {
			fileName: attachment.name,
			localPath: localFileName,
		};
	}
}
