// @ts-nocheck
import path from 'path';
import fs, { PathLike } from 'fs';
import axios from 'axios';
import * as Bluebird from 'bluebird';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuid } from 'uuid';
import {
	ActionTypes,
	CardFactory,
	StatePropertyAccessor,
	TurnContext,
	UserState,
} from 'botbuilder';
import {
	ComponentDialog,
	DialogSet,
	DialogState,
	DialogTurnStatus,
	WaterfallDialog,
	WaterfallStepContext,
} from 'botbuilder-dialogs';
import { AttachmentTextPrompt } from './AttachmentTextPrompt';
import { Question, QuestionModel } from '../model/Question';

ffmpeg.setFfmpegPath(path.join(__dirname.replace('dialog', 'lib'), '/ffmpeg'));

export const STUDY_DIALOG = 'STUDY_DIALOG';

const MAIN_WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const ATT_PROMPT = 'ATT_PROMPT';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

export class StudyDialog extends ComponentDialog {
	userState: UserState;
	userProfileAccessor: StatePropertyAccessor<any>;
	questions: string[];
	index: number;
	constructor(userState: UserState) {
		super(STUDY_DIALOG);

		this.userState = userState;
		this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

		this.addDialog(new AttachmentTextPrompt(ATT_PROMPT)).addDialog(
			new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
				this.questionStep.bind(this),
				this.answerStep.bind(this),
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

	private async questionStep(step: WaterfallStepContext) {
		// @ts-ignore
		const deckName = step.options.deckName;
		const questions =
			step.options.questions ||
			(await QuestionModel.find({
				userId: step.context.activity.from.id,
				nextCheckDate: { $lte: new Date() },
				deckName,
			}));
		if (questions.length === 0) {
			await step.context.sendActivity('There are no questions for today!');
			return await step.endDialog({ decision: true });
		}
		const index = step.options.index || 0;
		step.values.questions = questions;
		step.values.index = index;
		const buttons = [
			{
				type: ActionTypes.ImBack,
				title: 'Good',
				value: 'good',
			},
			{
				type: ActionTypes.ImBack,
				title: 'Bad',
				value: 'bad',
			},
			{
				type: ActionTypes.ImBack,
				title: 'Okay for now, see you next time!',
				value: 'stop',
			},
		];

		const card = CardFactory.heroCard('', undefined, buttons, {
			text: questions[index].question,
		});

		const reply = { attachments: [card] };

		await step.context.sendActivity(reply);
		return await step.prompt(ATT_PROMPT, {
			prompt: '',
		});
	}

	private async answerStep(step: WaterfallStepContext) {
		const questions: Question[] = step.values.questions;
		let { index } = step.values;
		const { result: answer } = step;
		let message;
		if (Array.isArray(answer)) {
			if (answer[0].contentType === 'audio/ogg') {
				const msg: string = await this.recognizeAudio(answer[0]);
				message = await this.checkAnswer(msg, questions[index]);
			}
		} else {
			switch (answer) {
				case 'stop':
					return await step.endDialog({ decision: false });
				case 'good':
					questions[index].checks.shift();
					questions[index].checks.push(true);
					message = 'Correct answer!';
					break;
				case 'bad':
					questions[index].checks.shift();
					questions[index].checks.push(false);
					const { localPath, localName: audioName } = await this.syntethizeAudio(
						questions[index].answer,
					);

					message = {
						text: 'Unfortunately your answer is wrong, listen to the correct answer.',
						channelData: [
							{
								method: 'sendVoice',
								parameters: {
									voice: `${process.env.SERVER_URL}/public/${audioName}`,
								},
							},
						],
					};
					setTimeout(() => {
						fs.unlink(localPath, () => {});
					}, 30000);

					break;
				default:
					message = await this.checkAnswer(answer, questions[index]);
			}
		}
		await step.context.sendActivity(message);
		await QuestionModel.updateOne(
			{ _id: questions[index]._id },
			{
				checks: questions[index].checks,
				nextCheckDate: this.newCheckDate(questions[index]),
			},
		);
		if (questions.length - 1 === index) {
			return await step.endDialog({ decision: true });
		}
		index++;
		return await step.replaceDialog(STUDY_DIALOG, {
			index,
			questions,
		});
	}

	private async checkAnswer(answer: string, question: Question) {
		let message = {};
		const rawCheckValue = await axios.post(
			process.env.CHECK_ML_ENDPOINT!,
			{
				user_answer: answer.toLowerCase(),
				bot_answer: question.answer.toLowerCase(),
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.CHECK_ML_TOKEN}`,
				},
			},
		);
		const checkValue = rawCheckValue.data.result as number;
		if (checkValue >= 0.8) {
			question.checks.shift();
			question.checks.push(true);
			message = 'Correct answer!';
		} else {
			question.checks.shift();
			question.checks.push(false);
			const { localPath, localName: audioName } = await this.syntethizeAudio(
				question.answer,
			);
			message = {
				text: 'Unfortunately your answer is wrong, listen to the correct answer.',
				channelData: [
					{
						method: 'sendVoice',
						parameters: {
							voice: `${process.env.SERVER_URL}/public/${audioName}`,
						},
					},
				],
			};
		}
		return message;
	}

	private newCheckDate(question: Question) {
		if (!question.checks[4])
			return new Date(new Date(Date.now()).getTime() + 24 * 60 * 60 * 1000);
		const { checks } = question;
		checks.reverse();
		let count = 0;
		for (let check of checks) {
			if (check === false) break;
			else count++;
		}
		checks.reverse();
		const ms =
			new Date(Date.now()).getTime() + 2 ** (count - 1) * 24 * 60 * 60 * 1000;
		return new Date(ms);
	}

	private async syntethizeAudio(answer: string) {
		const speechConfig = sdk.SpeechConfig.fromSubscription(
			process.env.SPEECH_API!,
			process.env.SPEECH_LOCATION!,
		);

		const audioConfig = sdk.AudioConfig.fromAudioFileOutput(
			path.join(__dirname.replace('dialog', 'bot'), '/audio/', 'message.wav'),
		);

		const dir = path.join(__dirname.replace('dialog', 'bot'), '/audio/');

		const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

		const syn = (answer: string) => {
			return new Promise((resolve, reject) => {
				synthesizer.speakSsmlAsync(
					`<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-US-JennyNeural"><mstts:express-as style="customerservice"><prosody rate="-10%" pitch="0%">
									${answer}
								</prosody>
							</mstts:express-as>
						</voice>
					</speak>`,
					(result) => {
						if (result) {
							resolve(result);
						}
						synthesizer.close();
					},
					(err) => {
						if (err) {
							reject(err);
						}
						synthesizer.close();
					},
				);
			});
		};

		function promisifyCommand(command: any, id: string) {
			return Bluebird.Promise.promisify((cb) => {
				command
					.on('end', () => {
						cb(null);
					})
					.on('error', (err) => {
						cb(err);
					})
					.save(path.join(dir, id + '.ogg'));
			});
		}

		const id = uuid();

		await syn(answer);
		const command = ffmpeg(path.join(dir, 'message.wav'))
			.outputOptions('-acodec libopus')
			.format('ogg');
		await promisifyCommand(command, id)();
		fs.unlink(path.join(dir, 'message.wav'), () => {});

		return { localPath: path.join(dir, id + '.ogg'), localName: id + '.ogg' };
	}

	private async recognizeAudio(audio: any) {
		const audioFile = await this.downloadAttachmentAndWrite(audio);

		async function fromFileOgg(name: any) {
			const dir = path.join(__dirname.replace('dialog', 'bot'), '/audio/');
			const newName = name.split('.')[0] + '.wav';

			let command = ffmpeg(path.join(dir, name))
				.outputOptions('-ar 16000')
				.format('wav');

			function promisifyCommand(command: any) {
				return Bluebird.Promise.promisify((cb) => {
					command
						.on('end', () => {
							cb(null, 'Ciao');
						})
						.save(path.join(dir, newName));
				});
			}

			let result: any;
			await promisifyCommand(command)();
			result = await fromFile(dir, newName);
			result = await result();
			return result.text;
		}

		async function fromFile(dir: any, name: any) {
			let pushStream = sdk.AudioInputStream.createPushStream();

			fs
				.createReadStream(path.join(dir, name))
				.on('data', function (arrayBuffer) {
					// @ts-ignore
					pushStream.write(arrayBuffer.slice());
				})
				.on('end', function () {
					pushStream.close();
				});

			let audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
			const speechConfig = sdk.SpeechConfig.fromSubscription(
				process.env.SPEECH_API,
				process.env.SPEECH_LOCATION,
			);
			speechConfig.speechRecognitionLanguage = 'en-GB';
			let recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

			const recognize = () => {
				return new Promise((resolve, reject) => {
					recognizer.recognizeOnceAsync(
						(result) => {
							if (result) resolve(result);
						},
						(err) => {
							if (err) reject(err);
						},
					);
				});
			};

			return recognize;
		}

		const msg = await fromFileOgg(audioFile?.fileName);

		fs.unlink(audioFile?.localPath as PathLike, () => {});
		fs.unlink(audioFile?.localPath.replace('ogg', 'wav') as PathLike, () => {});

		return msg;
	}

	private async downloadAttachmentAndWrite(attachment: any) {
		const url = attachment.contentUrl;

		const localFileName = path.join(
			__dirname.replace('dialog', 'bot'),
			'/audio',
			'audio.ogg',
		);

		try {
			const response = await axios.get(url, { responseType: 'arraybuffer' });

			fs.writeFile(localFileName, response.data, (fsError) => {
				if (fsError) {
					throw fsError;
				}
			});
		} catch (error) {
			console.error(error);
			return undefined;
		}

		return {
			fileName: 'audio.ogg',
			localPath: localFileName,
		};
	}
}
