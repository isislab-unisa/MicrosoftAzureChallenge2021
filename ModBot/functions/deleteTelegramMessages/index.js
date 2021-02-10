const https = require('https');

const TELEGRAM_HOST = `api.telegram.org`;
const METHOD_NAME = `deleteMessage`
const TELEGRAM_ENDPOINT = `/bot${process.env.TELEGRAM_TOKEN}/${METHOD_NAME}`

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const channel = (req.params.channel);
    const messageId = (req.params.messageId);

    if(!channel || !messageId) {
        context.res = {
            status: 404
        }
        return;
    }
    
    const chatId = channel.split("|")[0];
    try {    
        const response = await deleteMessage(chatId, messageId);
        context.res = { body: response }
    }
    catch(error) {
        context.res = { status: 500 }
    }  
}

const deleteMessage = (chatId, messageId) => {
    const requestOptions = {
        method: "GET",
        host: TELEGRAM_HOST,
        path: `${TELEGRAM_ENDPOINT}?chat_id=${chatId}&message_id=${messageId}`,
    }

    return new Promise((resolve, reject) => {
        const request = https.get(requestOptions, response => response.on('data', data => resolve(data)));

        request.on('error', err => reject(err));

        request.end();
    })

}