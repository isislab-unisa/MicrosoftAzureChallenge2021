import {
	Activity,
	ActivityHandler,
	ConversationState,
	StatePropertyAccessor,
	TurnContext,
	UserState,
} from 'botbuilder';
import { FirstDialog } from '../dialog/FirstDialog';

export class Bot extends ActivityHandler {
	private conversationState: ConversationState;
	private userState: UserState;
	private dialog: FirstDialog;
	private dialogState: StatePropertyAccessor<any>;
	private conversationReferences;
	constructor(
		conversationState: ConversationState,
		userState: UserState,
		dialog: FirstDialog,
		conversationReferences: any,
	) {
		super();
		this.conversationState = conversationState;
		this.userState = userState;
		this.dialog = dialog;
		this.dialogState = this.conversationState.createProperty('DialogState');
		this.conversationReferences = conversationReferences;

		this.onConversationUpdate(async (context, next) => {
			this.addConversationReference(context.activity);

			await next();
		});

		this.onMembersAdded(async (context, next) => {
			const membersAdded = context.activity.membersAdded;
			for (let cnt = 0; cnt < membersAdded!.length; ++cnt) {
				if (membersAdded![cnt].id !== context.activity.recipient.id) {
					await context.sendActivity(
						`Welcome to Anki 4.0! This is your id: ${membersAdded![cnt].id}`,
					);
					await this.dialog.run(context, this.dialogState);
				}
			}

			await next();
		});

		this.onMessage(async (context, next) => {
			this.addConversationReference(context.activity);
			await this.dialog.run(context, this.dialogState);

			await next();
		});
	}

	addConversationReference(activity: Activity) {
		const conversationReference = TurnContext.getConversationReference(activity);
		this.conversationReferences[
			conversationReference.conversation!.id
		] = conversationReference;
	}

	async run(context: TurnContext) {
		await super.run(context);
		await this.conversationState.saveChanges(context, false);
		await this.userState.saveChanges(context, false);
	}
}
