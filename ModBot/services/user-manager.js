"use strict";

const CosmosClient = require("@azure/cosmos").CosmosClient;
const { userDAO } = require('./db/user-dao');

class UserManager {
    constructor() {
        // This client is a parameter for the DAO
        this.cosmosClient = new CosmosClient({
            endpoint: process.env.CosmosDbEndpoint ,
            key: process.env.CosmosDbKey
        })
        
        // Field for the persistence
        this.userDAO = new userDAO(this.cosmosClient);
    }

    /**
     * Inizialize the manager for the user.
     */
    async init() {
        console.info("[INFO]: Initializing user manager...");
        await this.userDAO.init();
        console.info("[INFO]: Initializing user manager... Done!");   
    }

    /**
     * Add a new user to DB due to incorrect behavior.
     * @param {User} user The user that has an incorrect behavior
     * @typedef {{id, channel}} User
     */
    async add(user) {     
        await this.userDAO.create(user);
        console.info("[INFO]: New user added!");
    }

    /**
     * Find the user with the specified id on the corresponding channel
     * @param {string} userId Unique identifier of the user in that specified channel
     * @param {'telegram' | 'discord' | 'twitch' | 'web'} channel The channel user belongs to
     * @typedef {{id, channel}} User
     * @returns {User} User ready to be stored
     */
    async find(userId, channel) {
        return await this.userDAO.findById(userId, channel);
    }

    /**
     * Get all users of all channels stored in the db
     * 
     */
    async findAll() {
        const query = `SELECT * FROM c`;
        return await this.userDAO.find(query);
    }

    /**
     * Get all users of the specified channel stored in the db
     * @param {'telegram' | 'discord' | 'twitch' | 'web'} channel The channel user belongs to
     * 
     */
    async findAllByChannel (channel) {
        const query = {
            query: `SELECT * FROM c where c.channel=@channel`,
            parameters: [{ name: "@channel", value: channel }]
        } 
        return await this.userDAO.find(query);
    }

    /**
     * Change the identifier of an user for the specified channel
     * @param {string} oldId The current id
     * @param {'telegram' | 'discord' | 'twitch' | 'web'} channel The channel user belongs to
     * @param {string} newId The new value for id property
     * @typedef {{id, channel}} User
     * @returns {User} User with new id
     */ 
    async updateId (oldId, channel, newId) {
        const user = await this.find(oldId, channel);
        user.id = newId;
        return await this.userDAO.update(oldId, user);
    }
}

module.exports.UserManager = UserManager;

