module.exports = async function (context, req) {
	const mongoose = require('mongoose');
	const axios = require('axios');
	const env = require('dotenv').config();
	const { QuestionModel } = require('./Question');
	console.log(process.env.QNA_ML_ENDPOINT);
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
					user: process.env.COSMOSDB_USER,
					password: process.env.COSMOSDB_PASSWORD,
				},
				useNewUrlParser: true,
				useUnifiedTopology: true,
				retryWrites: false,
			},
		)
		.then(() => console.log('Connection to CosmosDB successful'))
		.catch((err) => console.error(err));

	const rawQuestions = await axios.post(
		process.env.QNA_ML_ENDPOINT,
		{ text: req.body.text },
		{
			headers: {
				Authorization: `Bearer ${process.env.QNA_ML_TOKEN}`,
			},
		},
	);
	const questions = rawQuestions.data.result;
	questions.map(async (qna) => {
		const { question, answer } = qna;
		await QuestionModel.create({
			userId: req.body.userId,
			question,
			answer,
		});
	});
};
