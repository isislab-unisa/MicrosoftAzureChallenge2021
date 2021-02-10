const path = require('path');
const dotenv = require('dotenv');
const CosmosClient = require('@azure/cosmos').CosmosClient;

const ENV_FILE = path.join(__dirname, '../../.env');
dotenv.config({ path: ENV_FILE });

/**
 * Manages reading, adding, and updating channel conversation in Cosmos DB
 */
class ChannelConversationDAO {
   /**
    * Construct a new ChannelConversation DAO. Should be initialized with init() function before use
    * @param {CosmosClient} cosmosClient
    * @param {string} databaseId
    * @param {string} containerdId
    */
   constructor(cosmosClient, databaseId, containerdId) {
      /** @private */
      this._cosmosClient = cosmosClient;
      /** @private */
      this._databaseId = databaseId || process.env.DatabaseId;
      /** @private */
      this._collectionId = containerdId || process.env.ChannelConversationContainerId;
      /** @private */
      this._partitionKey = process.env.ChannelConversationPartitionKey;

      /** @private */
      this._container = null;

      if (!this._cosmosClient) throw ("CosmosClient cannot be null");
      if (!this._databaseId) throw ("You must specify a DatabaseID for this DAO");
      if (!this._collectionId) throw ("You must specify a CollectionID/ContainerID for this DAO");
      if (!this._partitionKey) throw ("You must specify a valid partition key for this DAO");
   }

   /**
    * Perform DAO initialization
    */
   async init() {
      console.info('[INFO]: Setting up the database...');
      const dbResponse = await this._cosmosClient.databases.createIfNotExists({ id: this._databaseId })
      const database = dbResponse.database;
      console.info('[INFO]: Setting up the database...done!');
      console.info('[INFO]: Setting up the container...');
      const containerResponse = await database.containers.createIfNotExists({ id: this._collectionId, partitionKey: { kind: "Hash", paths: [this._partitionKey] } });
      this._container = containerResponse.container;
      console.info('[INFO]: Setting up the container...done!');
   }

   /**
    * Find a ChannelConversation that respect the specified query
    * @param {*} querySpec Query to be performed
    * @typedef {{id, user, channel, number_of_warning, isBanned, bannedUntil, last_messages}} ChannelConversation
    * @returns {ChannelConversation[]}
    */
   async find(querySpec) {
      console.info('[INFO]: Querying for channel conversations from the database...');
      if (!this._container) {
         throw (`Collection is not initialized for ${ChannelConversationDAO.name}. Please, be sure to call init() before call this method`);
      }
      const { resources } = await this._container.items.query(querySpec).fetchAll();
      console.info('[INFO]: Querying for channel conversations from the database... done!')
      return resources;
   }

   /**
    * Get a channel conversation by Id
    * @param {'telegram' | 'discord' | 'twitch' | 'web'} channel The channel of conversation
    * @param {string} conversationId The conversation identifier
    * @typedef {{id, user, channel, number_of_warning, isBanned, bannedUntil, last_messages}} ChannelConversation
    * @returns {ChannelConversation}
    */
   async findById(channel, conversationId) {
      console.info('[INFO]: Querying by Id for channel conversations from the database...');
      if (!this._container) {
         throw (`Collection is not initialized for ${ChannelConversationDAO.name}. Please, be sure to call init() before call this method`);
      }

      const { resource: result } = await this._container.item(conversationId, channel).read();

      console.info('[INFO]: Querying by Id for channel conversations from the database... done!')
      return result;
   }

   /**
    * @typedef {{id, user, channel, number_of_warning, isBanned, bannedUntil, last_messages}} ChannelConversation
    * Store a new channel conversation on db asynchronously
    * @param {ChannelConversation} channelConversation Channel conversation to be created
    * @typedef {{id, user, channel, number_of_warning, isBanned, bannedUntil, last_messages}} ChannelConversation
    * @returns {ChannelConversation}
    */
   async create(channelConversation) {
      console.info('[INFO]: Adding a channel conversation to the database...');
      if (!this._container) {
         throw (`Collection is not initialized for ${ChannelConversationDAO.name}. Please, be sure to call init() before call this method`);
      }

      const { resource: doc } = await this._container.items.create(channelConversation);

      console.info('[INFO]: Adding a channel conversation to the database... done!');
      return doc;
   }

   /**
    * Update a channel conversation on the db with id equals to 
    * @param {*} id The id of channel conversation
    * @param {ChannelConversation} channelConversation The updated channelConversation object
    * @typedef {{id, user, channel, number_of_warning, isBanned, bannedUntil, last_messages}} ChannelConversation
    * @returns {ChannelConversation}
    */
   async update(id, channelConversation) {
      console.info('[INFO]: Updating a channel conversation in the database...');
      if (!this._container) {
         throw (`Collection is not initialized for ${ChannelConversationDAO.name}. Please, be sure to call init() before call this method`);
      }

      const { resource: replaced } = await this._container
         .item(id, channelConversation[this._partitionKey])
         .replace(channelConversation);

      console.info('[INFO]: Updating a channel conversation in the database... done!');
      return replaced;
   }

   /**
    * Remove the specified channel conversation from db
    * @param {ChannelConversation} channelConversation Channel conversation to be removed
    * @typedef {{id, user, channel, number_of_warning, isBanned, bannedUntil, last_messages}} ChannelConversation
    */
   async delete(channelConversation) {
      console.info('[INFO]: Deleting a channel conversation from the database...');
      if (!this._container) {
         throw (`Collection is not initialized for ${ChannelConversationDAO.name}. Please, be sure to call init() before call this method`);
      }

      await this._container
         .item(channelConversation.id, channelConversation[this._partitionKey])
         .delete();

      console.info('[INFO]: Deleting a channel conversation from the database... done!');
   }
}

module.exports.ChannelConversationDAO = ChannelConversationDAO;