class EntityBuilder {
    /**
     * Create a user that should be stored in db
     * @param {string} userId The user identification for the channel
     * @param {'telegram' | 'discord' | 'twitch' | 'web'} channel The channel user belongs to
     * @typedef {{id, channel}} User
     * @returns {User} User ready to be stored
     */
    static createUser(userId, channel) {
        const user = {
            id: userId,
            channel
        }

        return user;
    }

    /**
     * Create a channelConversation that should be stored on db
     * @param {string} conversationId Conversation identification
     * @param {string} userId The user identification for the channel
     * @param {'telegram' | 'discord' | 'twitch' | 'web'} channel The channel user belongs to
     * @param {Number} warnings Number of warn received by user
     * @param {boolean} isBanned status of user. True if is banned, else otherwise
     * @param {Date} bannedUntil the date when the user will be unbanned.
     * @param {Array} last_messages a list of last 7 messages sent by the user. Used for detect chat flood
     * @typedef {{id, user, channel, number_of_warning, isBanned, bannedUntil, last_messages}} ChannelConversation
     * @returns {ChannelConversation} ChannelConversation ready to be stored
     */
    static createChannelConversation(conversationId, userId, channel, warnings = 0, isBanned = false, bannedUntil = null, last_messages = []) {
        const channelConversation = {
            id: conversationId,
            user: userId,
            channel,
            number_of_warning: warnings,
            isBanned,
            bannedUntil: bannedUntil ? Math.floor(bannedUntil.getTime() / 1000) : bannedUntil, // Save date in timestamp format
            last_messages
        };

        return channelConversation;
    }

    /**
     * Create a messagge that should be added to last_messages list of a conversation
     * @param {'text' | 'attachment'} type Message type
     * @param {Date} timestamp timestamp of message
     * @param {string} content content of message. Must be an URL if type is 'attachment'.
     * @typedef {{type, timestamp, content}} MessageInfo
     * @returns {MessageInfo} MessageInfo ready to be stored
     */
    static createMessageInfo(type, timestamp, content) {
        const message = {
            type,
            timestamp: Math.floor(timestamp.getTime() / 1000), // Save date in timestamp format
            content
        };

        return message;
    }
}

module.exports.EntityBuilder = EntityBuilder;