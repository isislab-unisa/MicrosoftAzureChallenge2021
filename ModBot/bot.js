// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { Attachment, ActivityHandler, MessageFactory, ActivityFactory, TurnContext, ConsoleTranscriptLogger } = require('botbuilder');
const { ContentModerator } = require('./services/content-moderator');
const { TextAnalytics } = require('./services/text-analytics');
const { UserManager } = require('./services/user-manager');
const { ChannelConversationManager } = require('./services/channel-conversation-manager');
const { locales } = require('./locales');
const { EntityBuilder } = require('./services/db/entity-builder');
const axios = require('axios');

const MAX_WARNINGS = 3;

class ModBot extends ActivityHandler {
    constructor() {
        super();
        // Field for the moderation service
        this.contentModerator = new ContentModerator();
        // Field for the text analytics service
        this.textAnalytics = new TextAnalytics();
        // Field for the persistence
        this.userManager = new UserManager();
        this.userManager.init();

        this.channelConversationManager = new ChannelConversationManager();
        this.channelConversationManager.init();

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const receivedText = context.activity.text;
            const attachments = context.activity.attachments;

            // channelId from directLine or from supported channels
            const channelId = context.activity.channelData.channelId || context.activity.channelId;
            // channelId from directLine or from supported channels
            const conversationId = context.activity.channelData.conversationId || (context.activity.conversation.id + "|" + context.activity.from.id);

            let user = await this.userManager.find(channelId, context.activity.from.id);
            if (!user) {
                user = EntityBuilder.createUser(context.activity.from.id, channelId);
                await this.userManager.add(user);
            }

            let channelConversation = await this.channelConversationManager.findById(user.channel, conversationId);
            if (!channelConversation) {
                // If is the first time that user commint an infraction in this channel, then store it
                channelConversation = EntityBuilder.createChannelConversation(conversationId, context.activity.from.id, user.channel);
                await this.channelConversationManager.addChannelConversation(channelConversation);
            }

            if (channelConversation.isBanned === true) {
                // Direct line should manage the ban activity
                if (context.activity.channelId !== "directline")
                    await this._deleteActivity(context);
            }
            else {
                const language = await this._onTextReceived(context, receivedText, channelConversation);
                // If the user sends a text message
                if (language) {
                    const SECONDS_LIMIT = 3;
                    const conversationLength = channelConversation.last_messages.length;
                    if (conversationLength > 3) {
                        const lastDelay = channelConversation.last_messages[conversationLength - 1].timestamp -
                            channelConversation.last_messages[conversationLength - 2].timestamp;

                        const secondLastDelay = channelConversation.last_messages[conversationLength - 2].timestamp -
                            channelConversation.last_messages[conversationLength - 3].timestamp;

                        // Flooding detected                        
                        if (lastDelay < SECONDS_LIMIT && secondLastDelay < SECONDS_LIMIT) {
                            console.info("The user is sending messages to quickly.");
                            const isBanned = await this._warn(channelConversation);
                            let replyText = "";
                            if (isBanned === true) {
                                const user = context.activity.from.name || context.activity.from.id;
                                replyText = user + locales[language].ban_message;
                            } else {
                                replyText = locales[language].reply_flooding;
                            }

                            await context.sendActivity(MessageFactory.text(replyText));
                        }
                    }
                }
                await this._onAttachmentsReceived(context, attachments, language, channelConversation);
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onEvent(async (context, next) => {
            // Handle only messages with attachments on Direct Line
            if (!context.activity.attachments) {
                console.warn("[WARN]: This message should be not here", context.activity);
                await next();
                return;
            }

            // channelId from directLine or from supported channels
            const channelId = context.activity.channelData.channelId || context.activity.channelId;
            // channelId from directLine or from supported channels
            const conversationId = context.activity.channelData.conversationId || (context.activity.conversation.id + "|" + context.activity.from.id);

            let user = await this.userManager.find(channelId, context.activity.from.id);
            if (!user) {
                user = EntityBuilder.createUser(context.activity.from.id, channelId);
                await this.userManager.add(user);
            }

            let channelConversation = await this.channelConversationManager.findById(user.channel, conversationId);
            if (!channelConversation) {
                // If is the first time that user commint an infraction in this channel, then store it
                channelConversation = EntityBuilder.createChannelConversation(conversationId, context.activity.from.id, user.channel);
                await this.channelConversationManager.addChannelConversation(channelConversation);
            }

            if (channelConversation.isBanned === true) {
                // Direct line should manage the ban activity
                if (context.activity.channelId !== "directline")
                    await this._deleteActivity(context);
            }
            else {
                const attachments = context.activity.attachments;
                await this._onAttachmentsReceived(context, attachments, "eng", channelConversation);
            }

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const user = context.activity.from.name || context.activity.from.id;
            let index = Math.floor(Math.random() * Math.floor(locales["ita"].on_members_added_message.length));
            const welcomeText = user + locales["ita"].on_members_added_message[index];
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    };

    /**
     * Perform logic on text to detect bad words and personal infos 
     * @param {TurnContext} context 
     * @param {string} receivedText 
     * @param {ChannelConversation} channelConversation current conversation
     * @typedef {{id, user, channel, number_of_warning, isBanned, bannedUntil, last_messages}} ChannelConversation
     * @returns {string} Language spoken by the user in the bot
     */
    async _onTextReceived(context, receivedText, channelConversation) {
        if (!receivedText || receivedText.trim() === "")
            return;

        // Store the message sent for chat flooding detection
        this.channelConversationManager.addMessage(channelConversation, context.activity.localTimestamp || new Date(), "text", context.activity.text);

        const response = (await this.contentModerator.checkText(receivedText)).data;
        let replyText = "";
        const user = context.activity.from.name || context.activity.from.id;

        // Azure Content Moderator service finds insults and forbidden language
        if (response.Classification) {
            if (response.Classification.ReviewRecommended)
                replyText += `${locales[response.Language].reply_classification}`;
        } else if (response.Terms) {
            replyText += `${locales[response.Language].reply_dirty_words}`;
        } else if (this._isScreaming(receivedText, 55) === true) {
            // The received text is all uppercase     
            replyText = context.activity.channelId === "directline" ? `${locales[response.Language].reply_to_screaming}` : `${user}: ${locales[response.Language].reply_to_screaming}`;
            await context.sendActivity(MessageFactory.text(replyText));
            return response.Language;
        }

        const textAnalyticsResponse = (await this.textAnalytics.checkPII("1", receivedText)).data;

        // Moderation on personal infos
        // Message is not deleted automatically: the user can do it manually if he wants.
        if (textAnalyticsResponse.documents[0].entities.length > 0) {
            // Text Analytics service considers simple names as personal infos. We need to filter the response
            const forbiddenEntities = textAnalyticsResponse.documents[0].entities.filter(entity => entity.category !== "Person");
            if (forbiddenEntities.length > 0) {
                replyText = context.activity.channelId === "directline" ? `${locales[response.Language].reply_personal_info}` : `${user}: ${locales[response.Language].reply_personal_info}`;
                // No warnings for sharing personal infos        
                await context.sendActivity(MessageFactory.text(replyText));
                return response.Language;
            }
        }

        if (replyText != "") {
            const isBanned = await this._warn(channelConversation);
            if (isBanned === true) {
                replyText = `${locales[response.Language].ban_message}`;
                // Get conversation refence and store to db
                const conversationReference = TurnContext.getConversationReference(context.activity);
                this.channelConversationManager.addConversationReference(channelConversation, conversationReference);
            }

            if (context.activity.channelId !== "directline")
                replyText = `${user}: ${replyText}`;

            await context.sendActivity(MessageFactory.text(replyText));

            if (isBanned === true)
                switch (context.activity.channelId) {
                    case "directline":
                        await this._directLineBan(context);
                        break;
                    case "telegram":
                        await this._telegramBan(channelConversation);
                        break;
                    default:
                        break;
                }

            await this._deleteActivity(context);
        }

        return response.Language;
    }

    /**
     * Perform logic on attachments (only images) to detect adult content 
     * @param {TurnContext} context 
     * @param {Attachment[]} attachments 
     * @param {string} language Language spoken by the user in the bot
     * @param {*} channelConversation
     */
    async _onAttachmentsReceived(context, attachments, language = "eng", channelConversation) {
        if (!attachments)
            return;

        for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];

            if (!attachment.contentType.includes("image/"))
                continue;

            // Store the message sent for chat flooding detection
            await this.channelConversationManager.addMessage(channelConversation, context.activity.localTimestamp || new Date(), "attachment", attachment.contentUrl);

            const response = (await this.contentModerator.checkImage(attachment.contentUrl)).data;
            if (response.IsImageAdultClassified || response.IsImageRacyClassified) {
                let replyText;

                const isBanned = await this._warn(channelConversation);
                if (isBanned === true) {
                    const user = context.activity.from.name || context.activity.from.id;
                    replyText = user + locales[language].ban_message;
                }
                else
                    replyText = locales[language].reply_bad_image;

                await context.sendActivity(MessageFactory.text(replyText));

                if (isBanned === true)
                    switch (context.activity.channelId) {
                        case "directline":
                            await this._directLineBan(context);
                            break;
                        case "telegram":
                            await this._telegramBan(channelConversation);
                            break;

                        default:
                            break;
                    }

                await this._deleteActivity(context);
            }
        }
    }

    /**
     * Warn the channel conversation. 
     * If the number of warning is greater then MAX_WARNINGS the user'll be banned in this channel conversation
     * @param {*} channelConversation 
     * @returns {boolean} true if the user is now banned, false otherwise
     */
    async _warn(channelConversation) {
        if (channelConversation.number_of_warning + 1 > MAX_WARNINGS) {
            // Banned for one day
            await this.channelConversationManager.ban(channelConversation);
            return true;
        }
        else {
            await this.channelConversationManager.warn(channelConversation);
            return false;
        }
    }

    /**
     * Send a ban message on direct line
     * @param {TurnContext} context 
     */
    async _directLineBan(context) {
        const banEvent = ActivityFactory.fromObject({ activity_id: context.activity.id });
        banEvent.type = 'custom.ban';
        await context.sendActivity(banEvent);
    }

    /**
     * Send a ban request on Telegram
     * @param {*} channelConversation 
     */
    async _telegramBan(channelConversation) {
        const options = {
            baseUrl: "",
            url: `${process.env.AzureFunctionURL}/api/ban/telegram/${channelConversation.id.split('|')[0]}/${channelConversation.user}`,
            method: 'GET',
            headers: {
                'x-functions-key': process.env.BanFunctionKey,
            }
        };
        try {
            await axios.request(options);
        }
        catch (e) {
            console.error(e);
        }
    }

    /**
     * @async Delete a message on Telegram
     * @param {*} channelData 
     */
    async _deleteTelegramMessage(channelData) {
        const options = {
            baseUrl: "",
            url: `${process.env.AzureFunctionURL}/api/deleteMsg/${channelData.message.chat.id}/${channelData.message.message_id}`,
            method: 'GET',
            headers: {
                'x-functions-key': process.env.BanFunctionKey,
            }
        };
        try {
            await axios.request(options);
        }
        catch (e) {
            console.error(e);
        }
    }

    /**
     * Manage the logic for unban users
     * @param {TurnContext} context 
     * @param {*} channelConversation Channel conversation to unban
     */
    async sendUnbanActivity(context, channelConversation) {

        this.channelConversationManager.unban(channelConversation);

        switch (channelConversation.channel) {
            case "discord":
            case "twitch":
                // Direct line(s)
                const unbanEvent = ActivityFactory.fromObject({ activity_id: context.activity.id });
                unbanEvent.type = 'custom.unban';
                const [guildId, userId] = channelConversation.id.split("|");
                unbanEvent.channelData = { guildId, userId }
                await context.sendActivity(unbanEvent);
                break;
            case "telegram":
                const options = {
                    baseUrl: "",
                    url: `${process.env.AzureFunctionURL}/api/ban/${channelConversation.channel}/${channelConversation.id.split('|')[0]}/${channelConversation.user}`,
                    method: 'DELETE',
                    headers: {
                        'x-functions-key': process.env.UnbanFunctionKey,
                    }
                };
                try {
                    await axios.request(options);
                }
                catch (e) {
                    console.error(e);
                }

                break;
            default:
                // Emulator, web chat and others
                break;
        }
    }

    /**
     * Delete the activity in context
     * @param {TurnContext} context 
     */
    async _deleteActivity(context) {
        const channel = context.activity.channelId;
        try {
            switch (channel) {
                case "telegram":
                    this._deleteTelegramMessage(context.activity.channelData)
                    break;
                default:
                    await context.deleteActivity(context.activity.id);
                    break;
            }
        } catch (e) {
            // If the channel does not support deleteActivity, a custom event will be triggered
            const deleteEvent = ActivityFactory.fromObject({ activity_id: context.activity.id });
            deleteEvent.type = 'custom.delete'
            await context.sendActivity(deleteEvent);
        }
    }

    /**
     * Checks if most of the sentence is capitalized. In a chat,to write all the text in uppercase
       is equal to scream
     * @param {string} text A string representing the sentence
     * @param {number} threshold An integer value that represents the percentage of capital letters allowed
     */
    _isScreaming(text, threshold = 55) {
        const upperLength = text.replace(/[^A-Z]/g, '').length;
        const percentage = (upperLength * 100) / text.replace(/\s/g, '').length;

        if (percentage >= threshold) {
            return true;
        }
        return false;
    }
}

module.exports.ModBot = ModBot;
