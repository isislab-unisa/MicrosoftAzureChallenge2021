import { config } from 'dotenv';
config();
import {
	BotFrameworkAdapter,
	ConversationReference,
	ConversationState,
	MemoryStorage,
	UserState,
} from 'botbuilder';
const cron = require('node-cron');
import * as restify from 'restify';
import { Bot } from './bot/Bot';
import { mongoose } from '@typegoose/typegoose';
import path from 'path';
import { FirstDialog } from './dialog/FirstDialog';
import { DeckModel } from './model/Deck';
import { Question, QuestionModel } from './model/Question';
import corsMiddleware from 'restify-cors-middleware';
import { error } from 'console';
const stripe = require('stripe')(process.env.STRIPE_PRIVATE);

//Connessione a CosmosDB
mongoose
	.connect(
		'mongodb://' +
			process.env.COSMOSDB_HOST +
			':' +
			process.env.COSMOSDB_PORT +
			'/' +
			process.env.COSMOSDB_DBNAME +
			'?ssl=true&replicaSet=globaldb',
		{
			auth: {
				user: process.env.COSMOSDB_USER!,
				password: process.env.COSMOSDB_PASSWORD!,
			},
			useNewUrlParser: true,
			useUnifiedTopology: true,
			// @ts-ignore
			retrywrites: false,
		},
	)
	.then(() => console.log('Connection to CosmosDB successful'))
	.catch((err) => console.error(err));

//Creazione Server
const server = restify.createServer();

const cors = corsMiddleware({
	origins: ['*'],
	allowHeaders: ['Authorization'],
	exposeHeaders: ['Authorization'],
});

server.pre(cors.preflight);
server.use(cors.actual);

//Plugin per il parsing automatico del body e dei parametri query, permettono di utilizzare req.body e req.query
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.queryParser());

//Avvio del server
server.listen(process.env.port || process.env.PORT || 3978, () => {
	console.log(`${server.name} listening on ${server.url}`);
});

//Permette l'accesso alla cartella audio a Telegram per poterli inviare in chat
server.get(
	'/public/*',
	restify.plugins.serveStaticFiles(path.join(__dirname, '/bot', '/audio/')),
);

const adapter = new BotFrameworkAdapter({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

// Catch-all for errors
adapter.onTurnError = async (context, error) => {
	console.error(`\n [onTurnError] unhandled error: ${error}`);

	await context.sendTraceActivity(
		'OnTurnError Trace',
		`${error}`,
		'https://www.botframework.com/schemas/error',
		'TurnError',
	);

	await context.sendActivity('The bot encountered an error or bug.');
	await context.sendActivity(
		'To continue to run this bot, please fix the bot source code.',
	);

	await conversationState.delete(context);
};

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);
const dialog = new FirstDialog(userState);
const conversationReferences = {};
const bot = new Bot(
	conversationState,
	userState,
	dialog,
	conversationReferences,
);

server.post('/api/messages', (req, res) => {
	adapter.processActivity(req, res, async (context) => {
		await bot.run(context);
	});
});

//Invio di messaggio alle 9 di ogni giorno
cron.schedule('0 9 * * *', async function () {
	for (const conversationReference of Object.values(conversationReferences)) {
		await adapter.continueConversation(
			conversationReference as Partial<ConversationReference>,
			async (turnContext) => {
				const userProfileAccessor = userState.createProperty(
					'USER_PROFILE_PROPERTY',
				);
				const user = await userProfileAccessor.get(turnContext);
				await turnContext.sendActivity(`Hello ${user}, it's time to study!`);
			},
		);
	}
});

//Router per il checkout con router in caso di successo
server.get('/checkout', async (req, res) => {
	const { userId, deckId, newDeckName } = req.query;
	const deck = await DeckModel.findById(deckId);
	const session = await stripe.checkout.sessions.create({
		payment_method_types: ['card'],
		success_url: `${process.env.SERVER_URL}/success`,
		cancel_url: `${process.env.SERVER_URL}/error`,
		client_reference_id: userId,
		line_items: [
			{
				name: `${deck?.deckName} Deck`,
				description: 'test',
				amount: deck?.deckPrice! * 100,
				currency: 'usd',
				quantity: 1,
			},
		],
		metadata: {
			deckId,
			newDeckName,
		},
	});

	res.end(
		`<html>
				<head>
					<title>Anki 4.0 - Checkout</title>
					<script src="https://js.stripe.com/v3/"></script>
				</head>
				<script>
					window.addEventListener("load", () => {
						var stripe = Stripe("${process.env.STRIPE_PUBLIC}");
						return stripe.redirectToCheckout({ sessionId: "${session.id}"});
					});
				</script>
			</html>`,
	);
});

server.get('/success', async (req, res) => {
	res.end(
		`<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
  			<meta http-equiv="X-UA-Compatible" content="IE=edge">
  			<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Anki 4.0 - Successo</title>
				<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
			</head>
			<body class="h-screen w-screen flex items-center justify-center bg-gray-200">
    		<h1 class="text-2xl font-bold text-indigo-700">Complimenti per l'acquisto!</h1>
			</body>
		</html>`,
	);
});

//API chiamata dalla webhook Stripe per aggiornare il database ad acquisto confermato
server.post('/api/checkout_completed', async (req, res, next) => {
	const signature = req.headers['stripe-signature'];
	let event;
	try {
		event = stripe.webhooks.constructEvent(
			// @ts-ignore
			req.rawBody,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET,
		);
	} catch (err) {
		return res.send(400, `Webhook error: ${err.message}`);
	}

	if (event.type === 'checkout.session.completed') {
		const userId = event.data.object.client_reference_id;
		const { deckId, newDeckName } = event.data.object.metadata;
		const deck = await DeckModel.findById(deckId);
		const questions: Question[] = await QuestionModel.find({
			deckName: deck?.deckName,
		});
		await DeckModel.create({
			userId,
			userName: 'Imported',
			deckName: newDeckName,
			realDeckName: deck?.deckName!,
			market: false,
		});
		deck!.deckUsers!++;
		await deck!.save();
		questions.map(async (qna) => {
			const { question, answer } = qna;
			await QuestionModel.create({
				userId,
				question,
				answer,
				deckName: newDeckName,
			});
		});
	}

	res.json(200, { received: true });
});

//Creazione API per connessione con webapp
server.get('/api/deck', async (req, res, next) => {
	const { userId } = req.query;
	let decks = {};
	try {
		decks = await DeckModel.find({ userId });
	} catch (err) {
		console.log(error);
		return res.json(404, { status: 'error', decks });
	}
	return res.json(200, { status: 'success', decks });
});

server.get('/api/deck/:deckId', async (req, res, next) => {
	const { deckId } = req.params;
	const deck = await DeckModel.findById(deckId);
	let questions = {};
	try {
		questions = await QuestionModel.find({ deckName: deck?.deckName });
	} catch (err) {
		console.log(error);
		return res.json(404, { status: 'error', questions });
	}
	return res.json(200, { status: 'success', questions });
});
