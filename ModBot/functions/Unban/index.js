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
                response = await unbanOnTelegram(channel, userId);
                break;
            case "discord":
                response = await unbanOnDiscord(channel, userId);
                break;
            case "twitch":
                response = await unbanOnTwitch(channel, userId);
                break;
        }
    }
    catch (error) {
        context.res = { status: 500 }
    }

    context.res = { body: response }
}

/**
 * Perform a request to unban a user on Telegram
 * @param {string} channel Unique identifier for the chat which user belongs.
 * @param {string} userId Unique identifier for user to unban
 */
const unbanOnTelegram = (channel, userId) => {
    const TELEGRAM_HOST = `api.telegram.org`;
    const METHOD_NAME = `restrictChatMember`
    const TELEGRAM_ENDPOINT = `/bot${process.env.TELEGRAM_TOKEN}/${METHOD_NAME}`
    const chatId = channel.split("|")[0];

    const promotedPermission = {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_change_info: false,
        can_invite_users: true,
        can_pin_messages: true
    }

    const requestOptions = {
        method: "GET",
        host: TELEGRAM_HOST,
        path: `${TELEGRAM_ENDPOINT}?chat_id=${chatId}&user_id=${userId}&permissions=${JSON.stringify(promotedPermission)}`,
    }

    return new Promise((resolve, reject) => {
        const request = https.get(requestOptions, response => response.on('data', data => resolve(data)));

        request.on('error', err => reject(err));

        request.end();
    });
}

/**
 * Perform a request to unban a user on Discord
 * @param {string} channel 
 * @param {string} userId 
 */
const unbanOnDiscord = (channel, userId) => {
    // TODO
}

/**
 * Perform a request to unban a user on Twitch
 * @param {string} channel 
 * @param {string} userId 
 */
const unbanOnTwitch = (channel, userId) => {
    // TODO
}