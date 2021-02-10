"use strict";

const path = require('path');
const dotenv = require('dotenv');

// Import required bot configuration.
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

/**
 * Manages reading, adding, and updating user info in Cosmos DB
 */
class UserDAO {
  /**
   * Construct a new userDAO. Should be initialized with init() function before use
   * @param {CosmosClient} cosmosClient
   * @param {string} databaseId
   * @param {string} containerId
   */
  constructor(cosmosClient, databaseId, containerId, partitionKey) {
    /** @private */
    this._cosmosClient = cosmosClient;
    /** @private */
    this._databaseId = databaseId || process.env.DatabaseId;
    /** @private */
    this._collectionId = containerId || process.env.ContainerId;
    /** @private */
    this._partitionKey = partitionKey || process.env.partitionKey;

    if (!this._databaseId) throw ("You must specify a DatabaseID")
    if (!this._collectionId) throw ("You must specify a CollectionID/ContainerID")
    if (!this._partitionKey) throw ("You must specify a Partition Key")

    /** @private */
    this._container = null
  }

  /**
   * Performs DAO initialization
   */
  async init() {
    console.info('[INFO]: Setting up the database...');
    const dbResponse = await this._cosmosClient.databases.createIfNotExists({
      id: this._databaseId
    })
    const database = dbResponse.database;
    console.info('[INFO]: Setting up the database...done!');
    console.info('[INFO]: Setting up the container...');
    const containerResponse = await database.containers.createIfNotExists({ id: this._collectionId, partitionKey: { kind: "Hash", paths: [this._partitionKey] } });
    this._container = containerResponse.container
    console.info('[INFO]: Setting up the container...done!');
  }

    /**
    * Find a user with the id and the channel
    * @param {'telegram' | 'discord' | 'twitch' | 'web'} channel The channel user belongs to 
    * @param {string} id The user identification for the channel
    * @typedef {{id, channel}} User
    * @returns {User} User ready to be stored
    */
   async find(query) {
    if (!this._container) {
      throw new Error(`Collection is not initilized for ${userDAO.name}. Please, be sure to call init() before calling this method`)
    }
    console.info('[INFO]: Querying for user from the database');
    const { resources } = await this._container.items.query(query).fetchAll();
    return resources
  }
  
  /**
    * Find a user with the id and the channel
    * @param {'telegram' | 'discord' | 'twitch' | 'web'} channel The channel user belongs to 
    * @param {string} id The user identification for the channel
    * @typedef {{id, channel}} User
    * @returns {User} User ready to be stored
    */
  async findById(channel, id) {
    if (!this._container) {
      throw new Error(`Collection is not initilized for ${userDAO.name}. Please, be sure to call init() before calling this method`)
    }
    console.info('[INFO]: Querying for user from the database');
    const { resource } = await this._container.item(id, channel).read();
    return resource;
  }

  /**
    * Store a new user on db
    * @param {User} user User to be created
    * @typedef {{id, channel}} User
    */
  async create(user) {
    console.info('[INFO]: Adding a user to the database...');
    const { resource: doc } = await this._container.items.create(user);
    console.info('[INFO]: Adding a user to the database... done!');
    return doc;
  }

  /**
    * Update an user on the db with id equals to 
    * @param {*} userID The id of the user
    * @param {User} user The updated user object
    * @typedef {{id, channel} User
    */
  async update(userId, user) {
    console.info('[INFO]: Updating an user in the database...');

    const { resource: replaced } = await this._container
      .item(userId, user[this._partitionKey])
      .replace(user)

    console.info('[INFO]: Updating an user in the database... done!');
    return replaced;
  }

  /**
    * Remove the specified user from db
    * @param {User} user User to be removed
    * @typedef {{id, channel}} User
    */
  async delete(user) {
    console.info('[INFO]: Deleting an user from the database...');

    await this._container
      .item(user.id, user[this._partitionKey])
      .delete();

    console.info('[INFO]: Deleting an user from the database... done!');
  }
}

module.exports.userDAO = UserDAO;