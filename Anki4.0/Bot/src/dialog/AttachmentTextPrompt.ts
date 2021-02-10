import { Attachment, InputHints, TurnContext } from 'botbuilder';
import {
	Prompt,
	PromptOptions,
	PromptRecognizerResult,
	PromptValidator,
} from 'botbuilder-dialogs';

export class AttachmentTextPrompt extends Prompt<Attachment[] | string> {
	/**
	 * Creates a new `AttachmentPrompt` instance.
	 * @param dialogId Unique ID of the dialog within its parent `DialogSet` or `ComponentDialog`.
	 * @param validator (Optional) validator that will be called each time the user responds to the prompt.
	 */
	constructor(
		dialogId: string,
		validator?: PromptValidator<Attachment[] | string>,
	) {
		super(dialogId, validator);
	}

	/**
	 * Prompts the user for input.
	 * @param context Context for the current turn of conversation with the user.
	 * @param state Contains state for the current instance of the prompt on the dialog stack.
	 * @param options A prompt options object constructed from the options initially provided
	 * in the call to Prompt.
	 * @param isRetry `true` if this is the first time this prompt dialog instance
	 * on the stack is prompting the user for input; otherwise, false.
	 * @returns A Promise representing the asynchronous operation.
	 */
	protected async onPrompt(
		context: TurnContext,
		state: any,
		options: PromptOptions,
		isRetry: boolean,
	): Promise<void> {
		if (isRetry && options.retryPrompt) {
			await context.sendActivity(
				options.retryPrompt,
				undefined,
				InputHints.ExpectingInput,
			);
		} else if (options.prompt) {
			await context.sendActivity(
				options.prompt,
				undefined,
				InputHints.ExpectingInput,
			);
		}
	}

	/**
	 * Attempts to recognize the user's input.
	 * @param context Context for the current turn of conversation with the user.
	 * @param state Contains state for the current instance of the prompt on the dialog stack.
	 * @param options A prompt options object constructed from the options initially provided
	 * in the call to Prompt.
	 * @returns A Promise representing the asynchronous operation.
	 */
	protected async onRecognize(
		context: TurnContext,
		state: any,
		options: PromptOptions,
	): Promise<PromptRecognizerResult<Attachment[] | string>> {
		const atts: Attachment[] | undefined = context.activity.attachments;
		const msg: string | undefined = context.activity.text;

		if (atts) {
			if (Array.isArray(atts) && atts.length > 0)
				return { succeeded: true, value: atts };
		} else if (msg) {
			if (typeof msg === 'string' && msg.length > 0)
				return { succeeded: true, value: msg };
		}

		return { succeeded: false };
	}
}
