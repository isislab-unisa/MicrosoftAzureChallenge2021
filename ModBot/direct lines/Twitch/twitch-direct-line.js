"use strict";

global.XMLHttpRequest = require('xhr2');
global.WebSocket = require('ws');

const dotenv = require('dotenv');
const path = require('path');
const { Activity, DirectLine } = require('botframework-directlinejs');
const twitchBot = require('tmi.js');

// Getting env from .env file
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

// Init direct line
const directLine = new DirectLine({
    secret: process.env.TwitchDirectLineSecret
});

const client = twitchBot.Client({
    options: { debug: true, messagesLogLevel: "info" },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: process.env.TwitchBotName,
        password: process.env.TwitchBotToken
    },
    channels: ['kekkox_']
})

// Session storage object
const session = {};

client.on('message', (channel, tags, message, self) => {
    if (self) return;

    postActivity(channel, tags, message);
});

/**
 * Post an activity from Twitch to Direct Line
 * @param {string} channel The Twitch channel name
 * @param {twitchBot.ChatUserstate} tags
 * @param {string} message The message received
 */
const postActivity = async (channel, tags, message) => {
    const activity = {
        from: { id: tags['user-id'], name: tags.username },
        type: 'message',
        channelData: { channelId: 'twitch', conversationId: `${channel.substr(1)}|${tags.username}` },
        text: message
    };

    directLine
        .postActivity(activity)
        .subscribe(
            id => {
                if (id === "retry") {
                    console.error("[ERROR]: Cannot send activity", id, activity.from)
                    return;
                }
                /* 
                    There are no guarantee about who is called first about the this callback or the one after receiving the activity.
                    So, a session check mecchanism is required. 
                */
                if (session[id])
                    // The activity is in the session
                    onActivityReceived(id, channel, tags);
                else
                    session[id] = { channel, tags };

            },
            error => console.error("[ERROR]: Error posting activity:", error)
        );
};

/**
 * Twitch logic when an activity from bot is received
 * @param {string} activityId Bot's activity identification
 * @param {string} channel The channel in which to reply
 * @param {twitchBot.ChatUserstate} tags The chat user state infos
 */
const onActivityReceived = async (activityId, channel, tags) => {
    const { activity, toDelete, toBan } = session[activityId];

    if (toBan)
        banUser(channel, tags.username);

    if (toDelete)
        deleteMessage(channel, tags.id);

    delete session[activityId];

    let text;
    if (activity.text.startsWith(tags.username))
        text = `@${activity.text}`;
    else
        text = `@${tags.username} ${activity.text}`;

    client.say(channel, text);
}

// Handle all messages sent by the bot
directLine.activity$
    .filter(activity => activity.type === 'message' && activity.from.id === process.env.AzureBotName)
    .subscribe(
        activity => {
            /* 
                There are no guarantee about who is called first about the this callback or the one after posting activity.
                So, a session check mecchanism is required. 
            */
            if (session[activity.replyToId]) {
                session[activity.replyToId].activity = activity;
                onActivityReceived(activity.replyToId, session[activity.replyToId].channel, session[activity.replyToId].tags);
            }
            else {
                session[activity.replyToId] = { activity }
            }
        });

// Handle custom delete activity
directLine.activity$
    .filter(activity => activity.type === 'custom.delete')
    .subscribe(activity => session[activity.replyToId].toDelete = true);

// Handle custom ban activity
directLine.activity$
    .filter(activity => activity.type === 'custom.ban')
    .subscribe(activity => session[activity.replyToId].toBan = true);

// Handle custom unban activity
directLine.activity$
    .filter(activity => activity.type === 'custom.unban')
    .subscribe(activity => unbanUser(activity.channelData.guildId, activity.channelData.userId).catch(console.error));

/**
 * Helper method that ban a user.
 * The ban is performed by timeouting the user for one day.
 * @param {string} channel Channel in which user should be unbanned
 * @param {string} username The user to unban
 */
const banUser = (channel, username, seconds = 86400) => client.timeout(channel, username, seconds);

/**
 * Helper method that ban a user.
 * @param {string} channel Channel in which user should be unbanned
 * @param {string} username The user to unban
 */
const unbanUser = (channel, username) => client.unban(channel, username);

/**
 * Helper method that delete a message on specific channel
 * The ban is performed by timeouting the user for one day.
 * @param {string} channel 
 * @param {string} username 
 */
const deleteMessage = (channel, messageId) => client.deletemessage(channel, messageId);

client.connect().catch(console.error);