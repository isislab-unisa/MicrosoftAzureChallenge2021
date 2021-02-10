const https = require('https');

module.exports = async function (context, req) {
    const { platform, channel, userId } = req.params;

    if (!platform || !channel || !userId) {
        context.res = {
            status: 404
        }

        return;
    }

    let response;

    try {
        switch (platform) {
            case "telegram":
                response = await banOnTelegram(channel, userId);
                break;
            case "discord":
                response = await banOnDiscord(channel, userId);
                break;
            case "twitch":
                response = await banOnTwitch(channel, userId);
                break;
        }
    }
    catch (error) {
        context.res = { status: 500 }
    }

    context.res = { body: response }
}

/**
 * Perform a request to ban on Telegram
 * @param {string} channel 
 * @param {string} userId 
 */
const banOnTelegram = async (channel, userId) => {
    const TELEGRAM_HOST = `api.telegram.org`;
    const METHOD_NAME = `restrictChatMember`
    const TELEGRAM_ENDPOINT = `/bot${process.env.TELEGRAM_TOKEN}/${METHOD_NAME}`
    const chatId = channel.split("|")[0];

    const restrictedPermission = {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false
    };

    const requestOptions = {
        method: "GET",
        host: TELEGRAM_HOST,
        path: `${TELEGRAM_ENDPOINT}?chat_id=${chatId}&user_id=${userId}&permissions=${JSON.stringify(restrictedPermission)}`,
    };

    return new Promise((resolve, reject) => {
        const request = https.get(requestOptions, response => response.on('data', data => resolve(data)));

        request.on('error', err => reject(err));

        request.end();
    });
}

/**
 * Perform a request to ban on Discord
 * @param {string} channel 
 * @param {string} userId 
 */
const banOnDiscord = (channel, userId) => {
    // TODO
}

/**
 * Perform a request to ban on Twitch
 * @param {string} channel 
 * @param {string} userId 
 */
const banOnTwitch = (channel, userId) => {
    // TODO
}