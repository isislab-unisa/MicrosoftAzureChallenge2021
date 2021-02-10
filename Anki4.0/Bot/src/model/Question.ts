import { prop, getModelForClass } from '@typegoose/typegoose';

export class Question {
	@prop({ required: true })
	public userId!: string;

	@prop({ required: true })
	public deckName!: string;

	@prop({ required: true })
	public question!: string;

	@prop({ required: true })
	public answer!: string;

	@prop({ default: [false, false, false, false, false] })
	public checks?: boolean[];

	@prop({ default: Date.now() })
	public nextCheckDate?: Date;
}

export const QuestionModel = getModelForClass(Question);
