import { prop, getModelForClass } from '@typegoose/typegoose';

export class Deck {
	@prop({ required: true })
	public userId!: string;

	@prop({ required: true })
	public userName!: string;

	@prop({ required: true })
	public realDeckName!: string;

	@prop({ required: true })
	public deckName!: string;

	@prop({ default: 1 })
	public deckUsers?: number;

	@prop({ default: 0 })
	public deckLikes?: number;

	@prop({ default: 0 })
	public deckPrice?: number;

	@prop({ required: true })
	public market!: boolean;
	@prop()
	public liked?: boolean;
}

export const DeckModel = getModelForClass(Deck);
