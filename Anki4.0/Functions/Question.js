const mongoose = require('mongoose');
const QuestionModel = mongoose.model(
	'Question',
	new mongoose.Schema({
		userId: {
			required: true,
			type: String,
		},
		topic: {
			type: String,
			default: 'default',
		},
		question: {
			require: true,
			type: String,
		},
		answer: {
			require: true,
			type: String,
		},
		checks: {
			type: [Boolean],
			default: [false, false, false, false, false],
		},
		nextCheckDate: {
			type: mongoose.Schema.Types.Date,
			default: Date.now,
		},
	}),
);

module.exports.QuestionModel = QuestionModel;
