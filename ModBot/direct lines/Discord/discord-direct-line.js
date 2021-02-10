"use strict";

global.XMLHttpRequest = require('xhr2');
global.WebSocket = require('ws');

const dotenv = require('dotenv');
const path = require('path');
const Discord = require('discord.js');
const { Activity, DirectLine } = require('botframework-directlinejs');
const mime = require('mime-types');

const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

const directLine = new DirectLine({
    secret: process.env.DiscordDirectLineSecret
});

const client = new Discord.Client();

// Session storage object
const session = {};

client.on('ready', () => {
    console.log(`Logged in on Discord as ${client.user.tag}`);
})

client.on('message', msg => {
    if (msg.author.bot || msg.system)
        return;

    postActivity(msg)
})

/**
 * Post an activity from Discord to Direct Line
 * @param {Discord.Message} event 
 */
const postActivity = async event => {
    let activity;

    if (event.type === 'conversationUpdate')
        activity = event;
    else {
        activity = {
            from: { id: event.author.id, name: event.author.username },
            type: 'message',
            channelData: {channelId: 'discord', conversationId: `${event.guild.id}|${event.author.id}`}
        }

        if (event.content)
            activity.text = event.content;

        await discordAttachmentHandler(event, activity);
    }

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
                    onActivityReceived(id, event);
                else
                    session[id] = { event };

            },
            error => console.error("[ERROR]: Error posting activity:", error)
        );
}
/**
 * Discord logic when an activity from bot is received
 * @param {string} activityId Bot's activity identification
 * @param {Discord.Message} event Discord message origanally sent by the user
 */
const onActivityReceived = (activityId, event) => {
    const { activity, toDelete, toBan } = session[activityId];
    event.channel.send(`<@${event.author.id}> ${activity.text}`);

    if(toBan) {
        banUser(event, event.author.id);
    }

    if (toDelete) {
        event.delete({
            timeout: 100,
            reason: "Inappropriate language"
        });
    }

    delete session[activityId];
}

// Handle all activity messages sent by the bot
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
                onActivityReceived(activity.replyToId, session[activity.replyToId].event);
            }
            else {
                session[activity.replyToId] = { activity }
            }
        }
    );

// Unhandled activity logic
directLine.activity$
    .filter(activity => activity.type !== 'message' && 
            activity.type !== 'custom.delete' && 
            activity.type !== 'custom.ban' &&
            activity.type !== 'custom.unban' &&
            activity.from.id === process.env.AzureBotName)
    .subscribe(
        activity => {
            console.warn("[WARN]: Unhandled activity", activity)
        }
    );

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
    .subscribe(activity => unbanUser(activity.channelData.guildId, activity.channelData.userId));

/**
 * Helper method that ban a user
 * @param {Discord.Message} msg 
 * @param {string} userId 
 */
const banUser = (msg, userId) => {
    const { guild } = msg;
    let role = guild.roles.cache.find(role => role.name === "Banned");
    if(!role) {
        // If the role does not exist will be created
        guild.roles.create({
            data: {
                name: "Banned",
                color: "RED",
                mentionable: false,
                hoist: true,
                permissions: Discord.Permissions.FLAGS.READ_MESSAGE_HISTORY
            }
        }).then(role => {
            const channels = guild.channels.cache.array();
            channels.forEach(channel => channel.updateOverwrite(role, {SEND_MESSAGES: false, ADD_REACTIONS: false, CREATE_INSTANT_INVITE: false, SPEAK: false, STREAM: false}))
            msg.guild.members.resolve(userId).roles.add(role);
        });
    }
    else {
        msg.guild.members.resolve(userId).roles.add(role);
    }
}

/**
 * Helper function that unban a user in specified guild
 * @param {string} guildId The guild identifier in wich search user
 * @param {string} userId The discord id to unban
 */
const unbanUser = (guildId, userId) => {
    const guild = client.guilds.resolve(guildId);
    if(!guild) {
        console.warn("[WARN]: GUILD not found");
        return;
    }
    const role = guild.roles.cache.find(role => role.name === "Banned");
    if(!role) {
        console.warn("[WARN]: Cannot find role you are looking for");
        return;
    }
    let toUnban = guild.members.resolve(userId);
    if(!toUnban) {
        console.info("[INFO]: Cannot find user with specified id. Trying to fetch users...");
        guild.members.fetch().then(members => {
            toUnban = members.get(userId)
            if(!toUnban) {
                console.warn("[WARN]: The user is not in this guild");
                return;
            }
            else
                console.info("[INFO]: User found! Removing role...");
            toUnban.roles.remove(role);
        }).catch(err => console.error(err));
    }
    else
        toUnban.roles.remove(role);
}

/**
 * Helper function that adds attachments received from Discord to Activity object to be sent to Direct Line. Manipulates the passed in Activity.
 * @param {Discord.Message} message Message received from discord
 * @param {Activity} activity the activity to be posted
 */
const discordAttachmentHandler = async (message, activity) => {
    const discordAttachments = message.attachments;

    if (discordAttachments.size != 0 && !activity.attachments) {
        activity.attachments = [];
        activity.channelData.attachmentSizes = [];
    }

    const keys = discordAttachments.keyArray();

    if (!keys || keys.length === 0)
        return;
    else
        activity.type = 'event';

    for (let i = 0; i < keys.length; i++) {
        const attachment = discordAttachments.get(keys[i]);

        const contentType = getContentType(discordUrlParser(attachment.proxyURL));

        if (!contentType.includes("image/"))
            continue;

        activity.attachments.push({
            name: attachment.name,
            contentType,
            contentUrl: attachment.proxyURL,
        });
    }
}

/**
 * URL parser for Discord-sent attachments. To be used in conjunction with DiscordConnector.getContentType()
 * @param {string} url 
 */
const discordUrlParser = url => {
    var parsedProxy = url.split(/https:\/\/media.discordapp.net\/attachments\/\d{18}\/\d{18}\//);
    var parsedUrl = url.split(/https:\/\/cdn.discordapp.com\/attachments\/\d{18}\/\d{18}\//);
    var filename = parsedProxy.length > parsedUrl.length ? parsedProxy[1] : parsedUrl[1];
    if (!filename) {
        console.warn('[WARN]: filename for attachment from Discord not found.');
        return;
    }
    return filename;
}

/**
 * Helper function that returns attachment's MIME-type via file extension provided by Discord. Defaults to 'application/octet-stream'
 * @param {string} filename 
 */
const getContentType = filename => {
    return mime.lookup(filename) ? mime.lookup(filename) : 'application/octet-stream';
}

client.login(process.env.DiscordBotToken).catch(e => console.error("[ERROR]:", e))